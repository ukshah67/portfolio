import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import mongoose from 'mongoose';
import Holding from './models/Holding';
import authRouter, { authenticateToken } from './auth';
import fs from 'fs';
import path from 'path';

// Load Indian Stocks DB once on startup
let indianStocks: any[] = [];
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'indianStocks.json'), 'utf8');
    indianStocks = JSON.parse(rawData);
    console.log(`Loaded ${indianStocks.length} Indian stocks into local search engine.`);
} catch (e) {
    console.error('Failed to load indianStocks.json', e);
}

const app = express();
const port = process.env.PORT || 3002;
const yahooFinance = new YahooFinance({
    suppressNotices: ['ripHistorical', 'yahooSurvey']
});

app.use(cors());
app.use(express.json());

// Main Auth Endpoints - Public login, protected register/users (Fix applied Mar 6)
app.use('/api/auth', authRouter);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio-db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Endpoints

// Get all holdings
app.get('/api/holdings', authenticateToken, async (req: any, res: any) => {
    try {
        // Scope the query if the user is not an admin
        let query = {};
        if (req.user.role === 'user') {
            query = { owner: req.user.portfolioOwnerName };
        }

        const holdings = await Holding.find(query).sort({ createdAt: -1 });
        res.json(holdings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch holdings' });
    }
});

// Add new holding
app.post('/api/holdings', authenticateToken, async (req: any, res: any) => {
    try {
        const { ticker, qty, avgCost, purchaseDate, owner, lastPrice, previousClose, name } = req.body;

        // Enforce owner scope for standard users
        const finalOwner = req.user.role === 'admin' ? (owner || 'Default User') : req.user.portfolioOwnerName;

        const newHolding = new Holding({
            ticker: ticker.toUpperCase(),
            qty,
            avgCost,
            purchaseDate: purchaseDate || new Date(),
            owner: finalOwner,
            lastPrice,
            previousClose,
            name
        });
        const savedHolding = await newHolding.save();
        res.status(201).json(savedHolding);
    } catch (error) {
        console.error('Error saving holding:', error);
        res.status(500).json({ error: 'Failed to save holding' });
    }
});

// Sell holding (FIFO deduction)
app.post('/api/holdings/sell', authenticateToken, async (req: any, res: any) => {
    try {
        const { ticker, qty, rate, date, owner } = req.body;

        if (!ticker || !qty || qty <= 0 || !owner) {
            return res.status(400).json({ error: 'Invalid sell parameters' });
        }

        // Enforce scope: User can only sell their own stocks
        const finalOwner = req.user.role === 'admin' ? owner : req.user.portfolioOwnerName;

        // Find all holdings for this ticker and owner, sorted by purchaseDate (FIFO)
        const holdings = await Holding.find({ ticker: ticker.toUpperCase(), owner: finalOwner }).sort({ purchaseDate: 1 });

        const totalOwned = holdings.reduce((sum, h) => sum + h.qty, 0);
        if (qty > totalOwned) {
            return res.status(400).json({ error: `Cannot sell ${qty} shares. Only ${totalOwned} shares owned.` });
        }

        let remainingToSell = qty;

        for (const holding of holdings) {
            if (remainingToSell <= 0) break;

            if (holding.qty <= remainingToSell) {
                // Sell the entire lot
                remainingToSell -= holding.qty;
                await Holding.findByIdAndDelete(holding._id);
            } else {
                // Sell partial lot
                holding.qty -= remainingToSell;
                await holding.save();
                remainingToSell = 0;
            }
        }

        res.status(200).json({ message: 'Sell transaction successful' });
    } catch (error) {
        console.error('Error selling holdings:', error);
        res.status(500).json({ error: 'Failed to process sell transaction' });
    }
});

// Edit holding
app.put('/api/holdings/:id', authenticateToken, async (req: any, res: any) => {
    try {
        // Extra check: If user, ensure they own the holding they are trying to edit
        if (req.user.role === 'user') {
            const existing = await Holding.findById(req.params.id);
            if (!existing || existing.owner !== req.user.portfolioOwnerName) {
                return res.status(403).json({ error: 'Unauthorized to edit this holding' });
            }
        }

        const { qty, avgCost, purchaseDate, owner, lastPrice, previousClose, name } = req.body;
        const finalOwner = req.user.role === 'admin' ? owner : req.user.portfolioOwnerName;

        const updatedHolding = await Holding.findByIdAndUpdate(
            req.params.id,
            { qty, avgCost, purchaseDate, owner: finalOwner, lastPrice, previousClose, name },
            { new: true } // Returns the modified document rather than the original
        );

        if (!updatedHolding) {
            return res.status(404).json({ error: 'Holding not found' });
        }
        res.json(updatedHolding);
    } catch (error) {
        console.error('Error updating holding:', error);
        res.status(500).json({ error: 'Failed to update holding' });
    }
});

// Delete holding
app.delete('/api/holdings/:id', authenticateToken, async (req: any, res: any) => {
    try {
        // Extra check: If user, ensure they own the holding they are trying to delete
        if (req.user.role === 'user') {
            const existing = await Holding.findById(req.params.id);
            if (!existing || existing.owner !== req.user.portfolioOwnerName) {
                return res.status(403).json({ error: 'Unauthorized to delete this holding' });
            }
        }

        await Holding.findByIdAndDelete(req.params.id);
        res.json({ message: 'Holding deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete holding' });
    }
});

// Cache prices from frontend
app.put('/api/holdings/cache-prices', authenticateToken, async (req: any, res: any) => {
    try {
        const { updates } = req.body;
        if (updates && Array.isArray(updates)) {
            for (const update of updates) {
                if (update._id) {
                    await Holding.findByIdAndUpdate(update._id, {
                        lastPrice: update.currentPrice,
                        previousClose: update.previousClose,
                        name: update.name
                    });
                }
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to cache prices in DB:', error);
        res.status(500).json({ error: 'Failed to cache prices' });
    }
});

app.get('/api/quote/:ticker', authenticateToken, async (req: any, res: any) => {
    try {
        const { ticker } = req.params;
        let quote;

        try {
            // Method 1: quote()
            quote = await yahooFinance.quote(ticker);
        } catch (quoteError) {
            console.warn(`Primary quote() failed for ${ticker}, trying quoteSummary():`, (quoteError as any).message);

            try {
                // Method 2: quoteSummary() (requires crumbs too, might fail)
                const summary = await yahooFinance.quoteSummary(ticker, { modules: ['price'] });
                if (summary && summary.price) {
                    quote = {
                        regularMarketPrice: summary.price.regularMarketPrice,
                        regularMarketPreviousClose: summary.price.regularMarketPreviousClose,
                        longName: summary.price.longName || summary.price.shortName || ticker,
                        symbol: ticker
                    };
                } else {
                    throw new Error('No price in quoteSummary');
                }
            } catch (summaryError) {
                console.warn(`Secondary quoteSummary() failed for ${ticker}, trying chart() fallback:`, (summaryError as any).message);

                // Method 3: chart() - The most resilient as it usually doesn't need crumbs for metadata
                const today = new Date();
                const past = new Date();
                past.setDate(today.getDate() - 7); // Get last 7 days to cover weekends

                const chartResult = await yahooFinance.chart(ticker, {
                    period1: past,
                    period2: today,
                    interval: '1d'
                });

                if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
                    const latest = chartResult.quotes[chartResult.quotes.length - 1];
                    const meta = chartResult.meta;
                    quote = {
                        regularMarketPrice: latest.close || latest.adjclose,
                        regularMarketPreviousClose: meta.previousClose || latest.open,
                        longName: meta.longName || meta.shortName || ticker,
                        symbol: ticker
                    };
                } else {
                    throw summaryError; // Throw the previous error if even chart() fails
                }
            }
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.json(quote);
    } catch (error: any) {
        const ticker = req.params.ticker;
        console.error(`ERROR fetching quote for ${ticker}:`, error.message || error);
        res.status(500).json({
            error: 'Failed to fetch quote',
            details: error.message || 'Unknown error',
            ticker: ticker
        });
    }
});

// Get historical data for charts
app.post('/api/history', authenticateToken, async (req: any, res: any) => {
    try {
        const { tickers, range = '1mo' } = req.body; // Expects an array of ticker strings

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return res.status(400).json({ error: 'Please provide an array of tickers' });
        }

        const historyPromises = tickers.map(async (ticker) => {
            try {
                // Calculate start date based on range
                const startDate = new Date();
                switch (range) {
                    case '7d':
                        startDate.setDate(startDate.getDate() - 7);
                        break;
                    case '30d':
                    case '1mo':
                        startDate.setDate(startDate.getDate() - 30);
                        break;
                    case '120d':
                        startDate.setDate(startDate.getDate() - 120);
                        break;
                    case '180d':
                        startDate.setDate(startDate.getDate() - 180);
                        break;
                    default:
                        startDate.setDate(startDate.getDate() - 30); // Default 30 days
                }

                const result = await yahooFinance.chart(ticker, {
                    period1: startDate,
                    period2: new Date(),
                    interval: '1d'
                });

                return { ticker, data: result.quotes || [] };
            } catch (err) {
                console.error(`Error fetching history for ${ticker}:`, err);
                return { ticker, data: [] }; // Return empty data on error so Promise.all succeeds
            }
        });

        const historyData = await Promise.all(historyPromises);
        res.json(historyData);

    } catch (error) {
        console.error('Error in /api/history:', error);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

app.get('/api/search', authenticateToken, async (req: any, res: any) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const qUpper = query.toUpperCase();
        const exactMatches: any[] = [];
        const startsWithMatches: any[] = [];
        const includesMatches: any[] = [];

        for (const s of indianStocks) {
            const sym = s.symbol.toUpperCase();
            const name = s.shortname.toUpperCase();
            const baseSym = sym.split('.')[0];

            if (baseSym === qUpper || name === qUpper || sym === qUpper) {
                exactMatches.push(s);
            } else if (baseSym.startsWith(qUpper) || name.startsWith(qUpper)) {
                startsWithMatches.push(s);
            } else if (sym.includes(qUpper) || name.includes(qUpper)) {
                includesMatches.push(s);
            }
        }

        const aliases: Record<string, string> = {
            'RIL': 'RELIANCE.NS',
            'HUL': 'HINDUNILVR.NS',
            'DIVI': 'DIVISLAB.NS',
            'DIVIS': 'DIVISLAB.NS'
        };

        if (aliases[qUpper]) {
            const aliasSym = aliases[qUpper];
            const aliasMatch = indianStocks.find(s => s.symbol === aliasSym);
            if (aliasMatch) {
                exactMatches.unshift(aliasMatch);
            }
        }

        const sortByLength = (a: any, b: any) => (a.shortname || '').length - (b.shortname || '').length;
        exactMatches.sort(sortByLength);
        startsWithMatches.sort(sortByLength);
        includesMatches.sort(sortByLength);

        const localMatches = [...exactMatches, ...startsWithMatches, ...includesMatches].slice(0, 100);
        let combinedQuotes = [...localMatches];

        // 2. Fetch from Yahoo Finance as a supplementary fallback
        const searchOptions = { quotesCount: 40, newsCount: 0 };

        try {
            const resultsRaw = await yahooFinance.search(query, searchOptions);
            const validGlobal = (resultsRaw.quotes || []).filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
            combinedQuotes = [...combinedQuotes, ...validGlobal];
        } catch (e) {
            console.warn(`Yahoo Finance primary search failed for ${query}, relying on local database.`);
        }

        if (!query.includes('.')) {
            try {
                const resultsNSE = await yahooFinance.search(`${query}.NS`, searchOptions);
                if (resultsNSE.quotes) {
                    const validNSEQuotes = resultsNSE.quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
                    combinedQuotes = [...combinedQuotes, ...validNSEQuotes];
                }
            } catch (e) {
                console.warn(`Failed .NS fallback search for ${query}`);
            }

            try {
                const resultsBSE = await yahooFinance.search(`${query}.BO`, searchOptions);
                if (resultsBSE.quotes) {
                    const validBSEQuotes = resultsBSE.quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
                    combinedQuotes = [...combinedQuotes, ...validBSEQuotes];
                }
            } catch (e) {
                console.warn(`Failed .BO fallback search for ${query}`);
            }

            if (combinedQuotes.length === 0 && query.toUpperCase() === 'TATA') {
                try {
                    const resultsTata = await yahooFinance.search(`TATAMOTORS.NS`, searchOptions);
                    combinedQuotes = [...combinedQuotes, ...(resultsTata.quotes || []).filter((q: any) => q.quoteType === 'EQUITY')];
                } catch (e) { }
            }
        }

        // Remove exact duplicates by symbol
        const seenSymbols = new Set();
        const uniqueQuotes = combinedQuotes.filter(q => {
            if (seenSymbols.has(q.symbol)) return false;
            seenSymbols.add(q.symbol);
            return true;
        });

        // Filter strictly to Indian exchanges (CRITICAL: Be crash-proof against malformed Yahoo objects)
        const validExchanges = ['NSI', 'BOM', 'NSE', 'BSE'];
        const uniqueIndianQuotes = uniqueQuotes.filter((q: any) => {
            if (!q || !q.symbol) return false; // Prevent TypeError on undefined
            const exchange = q.exchange ? q.exchange.toUpperCase() : '';
            return validExchanges.includes(exchange) || q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO');
        });

        res.json({ quotes: uniqueIndianQuotes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search ticker' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
