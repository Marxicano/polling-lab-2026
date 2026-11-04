// Runs the registered H1-H4 tests once, unchanged, and writes data/registered_scoring_record.json (never overwritten).
// Usage: node results_2026/tracker/record_registered_scoring.js   (do not set V20_SIMS; uses the registered 10,000 replicates)
const { recordRegisteredScoring } = require('./lib/results_lib.js');
try { const r = recordRegisteredScoring(); console.log('recorded ' + r.recorded_at_utc + ': ' + r.tests.map((t) => t.id + '=' + t.decision).join(', ')); }
catch (e) { console.error('NOT RECORDED: ' + e.message); process.exit(1); }
