import YahooFinance from 'yahoo-finance2';

async function test() {
    const yf = new YahooFinance();
    console.log("Searching KOTAK:");
    const k1 = await yf.search("KOTAK", { quotesCount: 20, newsCount: 0 });
    console.log(k1.quotes.map(q => ({ symbol: q.symbol, type: q.quoteType })));

    console.log("Searching KOTAKBANK:");
    const k2 = await yf.search("KOTAKBANK", { quotesCount: 10, newsCount: 0 });
    console.log(k2.quotes.map(q => ({ symbol: q.symbol, type: q.quoteType })));
}

test();
