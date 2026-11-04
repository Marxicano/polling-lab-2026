// RECONSTRUCTION by Claude of ChatGPT's TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE.js, which was described in
// TRACKER_1_1_1_INDEPENDENT_REVIEW_2026-11-03.md but not attached. It implements the four checks the review lists;
// ChatGPT should also run its original file. Synthetic data only, written to temporary folders.
// Usage: node TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE_reconstructed.js /path/to/project-root
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const root = process.argv[2];
if (!root) { console.error('Usage: node TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE_reconstructed.js <project_root>'); process.exit(2); }
const L = require(path.resolve(root, 'results_2026/tracker/lib/results_lib.js'));
const base = L.loadData();
const fresh = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rcvfinal-')); fs.cpSync(L.DATA, d, { recursive: true }); return d; };
function rows(st, round, ts, cands) {
  const race = base.races.find((r) => r.state === st), src = base.sources.find((s) => s.state === st);
  const named = cands.map(([who, p, v]) => [who === 'D' ? race.challenger : who === 'R' ? race.republican : 'Third candidate', who === 'D' ? race.challenger_party : who === 'R' ? 'R' : 'I', v]);
  const total = named.reduce((s, c) => s + c[2], 0);
  const b = { state: st, round, reporting_status: 'certified', reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC TEST DATA', report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: '2026-11-30', authority_name: src.authority, source_url: 'https://' + src.authority_domains.split(';')[0] + '/', entered_by: 'independent-review', notes: 'SYNTHETIC, NOT AN ACTUAL RESULT' };
  return named.map(([candidate, ballot_party, votes]) => Object.assign({}, b, { candidate, ballot_party, votes: String(votes), total_votes: String(total) }));
}
let failures = 0;
function test(name, fn) { try { const { pass, observed } = fn(); console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + ': ' + observed); if (!pass) failures++; } catch (e) { failures++; console.log('ERROR ' + name + ': ' + e.message); } }
['AK', 'ME'].forEach((st) => {
  test(st + ' three-candidate rcv_final must be rejected', () => {
    const d = fresh(); L.appendReturns(rows(st, 'first', '2026-11-30T01:00Z', [['D', 0, 400000], ['R', 0, 350000], ['I', 0, 250000]]), d);
    let accepted = true; try { L.appendReturns(rows(st, 'rcv_final', '2026-12-01T01:00Z', [['D', 0, 200000], ['R', 0, 250000], ['I', 0, 550000]]), d); } catch (e) { accepted = false; }
    const w = accepted ? L.compare(L.loadData(d)).find((r) => r.state === st).winner : null;
    return { pass: !accepted, observed: accepted ? 'accepted; winner=' + JSON.stringify(w) : 'rejected' };
  });
  test(st + ' two-finalist rcv_final (R 45%, I 55%) accepted and I wins', () => {
    const d = fresh(); L.appendReturns(rows(st, 'first', '2026-11-30T01:00Z', [['D', 0, 300000], ['R', 0, 380000], ['I', 0, 320000]]), d);
    L.appendReturns(rows(st, 'rcv_final', '2026-12-01T01:00Z', [['R', 0, 450000], ['I', 0, 550000]]), d);
    const r = L.compare(L.loadData(d)).find((x) => x.state === st);
    return { pass: r.winner === 'I', observed: 'winner=' + JSON.stringify(r.winner) };
  });
});
console.log(failures ? '\n' + failures + ' RCV final-round check(s) FAIL' : '\nAll four RCV final-round checks pass');
process.exit(failures ? 1 : 0);
