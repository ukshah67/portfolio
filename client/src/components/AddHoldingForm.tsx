import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const AddHoldingForm: React.FC = () => {
    const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { addHolding, sellHolding, searchTicker, loading, holdings, selectedOwner, owners } = usePortfolio();
    const [ticker, setTicker] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [owner, setOwner] = useState('');

    // Pre-fill owner based on global selected owner if not 'All'
    useEffect(() => {
        if (selectedOwner !== 'All' && !owner) {
            setOwner(selectedOwner);
        }
    }, [selectedOwner]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            console.log('Debounce triggered for:', ticker);
            if (ticker.length > 1) { // lowered from 2 to 1 for faster feedback
                console.log('Calling searchTicker...');
                const results = await searchTicker(ticker);
                console.log('Search results:', results);
                setSuggestions(results);
                if (results.length > 0) {
                    setShowDropdown(true);
                }
            } else {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [ticker, searchTicker]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // We can check if click is inside the form or specific container, 
            // but for simplicity, if we click anywhere outside the suggestion box and input, close it.
            // Actually, simplest is to delay close on blur is okay, but user said it's not showing.
            // Let's remove the onBlur and use this.
            const target = event.target as HTMLElement;
            if (!target.closest('.search-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker || !qty || !price || !date || !owner.trim()) return;
        setError(null);
        setShowDropdown(false);

        const currentQty = Number(qty);

        if (transactionType === 'SELL') {
            const ownedQty = holdings
                .filter(h => h.ticker === ticker.toUpperCase() && h.owner === owner)
                .reduce((sum, h) => sum + h.qty, 0);

            if (currentQty > ownedQty) {
                setError(`You only own ${ownedQty} shares of ${ticker.toUpperCase()} in ${owner}'s portfolio. You cannot sell ${currentQty}.`);
                return;
            }

            const success = await sellHolding(ticker.toUpperCase(), currentQty, Number(price), date, owner);
            if (success) {
                setTicker('');
                setQty('');
                setPrice('');
                setDate(new Date().toISOString().split('T')[0]);
                setSuggestions([]);
            } else {
                setError('Failed to process sell transaction.');
            }
        } else {
            const success = await addHolding(ticker.toUpperCase(), currentQty, Number(price), date, owner);
            if (success) {
                setTicker('');
                setQty('');
                setPrice('');
                setDate(new Date().toISOString().split('T')[0]);
                setSuggestions([]);
            } else {
                setError(`Failed to add holding. Ensure "${ticker}" is a valid NSE/BSE symbol.`);
            }
        }
    };

    const handleSuggestionClick = (symbol: string) => {
        setTicker(symbol);
        setError(null);
        setShowDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && showDropdown && suggestions.length > 0) {
            const firstSuggestion = suggestions[0];
            setTicker(firstSuggestion.symbol);
            setError(null);
            setShowDropdown(false);
        }
    };

    // Calculate currently owned qty for the form
    const ownedQty = React.useMemo(() => {
        return holdings
            .filter(h => h.ticker === ticker.toUpperCase() && h.owner === owner)
            .reduce((sum, h) => sum + h.qty, 0);
    }, [holdings, ticker, owner]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setTransactionType('BUY')}
                    className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${transactionType === 'BUY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowDownCircle className="mr-2" size={18} />
                    Buy Stocks
                </button>
                <button
                    onClick={() => setTransactionType('SELL')}
                    className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${transactionType === 'SELL' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowUpCircle className="mr-2" size={18} />
                    Sell Stocks
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <label className="block text-base font-semibold text-slate-700 mb-2">Ticker Symbol</label>
                    <div className="relative search-container">
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. RELIANCE.NS"
                            className="w-full pl-12 pr-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold uppercase shadow-sm"
                            autoComplete="off"
                        />
                        <Search className="absolute left-4 top-5 text-slate-400" size={24} />

                        {showDropdown && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.symbol}
                                        type="button"
                                        onClick={() => handleSuggestionClick(s.symbol)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 line-clamp-1">{s.shortname || s.longname || s.symbol}</span>
                                            <span className="text-sm text-slate-500">{s.symbol}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-white flex-shrink-0 ml-2">{s.exchange}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="mt-2 text-red-500 text-sm font-medium">{error}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Quantity</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0"
                            min="1"
                            className={`w-full px-4 py-4 text-xl border rounded-xl focus:outline-none focus:ring-4 transition-all font-medium shadow-sm ${transactionType === 'SELL' && ownedQty > 0 && Number(qty) > ownedQty
                                ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-500'
                                : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'
                                }`}
                        />
                        {transactionType === 'SELL' && ticker && owner && (
                            <p className={`mt-2 text-sm font-medium ${ownedQty > 0 ? 'text-slate-500' : 'text-rose-500'}`}>
                                Shares owned: {ownedQty}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">{transactionType === 'BUY' ? 'Buy Price (₹)' : 'Sell Price (₹)'}</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Date of {transactionType === 'BUY' ? 'Purchase' : 'Sale'}</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Portfolio Owner</label>
                        <input
                            type="text"
                            list="owner-suggestions"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                            autoComplete="off"
                        />
                        <datalist id="owner-suggestions">
                            {owners.map(o => (
                                <option key={o} value={o} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !ticker || !qty || !price || (transactionType === 'SELL' && Number(qty) > ownedQty)}
                    className={`w-full text-white text-xl font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2 ${transactionType === 'BUY' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                >
                    {loading ? 'Processing...' : (transactionType === 'BUY' ? 'Add Holding' : 'Sell Shares')}
                </button>
            </form>
        </div>
    );
};

export default AddHoldingForm;
