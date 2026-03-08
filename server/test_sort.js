const fs = require('fs');

const indianStocks = JSON.parse(fs.readFileSync('src/indianStocks.json', 'utf8'));
const query = process.argv[2] || 'ICICI';
const qUpper = query.toUpperCase();

const exactMatches = [];
const startsWithMatches = [];
const includesMatches = [];

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

// How many startswith do we have?
console.log(`StartsWith: ${startsWithMatches.length}`);

// We need to sort startsWithMatches because ICICIBANK.NS might be pushed down by ICICI PRUDENTIAL ETFs
startsWithMatches.sort((a, b) => a.shortname.length - b.shortname.length);

const localMatches = [...exactMatches, ...startsWithMatches, ...includesMatches].slice(0, 50);
console.log(localMatches.slice(0, 10).map(m => m.symbol + ' - ' + m.shortname));
