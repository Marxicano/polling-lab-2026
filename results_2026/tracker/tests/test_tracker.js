// Results tracker regression tests (1.1). Run from the repository root: node results_2026/tracker/tests/test_tracker.js
// Synthetic returns live only in temporary folders; the real logs in results_2026/tracker/data are only read.
'use strict';
process.env.V20_SIMS = process.env.V20_SIMS || '3000';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const L = require('../lib/results_lib.js');
const B = require('../build_dashboard.js');
let n = 0; const ok = (m) => { n += 1; console.log('  ok  ' + m); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function tree(dir, skip) { const out = {}; (function w(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const rel = path.relative(dir, p); if (skip.some((s) => rel === s || rel.startsWith(s + path.sep))) continue; if (fs.statSync(p).isDirectory()) w(p); else out[rel] = sha(p); } })(dir); return out; }
const SKIP = ['results_2026/tracker', 'docs/results', '.git', 'node_modules'];
const before = tree(L.REPO, SKIP);
const realDir = L.DATA;
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } }
const tmpData = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trk-')); copyDir(realDir, d); return d; };

// ---------- 1. dependencies, static data, isolation ----------
const v = L.verifyDependencies();
assert(v.ok, v.errors.join('; ')); assert.strictEqual(v.files.length, 60);
assert.strictEqual(L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'], '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461');
assert.strictEqual(L.deps.PINNED.anchors['v20/preregistration_mike.json'], '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af');
assert(v.repo_checks.every((c) => c.status !== 'mismatch'));
assert.strictEqual(sha(path.join(realDir, 'archive', 'scoring_conventions_v1.0.json')), 'd2b75c8b51174d08944a08b8b858cd041fa83562fe0a9991d95c2c21fa765325', 'v1.0 conventions archived unchanged');
ok('60 vendored dependencies verified against the published checksum lists and public anchors; checkout copies match; v1.0 conventions archived byte-for-byte');

// ---------- 2. real data ----------
const real = L.loadData();
assert.strictEqual(real.races.length, 15); assert.strictEqual(real.untrackedRaces.length, 20); assert.strictEqual(real.sources.length, 35);
assert.deepStrictEqual(real.races.map((r) => r.state).join(), 'AK,FL,GA,IA,KS,ME,MI,MN,MS,NC,NE,NH,OH,SC,TX');
assert.strictEqual(real.returns.length + real.untracked.length + real.domains.length, 0, 'no real results entered yet');
real.sources.forEach((s) => { assert(L.hostAllowed(s.authority_url, s.authority_domains.split(';')), s.state + ' authority URL on its own domain'); s.pending_result_hosts.split(';').filter(Boolean).forEach((h) => assert(!L.sourceAllowed(s.state, 'https://' + h + '/x', real), h + ' must not be usable before verification')); });
ok('real data: 15 tracked and 20 untracked contests, 35 authorities, empty logs, pending result hosts not usable yet');

const RACE = Object.fromEntries(real.races.map((r) => [r.state, r]));
const SRC = Object.fromEntries(real.sources.map((s) => [s.state, s]));
const url = (st) => 'https://' + SRC[st].authority_domains.split(';')[0] + '/results/2026-general';
function report(st, round, status, ts, pct, extra) {
  const e = extra || {}; const race = RACE[st]; const cert = L.CERT_TYPES.indexOf(status) >= 0;
  // Final ranked-choice rounds and runoffs list individual candidates only (1.1.1), so no aggregate row there.
  const t0 = e.total || 1000000; const ch = Math.round(t0 * pct[0] / 100), rp = Math.round(t0 * pct[1] / 100);
  const total = round === 'first' ? t0 : ch + rp; const oth = total - ch - rp;
  const base = { state: st, round, reported_pct: e.reported_pct != null ? String(e.reported_pct) : (cert ? '' : '100'), reporting_unit: e.unit != null ? e.unit : (cert ? '' : 'ballots'), authority_status_text: cert ? 'Certified' : 'Unofficial results', reporting_status: status, report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: cert ? (e.cert || '2026-11-30') : '', authority_name: SRC[st].authority, source_url: url(st), notes: 'SYNTHETIC TEST DATA', entered_by: 'test' };
  const rows = [Object.assign({}, base, { candidate: race.challenger, ballot_party: race.challenger_party, votes: String(ch), total_votes: String(total) }), Object.assign({}, base, { candidate: race.republican, ballot_party: 'R', votes: String(rp), total_votes: String(total) })];
  if (oth > 0) rows.push(Object.assign({}, base, { candidate: 'All other candidates and write-ins', ballot_party: 'OTH', votes: String(oth), total_votes: String(total) }));
  return rows;
}
const P = L.frozenPredictions();
const fromMargin = (m) => [48 + m / 2, 48 - m / 2];

// ---------- 3. validation ----------
{
  const d = tmpData(); const good = report('IA', 'first', 'unofficial', '2026-11-04T03:15Z', [47, 49]);
  const bad = (mut, why, pattern) => { const rows = good.map((r) => Object.assign({}, r, mut)); assert.throws(() => L.appendReturns(rows, d, { dryRun: true }), pattern || /rejected/, why); };
  bad({ source_url: 'https://apnews.com/hub/election-2026' }, 'news source', /official host/);
  bad({ source_url: 'http://sos.iowa.gov/x' }, 'not https', /official host/);
  bad({ source_url: 'https://sos.iowa.gov.evil.example/x' }, 'look-alike domain', /official host/);
  bad({ reporting_status: 'certified' }, 'certified without date', /certification_date/);
  bad({ certification_date: '2026-11-20' }, 'unofficial with a certification date', /only certified/);
  bad({ state: 'ZZ' }, 'unknown state', /not one of the 15/);
  bad({ round: 'rcv_final' }, 'rcv round outside AK/ME', /rcv_final/);
  bad({ round: 'runoff' }, 'runoff outside GA', /runoff/);
  bad({ report_timestamp_utc: 'Nov 4 3:15' }, 'timestamp', /ISO/);
  bad({ reporting_status: 'projected' }, 'unknown status', /reporting_status/);
  bad({ authority_status_text: '' }, 'no authority wording', /authority_status_text/);
  const ms = report('MS', 'first', 'unofficial', '2026-11-04T03:15Z', [44, 52]).map((r) => Object.assign(r, { source_url: 'https://www.co.hinds.ms.us/results' }));
  assert.throws(() => L.appendReturns(ms, d, { dryRun: true }), /official host/, 'Mississippi county page is not the statewide authority');
  const one = report('OH', 'first', 'certified', '2026-11-25T20:00Z', [50, 47]).slice(0, 1); one[0].votes = '500000';
  assert.throws(() => L.appendReturns(one, d), /exactly once/, 'single-candidate report');
  assert.strictEqual(L.appendReturns(good, d, { dryRun: true }).length, 3);
  assert.throws(() => L.appendUntracked([{ state: 'ZZ', round: 'final', candidate_winner: 'X', winner_party: 'D', reporting_status: 'certified', report_timestamp_utc: '2026-11-25T20:00Z', retrieved_at_utc: '2026-11-25T20:00Z', certification_date: '2026-11-30', authority_name: 'x', source_url: 'https://not-an-authority.example/test', notes: '', entered_by: 't' }], tmpData()), /not one of the 20 untracked/, 'ZZ rejected for the right reason');
}
ok('validation: news, http and look-alike hosts, status/date mismatches, unknown states and rounds, missing authority wording, Mississippi county pages, single-candidate reports and nonexistent untracked states are all rejected');

// ---------- 4. tamper-evident logs ----------
{
  const d = tmpData();
  L.appendReturns(report('OH', 'first', 'unofficial', '2026-11-04T02:00Z', [47, 49], { reported_pct: 55 }), d);
  L.appendReturns(report('OH', 'first', 'unofficial', '2026-11-04T06:00Z', [49, 48]), d);
  assert.strictEqual(L.loadData(d).returns.length, 6);
  const file = path.join(d, 'candidate_returns.csv'); const original = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, original.replace(/,470000,1000000,/, ',480000,1000000,')); assert.throws(() => L.loadData(d), /fails verification|invalid/, 'edited votes detected');
  const lines = original.trim().split('\n'); fs.writeFileSync(file, [lines[0]].concat(lines.slice(2)).join('\n') + '\n'); assert.throws(() => L.loadData(d), /fails verification|invalid/, 'deleted row detected');
  fs.writeFileSync(file, original); assert.strictEqual(L.loadData(d).returns.length, 6);
}
ok('hash-chained logs: edits and deletions stop the tracker; the original log loads again');

// ---------- 5. status lifecycle ----------
{
  const d = tmpData();
  L.appendReturns(report('KS', 'first', 'unofficial', '2026-11-04T02:00Z', [51, 47], { reported_pct: 62 }), d);
  let r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.comparable === 'partial' && r.error_v19 === null && r.winner === null);
  L.appendReturns(report('KS', 'first', 'unofficial', '2026-11-04T09:00Z', [50.1234, 47.8765], { unit: 'precincts' }), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.comparable === 'provisional' && r.reporting_unit === 'precincts' && r.winner === null && r.first_round.margin === 2.25);
  L.appendReturns(report('KS', 'first', 'certified', '2026-11-20T15:00Z', [50.5, 47.5]), d);
  assert.throws(() => L.appendReturns(report('KS', 'first', 'unofficial', '2026-12-02T15:00Z', [40, 58]), d), /not accepted after certification/);
  assert.throws(() => L.appendReturns(report('KS', 'first', 'certified', '2026-12-03T15:00Z', [50, 48]), d), /amended_certified/);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.comparable === 'certified' && r.first_round.margin === 3 && r.winner === 'D');
  L.appendReturns(report('KS', 'first', 'amended_certified', '2026-12-10T15:00Z', [50.4, 47.6], { cert: '2026-12-10' }), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.status === 'amended_certified' && r.first_round.margin === 2.8);
  L.appendReturns(report('KS', 'first', 'recount', '2026-12-12T15:00Z', [50.4, 47.6]), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.comparable === 'recount' && r.winner === null && r.error_v19 === null);
  assert.throws(() => L.appendReturns(report('KS', 'first', 'amended_certified', '2026-12-13T15:00Z', [50, 48], { cert: '2026-12-13' }), d), /cannot interrupt a recount/);
  L.appendReturns(report('KS', 'first', 'recount_certified', '2026-12-20T15:00Z', [50.3, 47.7], { cert: '2026-12-20' }), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'KS'); assert(r.comparable === 'certified' && r.status === 'recount_certified' && r.first_round.margin === 2.6);
}
ok('lifecycle: partial → provisional (unit shown) → certified → amended → recount (suspended) → certified after recount; no unofficial or second "certified" after certification');

// ---------- 6. ranked choice, runoff, independent ----------
{
  const d = tmpData();
  L.appendReturns(report('AK', 'first', 'certified', '2026-11-18T20:00Z', [47.9, 46.6]), d);
  let r = L.compare(L.loadData(d)).find((x) => x.state === 'AK'); assert(r.winner === null && r.winner_basis === 'ranked-choice tabulation pending' && r.error_v19 === Math.round((P.v19.AK - 1.3) * 100) / 100);
  L.appendReturns(report('AK', 'rcv_final', 'certified', '2026-11-18T20:30Z', [51.2, 48.8]), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'AK'); assert(r.winner === 'D' && r.winner_basis === 'certified final ranked-choice round' && r.error_v19 === Math.round((P.v19.AK - 1.3) * 100) / 100);
  L.appendReturns(report('GA', 'first', 'certified', '2026-11-20T20:00Z', [49.6, 48.1]), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'GA'); assert(r.winner === null && r.winner_basis === 'runoff pending');
  L.appendReturns(report('GA', 'runoff', 'certified', '2026-12-10T20:00Z', [52, 48], { cert: '2026-12-15' }), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'GA'); assert(r.winner === 'D' && r.winner_basis === 'certified runoff');
  L.appendReturns(report('NE', 'first', 'certified', '2026-11-20T20:00Z', [50.2, 49.1]), d);
  const D = L.loadData(d); const t = L.seatTally(L.compare(D), D, P);
  assert.strictEqual(L.compare(D).find((x) => x.state === 'NE').winner, 'I');
  assert(t.party.I === 3 && t.caucus.unaligned === 1, 'Osborn: independent by party, unaligned by caucus (King and Sanders caucus with Democrats)');
}
ok('ranked choice scored on the first round; Georgia waits for a certified runoff; Osborn counted as independent and unaligned');

// ---------- 7. seats, control, registered record ----------
function certifyAll(d, marginFor) { real.races.forEach((race) => { const s = fromMargin(marginFor(race.state)); L.appendReturns(report(race.state, 'first', 'certified', '2026-11-25T20:00Z', s), d); if (race.ranked_choice === 'yes' && Math.max(s[0], s[1]) <= 50) L.appendReturns(report(race.state, 'rcv_final', 'certified', '2026-11-25T20:30Z', fromMargin(marginFor(race.state) * 1.2)), d); }); } // 1.1.1: a final ranked-choice round exists only without a first-round majority
function confirmUntracked(d, flip) { real.untrackedRaces.forEach((u, i) => { const w = flip && flip[u.state] ? flip[u.state] : u.incumbent_party; L.appendUntracked([{ state: u.state, round: 'final', candidate_winner: 'Winner ' + u.state, winner_party: w, reporting_status: 'certified', report_timestamp_utc: '2026-11-26T20:00Z', retrieved_at_utc: '2026-11-26T20:00Z', certification_date: '2026-11-30', authority_name: SRC[u.state].authority, source_url: url(u.state), notes: 'SYNTHETIC', entered_by: 'test' }], d); }); }
{
  const d = tmpData(); certifyAll(d, (s) => P.v19[s]);
  let D = L.loadData(d); let rows = L.compare(D);
  const p = L.scorecard(rows, 'error_v19', 'certified'); assert(p.races === 15 && p.mean_abs_error === 0 && p.leader_right === 15);
  let t = L.seatTally(rows, D, P);
  assert.deepStrictEqual([t.party.D, t.party.R, t.party.I], [51, 47, 2]); assert.deepStrictEqual([t.caucus.D, t.caucus.R], [53, 47], 'caucus-equivalent total reproduces the frozen 53/47');
  assert(t.control.computed === false && t.untracked_assumed === 20, 'no control call while untracked contests are assumed');
  confirmUntracked(d, { MT: 'D' }); D = L.loadData(d); rows = L.compare(D); t = L.seatTally(rows, D, P);
  assert(t.control.computed === true && t.caucus.D === 54 && t.caucus.R === 46 && t.control.result === 'Democratic caucus majority', 'one certified untracked upset moves exactly one seat');
  const rec = L.recordRegisteredScoring(d, { now: '2026-12-01T00:00Z', scoreOpts: { reps: 300 } });
  assert.deepStrictEqual(rec.tests.map((x) => x.id), ['H1_lv_screen', 'H2_recalled_vote', 'H3_average_without_recall', 'H4_direction']);
  assert.strictEqual(rec.tests.find((x) => x.id === 'H4_direction').decision, 'inconclusive');
  assert(rec.registered_replicates === false && /reps|300/.test(String(rec.replicates)), 'a test record says it did not use the registered replicate count');
  assert.throws(() => L.recordRegisteredScoring(d, { now: '2026-12-02T00:00Z' }), /never overwritten/);
  const recFile = path.join(d, 'registered_scoring_record.json'); const recText = fs.readFileSync(recFile, 'utf8');
  fs.writeFileSync(recFile, recText.replace('"inconclusive"', '"supports"')); assert.throws(() => L.loadData(d), /integrity/, 'edited record detected'); fs.writeFileSync(recFile, recText);
}
{
  const d = tmpData(); certifyAll(d, (s) => P.v19[s] + 5);
  const rec = L.recordRegisteredScoring(d, { now: '2026-12-01T00:00Z', scoreOpts: { reps: 300 } });
  assert.strictEqual(rec.tests.find((x) => x.id === 'H4_direction').decision, 'supports', 'polls 5 points too Republican everywhere supports H4');
}
{
  const d = tmpData(); real.races.filter((r) => r.state !== 'MS').forEach((race) => { const s = fromMargin(P.v19[race.state]); L.appendReturns(report(race.state, 'first', 'certified', '2026-11-25T20:00Z', s), d); if (race.ranked_choice === 'yes' && Math.max(s[0], s[1]) <= 50) L.appendReturns(report(race.state, 'rcv_final', 'certified', '2026-11-25T20:30Z', fromMargin(P.v19[race.state] * 1.2)), d); });
  assert.throws(() => L.recordRegisteredScoring(d, { now: '2026-12-20T00:00Z' }), /not ready/, '14 of 15 before the fallback date');
  const rec = L.recordRegisteredScoring(d, { now: '2027-01-15T00:00Z', scoreOpts: { reps: 300 } }); assert(/fallback/.test(rec.gate.reason) && rec.results_used === 14);
}
ok('seats: party 51/47/2 and caucus 53/47 when results equal the frozen margins; control only after all 35 contests confirmed; registered tests recorded once through the unchanged scorer, tamper-checked, fallback date honored');

// ---------- 8. dashboard ----------
{
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'trk-site-'));
  const { html, S } = B.build({ outDir: out, builtAt: '2026-11-03T12:00:00Z', now: '2026-11-03T12:00Z' });
  assert(/Pre-release for review/.test(html) && /No official results yet/.test(html) && /viewport-fit=cover/.test(html) && !/<script[^>]+src=/.test(html) && /@media \(max-width:360px\)/.test(html));
  assert.strictEqual(S.status_counts.none, 15); assert.strictEqual(S.registered.record, null); assert.deepStrictEqual([S.seats.party.D, S.seats.party.R, S.seats.party.I], [41, 42, 2]);
  const E = {}; new Function('document', html.match(/<script>([\s\S]*?)<\/script>/)[1])({ getElementById: (id) => (id === 'data' ? { textContent: JSON.stringify(S) } : (E[id] = E[id] || { innerHTML: '' })) });
  assert(/Party affiliation/.test(E.seats.innerHTML) && /Caucus alignment/.test(E.seats.innerHTML) && /not computed/.test(E.seats.innerHTML) && /Assumed held/.test(E.unt.innerHTML) && /Not recorded/.test(E.reg.innerHTML));
}
ok('dashboard: pre-release label, party and caucus rows, control withheld, untracked contests marked assumed, no recorded result, no external scripts, small-screen rule');

assert.deepStrictEqual(tree(L.REPO, SKIP), before, 'tracker must not write outside results_2026/tracker and docs/results');
ok('nothing outside results_2026/tracker and docs/results changed during the tests');
console.log('PASS: ' + n + ' results-tracker checks.');
