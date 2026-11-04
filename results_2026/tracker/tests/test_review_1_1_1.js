// Tracker 1.1.1 regression tests: ChatGPT's independent 1.1 review (B7 winner selection, A9 recount scope).
// Written before the fixes and run against 1.1 first. Synthetic data only, in temporary folders.
// Usage (repository root): node results_2026/tracker/tests/test_review_1_1_1.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const L = require('../lib/results_lib.js');
const results = [];
function check(id, title, fn) {
  try { fn(); results.push({ id, ok: true }); console.log('  PASS ' + id + ' ' + title); }
  catch (e) { results.push({ id, ok: false }); console.log('  FAIL ' + id + ' ' + title + '\n       -> ' + String(e && e.message || e).split('\n')[0].slice(0, 240)); }
}
const must = (c, m) => { if (!c) throw new Error(m); };
const mustThrow = (fn, m, re) => { let err = null; try { fn(); } catch (e) { err = e; } if (!err) throw new Error(m + ' (accepted)'); if (re && !re.test(String(err.message))) throw new Error(m + ' (rejected for another reason: ' + String(err.message).slice(0, 140) + ')'); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base = L.loadData();
const RACE = Object.fromEntries(base.races.map((r) => [r.state, r]));
const SRC = Object.fromEntries(base.sources.map((s) => [s.state, s]));
function fresh() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trk111-')); fs.cpSync(L.DATA, d, { recursive: true }); return d; }
// cands: [[name, ballot_party, votes]]; names 'CH' and 'REP' stand for the race's named candidates
function rep(st, round, status, ts, cands, extra) {
  const e = extra || {}; const race = RACE[st]; const cert = L.CERT_TYPES.indexOf(status) >= 0;
  const named = cands.map(([n, p, v]) => [n === 'CH' ? race.challenger : n === 'REP' ? race.republican : n, n === 'CH' ? race.challenger_party : n === 'REP' ? 'R' : p, v]);
  const total = named.reduce((s, c) => s + c[2], 0);
  const b = { state: st, round, reporting_status: status, reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC TEST DATA', report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: cert ? (e.cert || '2026-11-30') : '', authority_name: SRC[st].authority, source_url: 'https://' + SRC[st].authority_domains.split(';')[0] + '/results', notes: 'SYNTHETIC', entered_by: 'test' };
  return named.map(([candidate, ballot_party, votes]) => Object.assign({}, b, { candidate, ballot_party, votes: String(votes), total_votes: String(total) }));
}
const P = L.frozenPredictions();
const raceOf = (d, st) => L.compare(L.loadData(d)).find((r) => r.state === st);
const r2 = (x) => Math.round(x * 100) / 100;

console.log('Tracker 1.1.1 regression tests (winner selection and recount scope)');

check('W1', 'Alaska: a certified ranked-choice final round won by a third candidate is called for that candidate', () => {
  const d = fresh();
  // 1.1.2: lawful two-finalist fixture (with three candidates the last-place one, here the Democrat, is eliminated first)
  L.appendReturns(rep('AK', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 380000], ['Third candidate', 'I', 320000]]), d);
  L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['REP', '', 450000], ['Third candidate', 'I', 550000]]), d);
  const r = raceOf(d, 'AK'); must(r.winner === 'I' && r.winner_candidate === 'Third candidate', 'winner=' + r.winner + ' ' + r.winner_candidate);
  must(r.error_v19 === r2(P.v19.AK + 8), 'polling error must stay first-round challenger minus Republican: ' + r.error_v19);
});
check('W2', 'Georgia: a certified November majority by a third candidate wins outright; no runoff is accepted', () => {
  const d = fresh();
  L.appendReturns(rep('GA', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 200000], ['REP', '', 250000], ['Third candidate', 'I', 550000]]), d);
  const r = raceOf(d, 'GA'); must(r.winner === 'I' && /majority/.test(r.winner_basis), 'winner=' + r.winner + ' basis=' + r.winner_basis);
  mustThrow(() => L.appendReturns(rep('GA', 'runoff', 'certified', '2026-12-10T01:00Z', [['CH', '', 500], ['REP', '', 400]]), d), 'runoff after a November majority', /runoff/);
});
check('W3', 'plurality state: a third-party plurality winner is called for that candidate, with its party kept', () => {
  const d = fresh();
  L.appendReturns(rep('KS', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 320000], ['David Graham', 'L', 380000]]), d);
  const r = raceOf(d, 'KS'); must(r.winner === 'I' && r.winner_ballot_party === 'L' && r.winner_candidate === 'David Graham', 'winner=' + r.winner + '/' + r.winner_ballot_party);
  must(r.error_v19 === r2(P.v19.KS + 2), 'polling error unchanged by the third-party win');
});
check('W4', 'an aggregated "other candidates" row that leads cannot produce a winner', () => {
  const d = fresh();
  L.appendReturns(rep('IA', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 310000], ['All other candidates and write-ins', 'OTH', 390000]]), d);
  const r = raceOf(d, 'IA'); must(r.winner === null && /cannot determine/.test(r.winner_basis), 'winner=' + r.winner + ' basis=' + r.winner_basis);
});
check('W5', 'an exact tie for first place produces no winner', () => {
  const d = fresh();
  L.appendReturns(rep('OH', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 490000], ['REP', '', 490000], ['All other candidates and write-ins', 'OTH', 20000]]), d);
  const r = raceOf(d, 'OH'); must(r.winner === null && /tie/.test(r.winner_basis), 'winner=' + r.winner + ' basis=' + r.winner_basis);
});
check('W6', 'Georgia runoff: only the top two November candidates, and the runoff winner by votes', () => {
  let d = fresh();
  L.appendReturns(rep('GA', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 480000], ['REP', '', 470000], ['Third candidate', 'I', 50000]]), d);
  must(raceOf(d, 'GA').winner === null && /runoff pending/.test(raceOf(d, 'GA').winner_basis), 'runoff pending expected');
  mustThrow(() => L.appendReturns(rep('GA', 'runoff', 'certified', '2026-12-10T01:00Z', [['CH', '', 500], ['Third candidate', 'I', 400]]), d), 'wrong runoff pair', /top two/);
  L.appendReturns(rep('GA', 'runoff', 'certified', '2026-12-10T01:00Z', [['CH', '', 480000], ['REP', '', 520000]]), d);
  must(raceOf(d, 'GA').winner === 'R', 'runoff winner by votes');
  d = fresh();
  L.appendReturns(rep('GA', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 360000], ['Third candidate', 'I', 340000]]), d);
  L.appendReturns(rep('GA', 'runoff', 'certified', '2026-12-10T01:00Z', [['REP', '', 480000], ['Third candidate', 'I', 520000]]), d);
  const r = raceOf(d, 'GA'); must(r.winner === 'I' && r.winner_candidate === 'Third candidate', 'runoff without the named challenger: winner=' + r.winner);
  must(r.error_v19 === r2(P.v19.GA - (30 - 36)), 'polling error still from the November count');
});
check('W7', 'ranked-choice final rounds: only without a first-round majority, only first-round candidates, no aggregates, decisive', () => {
  let d = fresh();
  L.appendReturns(rep('AK', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 550000], ['REP', '', 400000], ['Third candidate', 'I', 50000]]), d);
  must(raceOf(d, 'AK').winner === 'D', 'first-round majority decides');
  mustThrow(() => L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['CH', '', 560000], ['REP', '', 440000]]), d), 'final round after a first-round majority', /majority/);
  d = fresh();
  L.appendReturns(rep('AK', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 450000], ['REP', '', 450000], ['Third candidate', 'I', 100000]]), d);
  mustThrow(() => L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['CH', '', 500000], ['Somebody new', 'I', 500001]]), d), 'candidate not on the first round', /first round/);
  mustThrow(() => L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['CH', '', 500000], ['REP', '', 400000], ['All other candidates and write-ins', 'OTH', 100000]]), d), 'aggregate in a final round', /aggregate/);
  mustThrow(() => L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['CH', '', 500000], ['REP', '', 500000]]), d), 'final round without a majority winner (two finalists tied)', /majority/);
});
check('W8', 'ballot party codes are validated, and only one aggregate row is allowed', () => {
  const d = fresh();
  mustThrow(() => L.appendReturns(rep('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [['CH', '', 300], ['REP', '', 310], ['Someone', 'XYZ', 10]]), d), 'unknown party code', /ballot_party/);
  mustThrow(() => L.appendReturns(rep('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [['CH', '', 300], ['REP', '', 310], ['Others A', 'OTH', 10], ['Others B', 'OTH', 10]]), d), 'two aggregate rows', /aggregate/);
});
check('W9', 'seats: a third-party winner counts as independent/other and unaligned', () => {
  const d = fresh();
  L.appendReturns(rep('KS', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 320000], ['David Graham', 'L', 380000]]), d);
  const D = L.loadData(d); const t = L.seatTally(L.compare(D), D, P);
  must(t.party.I === 3 && t.caucus.unaligned === 1 && t.party.D === 41 && t.party.R === 42, JSON.stringify(t.party) + ' ' + JSON.stringify(t.caucus));
});
check('A9a', 'ranked-choice recount in any round suspends the whole race (score and winner): same ballots', () => {
  const d = fresh();
  L.appendReturns(rep('AK', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 380000], ['Third candidate', 'I', 320000]]), d);
  L.appendReturns(rep('AK', 'rcv_final', 'certified', '2026-12-01T01:00Z', [['REP', '', 450000], ['Third candidate', 'I', 550000]]), d);
  L.appendReturns(rep('AK', 'rcv_final', 'recount', '2026-12-02T01:00Z', [['REP', '', 450000], ['Third candidate', 'I', 550000]]), d);
  let r = raceOf(d, 'AK'); must(r.comparable === 'recount' && r.error_v19 === null && r.winner === null, 'comparable=' + r.comparable + ' error=' + r.error_v19 + ' winner=' + r.winner);
  must(L.scorecard(L.compare(L.loadData(d)), 'error_v19', 'certified').races === 0, 'race left in the certified scorecard');
  L.appendReturns(rep('AK', 'rcv_final', 'recount_certified', '2026-12-20T01:00Z', [['REP', '', 440000], ['Third candidate', 'I', 560000]], { cert: '2026-12-20' }), d);
  r = raceOf(d, 'AK'); must(r.comparable === 'certified' && r.winner === 'I' && r.error_v19 === r2(P.v19.AK + 8), 'resumes after the recount is certified');
});
check('A9b', 'Georgia runoff recount (separate ballots) keeps the certified November score but withholds the winner', () => {
  const d = fresh();
  L.appendReturns(rep('GA', 'first', 'certified', '2026-11-30T01:00Z', [['CH', '', 480000], ['REP', '', 470000], ['Third candidate', 'I', 50000]]), d);
  L.appendReturns(rep('GA', 'runoff', 'certified', '2026-12-10T01:00Z', [['CH', '', 500100], ['REP', '', 499900]]), d);
  L.appendReturns(rep('GA', 'runoff', 'recount', '2026-12-12T01:00Z', [['CH', '', 500100], ['REP', '', 499900]]), d);
  const r = raceOf(d, 'GA'); must(r.comparable === 'certified' && r.error_v19 === r2(P.v19.GA - 1) && r.winner === null && /runoff recount/.test(r.winner_basis), 'comparable=' + r.comparable + ' error=' + r.error_v19 + ' winner=' + r.winner + ' basis=' + r.winner_basis);
});
check('A9c', 'conventions 1.1.1 state the winner and recount-scope rules and are pinned; 1.1 archived unchanged', () => {
  const c = JSON.parse(fs.readFileSync(path.join(L.DATA, 'scoring_conventions.json'), 'utf8'));
  must(['1.1.1', '1.1.3', '1.1.4'].indexOf(c.version) >= 0, 'conventions version ' + c.version); // 1.1.3 adds majority denominators; 1.1.1 is archived byte-for-byte
  must(/same ballots/i.test(JSON.stringify(c.recount_scope || '')) && /Georgia/.test(JSON.stringify(c.recount_scope || '')), 'recount scope rule not stated');
  must(/all candidates/i.test(JSON.stringify(c.winner_rules || '')), 'winner rule not stated');
  must(sha(path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.json')) === '20e0ed33d16103cea685c73763a63ef496757b2a60e2c2e84481b1dbfd564547', '1.1 conventions not archived byte-for-byte');
  must(sha(path.join(L.DATA, 'archive', 'scoring_conventions_v1.0.json')) === 'd2b75c8b51174d08944a08b8b858cd041fa83562fe0a9991d95c2c21fa765325', '1.0 conventions changed');
});
check('F1', 'frozen anchors unchanged', () => {
  must(L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'] === '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461' && L.deps.PINNED.anchors['v20/preregistration_mike.json'] === '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af', 'anchor changed');
  must(L.verifyDependencies().ok, 'dependencies');
});

const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks pass' + (failed.length ? '; failing: ' + failed.map((f) => f.id).join(', ') : ''));
process.exit(failed.length ? 1 : 0);
