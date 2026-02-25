import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const tickers = ['RELIANCE.NS', 'HDFCBANK.NS', 'AAPL'];
        for (const ticker of tickers) {
            console.log(`Fetching quote for ${ticker}...`);
            const quote = await yahooFinance.quote(ticker);
            console.log(`${ticker}: `, quote.regularMarketPrice);
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
