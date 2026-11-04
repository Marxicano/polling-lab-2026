// Tracker 1.1.4 regression tests: a missing Maine legal denominator versus an official final ranked-choice round.
// Decision (Kimi's case, checked against 21-A M.R.S. §723-A(2)): the count proceeds to rounds only when no candidate has
// more than half of all ballots cast, so an official final round is the authority's own finding of no first-round majority.
// Missing data: the first-round winner is withheld, an official final round is accepted and decides, flagged for review.
// Contradicting data (recorded counts show a majority): refused; stop and escalate. Synthetic data only, in temp folders.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const L = require('../lib/results_lib.js');
const results = [];
function check(id, title, fn) { try { fn(); results.push({ id, ok: true }); console.log('  PASS ' + id + ' ' + title); } catch (e) { results.push({ id, ok: false }); console.log('  FAIL ' + id + ' ' + title + '\n       -> ' + String(e && e.message || e).split('\n')[0].slice(0, 240)); } }
const must = (c, m) => { if (!c) throw new Error(m); };
const mustThrow = (fn, m, re) => { let err = null; try { fn(); } catch (e) { err = e; } if (!err) throw new Error(m + ' (accepted)'); if (re && !re.test(String(err.message))) throw new Error(m + ' (rejected for another reason: ' + String(err.message).slice(0, 160) + ')'); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base = L.loadData(); const RACE = Object.fromEntries(base.races.map((r) => [r.state, r])); const SRC = Object.fromEntries(base.sources.map((s) => [s.state, s]));
const fresh = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trk114-')); fs.cpSync(L.DATA, d, { recursive: true }); return d; };
const url = (st, p) => 'https://' + SRC[st].authority_domains.split(';')[0] + '/' + (p || 'results');
function rep(st, round, ts, cands, den, status) {
  const race = RACE[st]; const named = cands.map(([n, p, v]) => [n === 'CH' ? race.challenger : n === 'REP' ? race.republican : n, n === 'CH' ? race.challenger_party : n === 'REP' ? 'R' : p, v]);
  const total = named.reduce((s, c) => s + c[2], 0); const st0 = status || 'certified'; const cert = L.CERT_TYPES.indexOf(st0) >= 0;
  const b = { state: st, round, reporting_status: st0, reported_pct: st0 === 'unofficial' ? '100' : '', reporting_unit: st0 === 'unofficial' ? 'ballots' : '', authority_status_text: 'SYNTHETIC', report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: cert ? '2026-11-30' : '', authority_name: SRC[st].authority, source_url: url(st), notes: 'SYNTHETIC', entered_by: 'test' };
  if (den) Object.assign(b, { ballots_cast_for_office: String(den.cast), blank_first_rank: String(den.blank), overvote_first_rank: String(den.over), excluded_first_rank: '0', denominator_source_url: url(st, 'results/round-0') });
  return named.map(([candidate, ballot_party, votes]) => Object.assign({}, b, { candidate, ballot_party, votes: String(votes), total_votes: String(total) }));
}
const raceOf = (d, st) => L.compare(L.loadData(d)).find((r) => r.state === st);
const P = L.frozenPredictions(); const r2 = (x) => Math.round(x * 100) / 100;
const ME_48 = [['CH', '', 48000], ['REP', '', 42000], ['Third candidate', 'I', 5000]];
const FINAL = [['CH', '', 52000], ['REP', '', 43000]];
console.log('Tracker 1.1.4 regression tests (missing Maine denominator vs official final round)');

check('D1', 'missing denominator: first-round winner withheld and flagged; an official final round is accepted and, once certified, decides (flagged)', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48), d);
  let r = raceOf(d, 'ME');
  must(r.winner === null && /denominator/.test(r.winner_basis) && /review/.test(r.winner_basis), 'before the final round: ' + r.winner_basis);
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', FINAL, null, 'unofficial'), d);
  r = raceOf(d, 'ME'); must(r.winner === null, 'an unofficial final round must not decide the winner');
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-05T12:00Z', FINAL), d);
  r = raceOf(d, 'ME');
  must(r.winner === 'D' && r.winner_candidate === RACE.ME.challenger, 'certified final round decides: winner=' + r.winner);
  must(/§723-A\(2\)/.test(r.winner_basis) && /not recorded/.test(r.winner_basis), 'basis must cite the statute and flag the missing count: ' + r.winner_basis);
  must(r.majority_test.result === 'unknown' && r.majority_test.denominator === null, 'no denominator may be invented');
  must(r.first_round.total === 95000 && r.error_v19 === r2(P.v19.ME - r2(((48000 - 42000) * 100) / 95000)), 'polling error unchanged (candidate-vote denominator)');
});
check('D2', 'a recorded legal majority still blocks a final round (discrepancy: escalate)', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', [['CH', '', 55000], ['REP', '', 38000], ['Third candidate', 'I', 2000]], { cast: 100000, blank: 4000, over: 1000 }), d);
  mustThrow(() => L.appendReturns(rep('ME', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 56000], ['REP', '', 39000]]), d), 'final round after a recorded majority', /majority/);
  must(raceOf(d, 'ME').winner === 'D', 'first-round winner stands');
});
check('D3', 'counts entered later that show a majority are refused once an official final round exists (escalate)', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48), d);
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-05T12:00Z', FINAL), d);
  mustThrow(() => L.appendReturns(rep('ME', 'first', '2026-12-06T12:00Z', ME_48, { cast: 95500, blank: 500, over: 0 }, 'amended_certified'), d), 'contradicting late counts', /escalate/);
  must(raceOf(d, 'ME').winner === 'D', 'the official final round still stands');
});
check('D4', 'consistent counts entered later clear the flag', () => {
  const d = fresh(); L.appendReturns(rep('ME', 'first', '2026-11-30T01:00Z', ME_48), d);
  L.appendReturns(rep('ME', 'rcv_final', '2026-12-05T12:00Z', FINAL), d);
  L.appendReturns(rep('ME', 'first', '2026-12-06T12:00Z', ME_48, { cast: 100000, blank: 5000, over: 0 }, 'amended_certified'), d);
  const r = raceOf(d, 'ME');
  must(r.winner === 'D' && r.winner_basis === 'certified final ranked-choice round' && r.majority_test.result === 'no' && r.majority_test.denominator === 100000, 'flag cleared: ' + r.winner_basis);
});
check('D5', 'Alaska and Georgia unaffected (their legal denominator is the candidate-vote total, never missing)', () => {
  let d = fresh(); L.appendReturns(rep('AK', 'first', '2026-11-30T01:00Z', [['CH', '', 51000], ['REP', '', 44000], ['Third candidate', 'I', 5000]]), d);
  must(raceOf(d, 'AK').winner === 'D' && raceOf(d, 'AK').majority_test.result === 'yes', 'Alaska first-round majority');
  mustThrow(() => L.appendReturns(rep('AK', 'rcv_final', '2026-12-02T12:00Z', [['CH', '', 52000], ['REP', '', 48000]]), d), 'Alaska final round after a majority', /majority/);
  d = fresh(); L.appendReturns(rep('GA', 'first', '2026-11-30T01:00Z', [['CH', '', 50500], ['REP', '', 47000], ['Third candidate', 'I', 2500]]), d);
  must(raceOf(d, 'GA').winner === 'D', 'Georgia November majority');
  mustThrow(() => L.appendReturns(rep('GA', 'runoff', '2026-12-10T01:00Z', [['CH', '', 500], ['REP', '', 400]]), d), 'runoff after a majority', /runoff/);
});
check('D6', 'conventions 1.1.4 state the rule; 1.1.3 archived; polling-error definition, frozen anchors and vendored files unchanged', () => {
  const c = JSON.parse(fs.readFileSync(path.join(L.DATA, 'scoring_conventions.json'), 'utf8'));
  const prev = JSON.parse(fs.readFileSync(path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.3.json'), 'utf8'));
  must(c.version === '1.1.4' && /official final ranked-choice round may still be recorded/.test(c.majority_denominators.missing) && /escalate/.test(c.majority_denominators.missing), 'missing-denominator rule not stated');
  must(sha(path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.3.json')) === '94081c5df8d3aafd01aad2a81fcb8d63c72fc6a0af73bf4896dc7593797fd1e3', '1.1.3 conventions not archived byte-for-byte');
  must(c.result_margin === prev.result_margin && c.majority_denominators.polling_error === prev.majority_denominators.polling_error, 'polling-error definition changed');
  must(L.verifyDependencies().ok && L.verifyDependencies().manifest_sha256 === '0c42360cac97409dc3923a2b09e55ca86f1e6473f2e7bc84ccf616b2ca72a69b', 'vendored dependencies changed');
  must(L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'] === '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461' && L.deps.PINNED.anchors['v20/preregistration_mike.json'] === '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af', 'anchors changed');
});
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks pass' + (failed.length ? '; failing: ' + failed.map((f) => f.id).join(', ') : ''));
process.exit(failed.length ? 1 : 0);
