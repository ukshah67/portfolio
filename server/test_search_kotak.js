const fs = require('fs');

const indianStocks = JSON.parse(fs.readFileSync('src/indianStocks.json', 'utf8'));
const query = 'KOTAK';
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

const localMatches = [...exactMatches, ...startsWithMatches, ...includesMatches].slice(0, 100);

console.log('Results:');
console.log(localMatches.slice(0, 5));
console.log('Total:', localMatches.length);
