const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        console.log('Testing KOTAK...');
        const res = await yahooFinance.search('KOTAK', { quotesCount: 40 });
        console.log('Results:', res.quotes.map(q => q.symbol));
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
