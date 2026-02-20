import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import mongoose from 'mongoose';
import Holding from './models/Holding';

const app = express();
const port = process.env.PORT || 3002;
const yahooFinance = new YahooFinance();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio-db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Endpoints

// Get all holdings
app.get('/api/holdings', async (req, res) => {
    try {
        const holdings = await Holding.find().sort({ createdAt: -1 });
        res.json(holdings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch holdings' });
    }
});

// Add new holding
app.post('/api/holdings', async (req, res) => {
    try {
        const { ticker, qty, avgCost, purchaseDate, owner } = req.body;
        const newHolding = new Holding({
            ticker: ticker.toUpperCase(),
            qty,
            avgCost,
            purchaseDate: purchaseDate || new Date(),
            owner: owner || 'Default User'
        });
        const savedHolding = await newHolding.save();
        res.status(201).json(savedHolding);
    } catch (error) {
        console.error('Error saving holding:', error);
        res.status(500).json({ error: 'Failed to save holding' });
    }
});

// Edit holding
app.put('/api/holdings/:id', async (req, res) => {
    try {
        const { qty, avgCost, purchaseDate, owner } = req.body;
        const updatedHolding = await Holding.findByIdAndUpdate(
            req.params.id,
            { qty, avgCost, purchaseDate, owner },
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
app.delete('/api/holdings/:id', async (req, res) => {
    try {
        await Holding.findByIdAndDelete(req.params.id);
        res.json({ message: 'Holding deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete holding' });
    }
});

app.get('/api/quote/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const quote = await yahooFinance.quote(ticker);
        res.json(quote);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

// Get historical data for charts
app.post('/api/history', async (req, res) => {
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

                const recentHistory = await yahooFinance.historical(ticker, {
                    period1: startDate,
                    period2: new Date(),
                    interval: '1d'
                });

                return { ticker, data: recentHistory };
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

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const searchOptions = { quotesCount: 15, newsCount: 0 };
        const resultsRaw = await yahooFinance.search(query, searchOptions);
        let combinedQuotes = (resultsRaw.quotes || []).filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');

        // To prioritize Indian stocks, if the user hasn't specified an exchange suffix, search for .NS automatically
        if (!query.includes('.')) {
            try {
                const resultsNS = await yahooFinance.search(`${query}.NS`, searchOptions);
                if (resultsNS.quotes) {
                    const validNSQuotes = resultsNS.quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
                    combinedQuotes = [...combinedQuotes, ...validNSQuotes];
                }
            } catch (e) {
                console.warn(`Failed .NS search for ${query}`);
            }

            // Special fallback for Indian Banks (e.g. replacing 'KOTAK' with 'KOTAKBANK')
            if (combinedQuotes.length === 0 && !query.toUpperCase().includes('BANK')) {
                try {
                    const resultsBankNS = await yahooFinance.search(`${query}BANK.NS`, searchOptions);
                    if (resultsBankNS.quotes) {
                        const validBankQuotes = resultsBankNS.quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
                        combinedQuotes = [...combinedQuotes, ...validBankQuotes];
                    }
                } catch (e) {
                    // Ignore
                }
            }

            // Special fallback for Tata companies
            if (combinedQuotes.length === 0 && query.toUpperCase() === 'TATA') {
                try {
                    const resultsTata = await yahooFinance.search(`TATA MOTORS`, searchOptions);
                    combinedQuotes = [...combinedQuotes, ...(resultsTata.quotes || []).filter((q: any) => q.quoteType === 'EQUITY')];
                } catch (e) { }
            }
        }

        // Deduplicate results based on symbol
        const uniqueQuotes = Array.from(new Map(combinedQuotes.map(q => [q.symbol, q])).values());

        res.json({ quotes: uniqueQuotes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search ticker' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
