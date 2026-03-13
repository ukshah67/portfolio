const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        console.log('Fetching history for KOTAKBANK.NS using chart()...');
        const res = await yahooFinance.chart('KOTAKBANK.NS', {
            period1: startDate,
            period2: new Date(),
            interval: '1d'
        });
        console.log('KOTAKBANK.NS result quotes length:', res.quotes ? res.quotes.length : 0);
        if (res.quotes && res.quotes.length > 0) {
            console.log('First data point:', res.quotes[0]);
        }

        console.log('\nFetching history for ICICIBANK.NS using chart()...');
        const res2 = await yahooFinance.chart('ICICIBANK.NS', {
            period1: startDate,
            period2: new Date(),
            interval: '1d'
        });
        console.log('ICICIBANK.NS result quotes length:', res2.quotes ? res2.quotes.length : 0);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
