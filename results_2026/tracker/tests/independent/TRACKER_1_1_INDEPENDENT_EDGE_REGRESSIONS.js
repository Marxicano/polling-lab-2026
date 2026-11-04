// UPDATED COPY (tracker 1.1.2) of ChatGPT's 1.1 edge tests; the byte-identical original is in original/.
// Only the Alaska final-round fixtures changed, to two finalists as ChatGPT's 1.1.1 review requires: first round
// D 30 / R 38 / third 32 (so the Democrat is eliminated first) and final round R 45 / third 55. A null share omits a
// candidate. The three expectations (third candidate wins; Georgia majority; recount suspends) are unchanged.
// Independent adversarial tests for Polling Lab tracker v1.1.
// Synthetic returns ONLY; writes to operating-system temporary directories.
// Usage: node TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js /path/to/polling-lab-project-root
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const root = process.argv[2];
if (!root) { console.error('Usage: node TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js <project_root>'); process.exit(2); }
const L = require(path.resolve(root, 'results_2026/tracker/lib/results_lib.js'));
const base = L.loadData();
function freshData() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker11edge-')); const data = path.join(dir, 'data'); fs.cpSync(path.join(L.TRACKER, 'data'), data, { recursive: true }); return data; }
function rows(st, round, status, timestamp, shares) {
  const race = base.races.find(r => r.state === st), source = base.sources.find(s => s.state === st), total = 1000000;
  const b = { state: st, round, reporting_status: status, reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC TEST DATA', report_timestamp_utc: timestamp, retrieved_at_utc: timestamp, certification_date: status.endsWith('certified') ? '2026-11-30' : '', authority_name: source.authority, source_url: 'https://' + source.authority_domains.split(';')[0] + '/', entered_by: 'independent-review', notes: 'SYNTHETIC, NOT AN ACTUAL RESULT' };
  const c = [[race.challenger, race.challenger_party, shares[0]], [race.republican, 'R', shares[1]], ['Third candidate', 'I', shares[2]]].filter((x) => x[2] != null);
  const tot = c.reduce((s, x) => s + x[2] * 10000, 0);
  return c.map(([candidate, ballot_party, vote]) => ({ ...b, candidate, ballot_party, votes: String(vote * 10000), total_votes: String(tot) }));
}
let failures = 0;
function test(name, fn) { try { const { pass, observed } = fn(); console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + ': ' + observed); if (!pass) failures++; } catch (e) { failures++; console.log('ERROR ' + name + ': ' + e.message); } }
// AK final round: certified independent has majority; should not announce Republican or Democrat.
test('AK certified RCV final: third candidate 55% must not be called R/D', () => { const d = freshData(); L.appendReturns(rows('AK', 'first', 'certified', '2026-11-30T01:00Z', [30,38,32]), d); L.appendReturns(rows('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [null,45,55]), d); const r = L.compare(L.loadData(d)).find(r => r.state === 'AK'); return { pass: r.winner === 'I', observed: 'winner=' + JSON.stringify(r.winner) + ' expected I' }; });
// GA first round: independent has majority; should not announce a runoff.
test('GA certified first round: third candidate 55% wins outright', () => { const d = freshData(); L.appendReturns(rows('GA', 'first', 'certified', '2026-11-30T01:00Z', [20,25,55]), d); const r = L.compare(L.loadData(d)).find(r => r.state === 'GA'); return { pass: r.winner === 'I', observed: 'winner=' + JSON.stringify(r.winner) + ', basis=' + JSON.stringify(r.winner_basis) + '; expected I' }; });
// The stated release rule says an active recount suspends the race's score and winner.
test('AK active final-round recount: no race-level certified score', () => { const d = freshData(); L.appendReturns(rows('AK', 'first', 'certified', '2026-11-30T01:00Z', [30,38,32]), d); L.appendReturns(rows('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [null,45,55]), d); L.appendReturns(rows('AK', 'rcv_final', 'recount', '2026-12-02T01:00Z', [null,45,55]), d); const r = L.compare(L.loadData(d)).find(r => r.state === 'AK'); return { pass: r.error_v19 === null && r.comparable !== 'certified' && r.winner === null, observed: 'winner=' + JSON.stringify(r.winner) + ', comparable=' + r.comparable + ', v19error=' + r.error_v19 + '; expected no active score' }; });
console.log(failures ? '\n' + failures + ' independent edge check(s) FAIL: tracker is still pre-release' : '\nAll three independent edge checks pass');
process.exit(failures ? 1 : 0);
