import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Holding, PortfolioContextType } from '../types';

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
};

interface PortfolioProviderProps {
    children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedOwner, setSelectedOwner] = useState<string>('All');
    const [owners, setOwners] = useState<string[]>([]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

    useEffect(() => {
        fetchHoldings();
    }, []);

    const fetchQuote = async (ticker: string) => {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_URL}/api/quote/${ticker}?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch quote');
            const data = await response.json();
            // validate data
            if (!data || typeof data.regularMarketPrice !== 'number') {
                console.warn(`Invalid quote data for ${ticker}:`, data);
                return null;
            }
            return data;
        } catch (error) {
            console.error(`Error fetching quote for ${ticker}:`, error);
            return null;
        }
    };

    const fetchHoldings = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_URL}/api/holdings?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (response.ok) {
                const data = await response.json();
                const mapped: Holding[] = data.map((h: any) => ({
                    _id: h._id,
                    ticker: h.ticker,
                    qty: h.qty,
                    avgCost: h.avgCost,
                    purchaseDate: h.purchaseDate,
                    owner: h.owner || 'Default User',
                    currentPrice: 0,
                    previousClose: 0,
                    name: h.ticker
                }));

                // Extract unique owners
                const uniqueOwners = Array.from(new Set(mapped.map(h => h.owner)));
                setOwners(uniqueOwners);

                // Fetch live prices
                const holdingsWithQuotes = await Promise.all(mapped.map(async (h) => {
                    const quote = await fetchQuote(h.ticker);
                    return {
                        ...h,
                        currentPrice: quote?.regularMarketPrice || h.avgCost,
                        previousClose: quote?.regularMarketPreviousClose || h.avgCost,
                        name: quote?.longName || h.ticker
                    };
                }));
                setHoldings(holdingsWithQuotes);
            }
        } catch (error) {
            console.error('Failed to fetch holdings:', error);
        }
        setLoading(false);
    };

    const searchTicker = async (query: string) => {
        try {
            const response = await fetch(`${API_URL}/api/search?q=${query}`);
            if (!response.ok) throw new Error('Failed to search ticker');
            const data = await response.json();
            console.log('Search Raw Data:', data);
            const quotes = data.quotes || [];
            const filtered = quotes.filter((q: any) => {
                const hasSymbol = q && typeof q.symbol === 'string';
                if (!hasSymbol) return false;

                // Prioritize Indian stocks
                const isNSE = q.exchange === 'NSI' || q.symbol.endsWith('.NS');
                const isBSE = q.exchange === 'BOM' || q.symbol.endsWith('.BO');

                return isNSE || isBSE;
            });
            console.log('Filtered Results:', filtered);
            return filtered;
        } catch (error) {
            console.error(`Error searching ticker ${query}:`, error);
            return [];
        }
    };

    const addHolding = async (ticker: string, qty: number, price: number, date: string, owner: string): Promise<boolean> => {
        setLoading(true);
        const quote = await fetchQuote(ticker);

        if (!quote || !quote.regularMarketPrice) {
            console.error('Validation failed: No valid quote found for', ticker);
            setLoading(false);
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/api/holdings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, qty, avgCost: price, purchaseDate: date, owner })
            });

            if (response.ok) {
                await fetchHoldings();
                setLoading(false);
                return true;
            }
        } catch (error) {
            console.error('Error adding holding:', error);
        }
        setLoading(false);
        return false;
    };

    const editHolding = async (id: string, qty: number, price: number, date: string, owner: string): Promise<boolean> => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/holdings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qty, avgCost: price, purchaseDate: date, owner })
            });

            if (response.ok) {
                await fetchHoldings();
                setLoading(false);
                return true;
            }
        } catch (error) {
            console.error('Error editing holding:', error);
        }
        setLoading(false);
        return false;
    };

    const removeHolding = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/holdings/${id}`, { method: 'DELETE' });
            setHoldings(prev => prev.filter(h => h._id !== id));
        } catch (error) {
            console.error('Error deleting holding:', error);
        }
    };

    const refreshPrices = async () => {
        setLoading(true);
        const updatedHoldings = await Promise.all(holdings.map(async (h) => {
            const quote = await fetchQuote(h.ticker);
            return {
                ...h,
                currentPrice: quote?.regularMarketPrice || h.currentPrice,
                previousClose: quote?.regularMarketPreviousClose || h.previousClose,
                name: quote?.longName || h.name
            };
        }));
        setHoldings(updatedHoldings);
        setLoading(false);
    };

    const filteredHoldings = selectedOwner === 'All' ? holdings : holdings.filter(h => h.owner === selectedOwner);

    const totalCost = filteredHoldings.reduce((acc, curr) => acc + (curr.qty * curr.avgCost), 0);
    const totalValue = filteredHoldings.reduce((acc, curr) => acc + (curr.qty * curr.currentPrice), 0);
    const totalPL = totalValue - totalCost;

    // Calculate Today's P/L based on previous close
    const todaysPL = filteredHoldings.reduce((acc, curr) => {
        const todayChange = curr.currentPrice - curr.previousClose;
        return acc + (todayChange * curr.qty);
    }, 0);

    return (
        <PortfolioContext.Provider value={{
            holdings: filteredHoldings,
            addHolding,
            editHolding,
            searchTicker,
            removeHolding,
            refreshPrices,
            loading,
            totalValue,
            totalCost,
            totalPL,
            todaysPL,
            selectedOwner,
            setSelectedOwner,
            owners
        }}>
            {children}
        </PortfolioContext.Provider>
    );
};
