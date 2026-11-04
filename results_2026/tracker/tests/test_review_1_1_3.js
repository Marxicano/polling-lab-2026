// Tracker 1.1.3 regression tests: legal majority denominators versus the polling-error denominator.
// ChatGPT's review of 1.1.2: Maine's first-round threshold counts all ballots cast for the office, including
// blank and overvoted first rankings (21-A M.R.S. §723-A(2)); the polling error keeps its registered candidate-vote
// denominator. Written before the fix and run against 1.1.2 first. Synthetic data only, in temporary folders.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const L = require('../lib/results_lib.js');
const results = [];
function check(id, title, fn) { try { fn(); results.push({ id, ok: true }); console.log('  PASS ' + id + ' ' + title); } catch (e) { results.push({ id, ok: false }); console.log('  FAIL ' + id + ' ' + title + '\n       -> ' + String(e && e.message || e).split('\n')[0].slice(0, 240)); } }
const must = (c, m) => { if (!c) throw new Error(m); };
const mustThrow = (fn, m, re) => { let err = null; try { fn(); } catch (e) { err = e; } if (!err) throw new Error(m + ' (accepted)'); if (re && !re.test(String(err.message))) throw new Error(m + ' (rejected for another reason: ' + String(err.message).slice(0, 160) + ')'); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base = L.loadData(); const RACE = Object.fromEntries(base.races.map((r) => [r.state, r])); const SRC = Object.fromEntries(base.sources.map((s) => [s.state, s]));
const fresh = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trk113-')); fs.cpSync(L.DATA, d, { recursive: true }); return d; };
const url = (st, p) => 'https://' + SRC[st].authority_domains.split(';')[0] + '/' + (p || 'results');
// den: { cast, blank, over, excluded, src } for the legal denominator (first-round reports only)
function rep(st, round, ts, cands, den, status) {
  const race = RACE[st]; const named = cands.map(([n, p, v]) => [n === 'CH' ? race.challenger : n === 'REP' ? race.republican : n, n === 'CH' ? race.challenger_party : n === 'REP' ? 'R' : p, v]);
  const total = named.reduce((s, c) => s + c[2], 0); const st0 = status || 'certified'; const cert = L.CERT_TYPES.indexOf(st0) >= 0;
  const b = { state: st, round, reporting_status: st0, reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC', report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: cert ? '2026-11-30' : '', authority_name: SRC[st].authority, source_url: url(st), notes: 'SYNTHETIC', entered_by: 'test' };
  if (den) Object.assign(b, { ballots_cast_for_office: String(den.cast), blank_first_rank: String(den.blank), overvote_first_rank: String(den.over), excluded_first_rank: String(den.excluded == null ? 0 : den.excluded), denominator_source_url: den.src || url(st, 'results/ballots-cast') });
  return named.map(([candidate, ballot_party, votes]) => Object.assign({}, b, { candidate, ballot_party, votes: String(votes), total_votes: String(total) }));
}
const raceOf = (d, st) => L.compare(L.loadData(d)).find((r) => r.state === st);
const r2 = (x) => Math.round(x * 100) / 100; const P = L.frozenPredictions();
const ME_48 = [['CH', '', 48000], ['REP', '', 42000], ['Third candidate', 'I', 5000]]; // ChatGPT's case: 95,000 candidate votes
console.log('Tracker 1.1.3 regression tests (legal majority denominator vs polling-error denominator)');

check('M1', 'Maine 48/42/5 with 5,000 blank first rankings: no first-round majority (48% of 100,000 ballots); final round decides', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48, { cast: 100000, blank: 5000, over: 0 }), d);
  let r = raceOf(d, 'ME'); must(r.winner === null && /tabulation pending/.test(r.winner_basis), 'winner=' + r.winner + ' basis=' + r.winner_basis);
  must(r.majority_test && r.majority_test.denominator === 100000 && r.majority_test.result === 'no', 'majority test not reported on the legal denominator: ' + JSON.stringify(r.majority_test));
  must(r.first_round.total === 95000 && r.first_round.margin === r2(((48000 - 42000) * 100) / 95000), 'polling margin must keep the candidate-vote denominator');
  must(r.error_v19 === r2(P.v19.ME - r.first_round.margin), 'polling error must use the registered candidate-vote margin');
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 52000], ['REP', '', 43000]]), d);
  r = raceOf(d, 'ME'); must(r.winner === 'D' && r.winner_basis === 'certified final ranked-choice round', 'final round must decide: ' + r.winner_basis);
});
check('M2', 'Maine with the blank count not recorded: first-round winner withheld for human review, polling score kept; an official final round decides (1.1.4)', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48), d);
  const r = raceOf(d, 'ME');
  must(r.winner === null && /cannot verify/i.test(r.winner_basis), 'winner=' + r.winner + ' basis=' + r.winner_basis);
  must(r.comparable === 'certified' && r.error_v19 !== null, 'the polling score does not depend on the legal denominator');
  // 1.1.4 (Kimi): an official final round is accepted without the denominator; it is the authority's own finding (§723-A(2)).
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 52000], ['REP', '', 43000]]), d);
  must(raceOf(d, 'ME').winner === 'D' && /not recorded/.test(raceOf(d, 'ME').winner_basis), 'official final round decides, flagged');
});
check('M3', 'Maine unambiguous majority on the legal denominator: first-round winner; no final round accepted', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', [['CH', '', 55000], ['REP', '', 38000], ['Third candidate', 'I', 2000]], { cast: 100000, blank: 4000, over: 1000 }), d);
  const r = raceOf(d, 'ME'); must(r.winner === 'D' && /first-round majority/.test(r.winner_basis) && r.majority_test.result === 'yes', 'winner=' + r.winner);
  mustThrow(() => L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 56000], ['REP', '', 39000]]), d), 'final round after a legal majority', /majority/);
});
check('M4', 'Maine with no candidate above 50% even of candidate votes: no denominator needed for a final round', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', [['CH', '', 47000], ['REP', '', 46000], ['Third candidate', 'I', 7000]]), d);
  must(raceOf(d, 'ME').winner === null && /tabulation pending/.test(raceOf(d, 'ME').winner_basis), 'pending expected');
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 51000], ['REP', '', 49000]]), d);
  must(raceOf(d, 'ME').winner === 'D', 'final round decides');
});
check('M5', 'denominator fields must reconcile, carry an official source, agree across rows, and appear only on first-round reports', () => {
  const d = fresh();
  mustThrow(() => L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48, { cast: 100000, blank: 4000, over: 0 }), d), 'ballots cast not equal to candidate votes plus blank, overvote and excluded', /reconcile/);
  mustThrow(() => L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48, { cast: 90000, blank: 0, over: 0 }), d), 'ballots cast below candidate votes', /reconcile|below/);
  mustThrow(() => L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48, { cast: 100000, blank: 5000, over: 0, src: 'https://apnews.com/x' }), d), 'unofficial denominator source', /denominator_source_url/);
  const mixed = rep('ME', 'first', '2026-11-30T01:00Z', ME_48, { cast: 100000, blank: 5000, over: 0 }); mixed[1].blank_first_rank = '4000'; mixed[1].overvote_first_rank = '1000';
  mustThrow(() => L.appendReturns(mixed, d), 'rows disagree on the denominator', /disagree/);
  L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', [['CH', '', 47000], ['REP', '', 46000], ['Third candidate', 'I', 7000]]), d);
  mustThrow(() => L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 51000], ['REP', '', 49000]], { cast: 100000, blank: 0, over: 0 }), d), 'denominator on a final round', /first-round/);
});
check('M6', 'Alaska: the legal threshold is a majority of active ballots (AS 15.15.350(d)), so blank or overvoted ballots do not enter it', () => {
  const d = fresh(); L.appendReturns(rep('AK', 'first', '2026-11-30T01:00Z', [['CH', '', 51000], ['REP', '', 44000], ['Third candidate', 'I', 5000]], { cast: 103000, blank: 2000, over: 1000 }), d);
  const r = raceOf(d, 'AK'); must(r.winner === 'D' && r.majority_test.denominator === 100000 && /active ballots/.test(r.majority_test.rule), 'winner=' + r.winner + ' test=' + JSON.stringify(r.majority_test));
});
check('M7', 'Georgia unchanged: majority of the votes cast for candidates', () => {
  const d = fresh(); L.appendReturns(rep('GA', 'first', '2026-11-30T01:00Z', [['CH', '', 50500], ['REP', '', 47000], ['Third candidate', 'I', 2500]], { cast: 104000, blank: 4000, over: 0 }), d);
  const r = raceOf(d, 'GA'); must(r.winner === 'D' && /November majority/.test(r.winner_basis) && r.majority_test.denominator === 100000, 'winner=' + r.winner + ' basis=' + r.winner_basis);
});
check('M8', 'conventions 1.1.3 separate the two denominators; 1.1.1 archived; frozen data, pre-registration and vendored files unchanged', () => {
  const c = JSON.parse(fs.readFileSync(path.join(L.DATA, 'scoring_conventions.json'), 'utf8'));
  must(['1.1.3', '1.1.4'].indexOf(c.version) >= 0 && c.majority_denominators && /all ballots cast/i.test(JSON.stringify(c.majority_denominators)) && /candidate votes/i.test(JSON.stringify(c.majority_denominators)), 'conventions do not state both denominators');
  must(c.result_margin === JSON.parse(fs.readFileSync(path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.1.json'), 'utf8')).result_margin, 'the registered polling-error definition must not change');
  must(sha(path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.1.json')) === '7f22e564dc8929b038616f9a1b2ef9271018e388c93bb2085b4c54510a9c5794', '1.1.1 conventions not archived byte-for-byte');
  must(L.verifyDependencies().ok && L.verifyDependencies().manifest_sha256 === '0c42360cac97409dc3923a2b09e55ca86f1e6473f2e7bc84ccf616b2ca72a69b', 'vendored dependencies changed');
  must(L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'] === '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461' && L.deps.PINNED.anchors['v20/preregistration_mike.json'] === '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af', 'anchors changed');
});
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks pass' + (failed.length ? '; failing: ' + failed.map((f) => f.id).join(', ') : ''));
process.exit(failed.length ? 1 : 0);
