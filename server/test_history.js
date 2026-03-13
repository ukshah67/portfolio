const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        console.log('Fetching history for KOTAKBANK.NS...');
        const res = await yahooFinance.historical('KOTAKBANK.NS', {
            period1: startDate,
            period2: new Date(),
            interval: '1d'
        });
        console.log('KOTAKBANK.NS result length:', res.length);
        if (res.length > 0) {
            console.log('First data point:', res[0]);
        }

        console.log('\nFetching history for ICICIBANK.NS...');
        const res2 = await yahooFinance.historical('ICICIBANK.NS', {
            period1: startDate,
            period2: new Date(),
            interval: '1d'
        });
        console.log('ICICIBANK.NS result length:', res2.length);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
