// Record that a state election authority's own page links to a separate results host, so that host may be used.
// Usage: node results_2026/tracker/append_domain_verification.js rows.csv [--dry-run]   (columns: domain_rows_TEMPLATE.csv)
const fs = require('fs'); const { parseCSV, appendDomainVerification } = require('./lib/results_lib.js');
const file = process.argv[2]; const dry = process.argv.indexOf('--dry-run') > 0;
if (!file) { console.error('usage: node append_domain_verification.js rows.csv [--dry-run]'); process.exit(1); }
try { const out = appendDomainVerification(parseCSV(fs.readFileSync(file, 'utf8')), undefined, { dryRun: dry }); console.log((dry ? 'valid (dry run): ' : 'recorded: ') + out.length + ' verification(s)'); }
catch (e) { console.error('REJECTED: ' + e.message); process.exit(1); }
