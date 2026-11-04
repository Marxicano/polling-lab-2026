// Append certified results for the 20 untracked contests (validated, hash-chained).
// Usage: node results_2026/tracker/append_untracked.js rows.csv [--dry-run]   (columns: untracked_rows_TEMPLATE.csv)
const fs = require('fs'); const { parseCSV, appendUntracked } = require('./lib/results_lib.js');
const file = process.argv[2]; const dry = process.argv.indexOf('--dry-run') > 0;
if (!file) { console.error('usage: node append_untracked.js rows.csv [--dry-run]'); process.exit(1); }
try { const out = appendUntracked(parseCSV(fs.readFileSync(file, 'utf8')), undefined, { dryRun: dry }); console.log((dry ? 'valid (dry run): ' : 'appended: ') + out.length + ' rows'); }
catch (e) { console.error('REJECTED: ' + e.message); process.exit(1); }
