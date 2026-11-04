// Append one or more complete official reports to the hash-chained returns log.
// Usage: node results_2026/tracker/append_returns.js new_rows.csv [--dry-run]   (columns: new_rows_TEMPLATE.csv)
const fs = require('fs'); const { parseCSV, appendReturns } = require('./lib/results_lib.js');
const file = process.argv[2]; const dry = process.argv.indexOf('--dry-run') > 0;
if (!file) { console.error('usage: node append_returns.js new_rows.csv [--dry-run]'); process.exit(1); }
try { const out = appendReturns(parseCSV(fs.readFileSync(file, 'utf8')), undefined, { dryRun: dry }); console.log((dry ? 'valid (dry run): ' : 'appended: ') + out.length + ' rows' + (out.length ? ', ' + out[0].record_id + ' to ' + out[out.length - 1].record_id : '')); }
catch (e) { console.error('REJECTED: ' + e.message); process.exit(1); }
