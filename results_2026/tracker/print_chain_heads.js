// Prints the current head of each hash-chained log, for publishing in a separate dated commit (anchoring).
// Usage: node results_2026/tracker/print_chain_heads.js
const { loadData } = require('./lib/results_lib.js');
const D = loadData();
console.log(JSON.stringify({ printed_at_utc: new Date().toISOString(), returns: { rows: D.returns.length, head: D.returnsHead }, untracked: { rows: D.untracked.length, head: D.untrackedHead }, domains: { rows: D.domains.length, head: D.domainsHead }, conventions_sha256: D.conventionsHash, dependency_manifest_sha256: D.deps.manifest_sha256 }, null, 1));
