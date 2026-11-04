// Tracker 1.1.2 regression tests: exactly two finalists in a final ranked-choice round, documentation of Maine's
// Round 0 vs Round 1, and nothing else changed. Written before the fix. Synthetic data only, in temp folders.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const L = require('../lib/results_lib.js');
const results = [];
function check(id, title, fn) { try { fn(); results.push({ id, ok: true }); console.log('  PASS ' + id + ' ' + title); } catch (e) { results.push({ id, ok: false }); console.log('  FAIL ' + id + ' ' + title + '\n       -> ' + String(e && e.message || e).split('\n')[0].slice(0, 220)); } }
const must = (c, m) => { if (!c) throw new Error(m); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base = L.loadData(); const RACE = Object.fromEntries(base.races.map((r) => [r.state, r])); const SRC = Object.fromEntries(base.sources.map((s) => [s.state, s]));
const fresh = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trk112-')); fs.cpSync(L.DATA, d, { recursive: true }); return d; };
function rep(st, round, ts, cands) {
  const race = RACE[st]; const named = cands.map(([n, p, v]) => [n === 'CH' ? race.challenger : n === 'REP' ? race.republican : n, n === 'CH' ? race.challenger_party : n === 'REP' ? 'R' : p, v]);
  const total = named.reduce((s, c) => s + c[2], 0);
  const b = { state: st, round, reporting_status: 'certified', reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC', report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: '2026-11-30', authority_name: SRC[st].authority, source_url: 'https://' + SRC[st].authority_domains.split(';')[0] + '/results', notes: 'SYNTHETIC', entered_by: 'test' };
  return named.map(([candidate, ballot_party, votes]) => Object.assign({}, b, { candidate, ballot_party, votes: String(votes), total_votes: String(total) }));
}
const P = L.frozenPredictions(); const r2 = (x) => Math.round(x * 100) / 100;
console.log('Tracker 1.1.2 regression tests (final ranked-choice round: exactly two finalists)');
['AK', 'ME'].forEach((st) => {
  check('F1-' + st, st + ': a final round with three or four continuing candidates is rejected', () => {
    const d = fresh(); L.appendReturns(rep(st, 'first', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 280000], ['Third candidate', 'I', 250000], ['Fourth candidate', 'L', 170000]]), d);
    [[['CH', '', 300000], ['REP', '', 150000], ['Third candidate', 'I', 550000]], [['CH', '', 300000], ['REP', '', 100000], ['Third candidate', 'I', 520000], ['Fourth candidate', 'L', 80000]]].forEach((c) => {
      let msg = null; try { L.appendReturns(rep(st, 'rcv_final', '2026-12-01T01:00Z', c), d); } catch (e) { msg = e.message; }
      must(msg && /exactly two/.test(msg), c.length + '-candidate final round ' + (msg ? 'rejected for another reason: ' + msg.slice(0, 120) : 'accepted'));
    });
  });
  check('F2-' + st, st + ': a lawful two-finalist final round is accepted and decides the winner; polling error unchanged', () => {
    const d = fresh(); L.appendReturns(rep(st, 'first', '2026-11-30T01:00Z', [['CH', '', 300000], ['REP', '', 380000], ['Third candidate', 'I', 320000]]), d);
    L.appendReturns(rep(st, 'rcv_final', '2026-12-01T01:00Z', [['REP', '', 450000], ['Third candidate', 'I', 550000]]), d);
    const r = L.compare(L.loadData(d)).find((x) => x.state === st);
    must(r.winner === 'I' && r.winner_candidate === 'Third candidate' && r.winner_basis === 'certified final ranked-choice round', 'winner=' + r.winner);
    must(r.error_v19 === r2(P.v19[st] + 8), 'polling error must stay first-round challenger minus Republican');
  });
});
check('F3', 'data-entry guide explains Maine Round 0 versus Round 1 and the Georgia runoff replacement exception', () => {
  const g = fs.readFileSync(path.join(L.TRACKER, 'DATA_ENTRY_GUIDE.md'), 'utf8');
  must(/Round 0/.test(g) && /Round 1/.test(g) && /blank first choice/i.test(g), 'Maine Round 0 / Round 1 distinction missing');
  must(/21-2-501/.test(g), 'Georgia runoff replacement exception missing');
  must(/verification checklist/i.test(g), 'human verification checklist missing');
});
check('F4', 'the 1.1.1 conventions are preserved (active in 1.1.2; archived byte-for-byte from 1.1.3); vendored dependencies and frozen anchors unchanged', () => {
  const cur = sha(path.join(L.DATA, 'scoring_conventions.json')); const arch = path.join(L.DATA, 'archive', 'scoring_conventions_v1.1.1.json');
  must(cur === '7f22e564dc8929b038616f9a1b2ef9271018e388c93bb2085b4c54510a9c5794' || (fs.existsSync(arch) && sha(arch) === '7f22e564dc8929b038616f9a1b2ef9271018e388c93bb2085b4c54510a9c5794'), '1.1.1 conventions lost');
  must(L.verifyDependencies().ok && L.verifyDependencies().manifest_sha256 === '0c42360cac97409dc3923a2b09e55ca86f1e6473f2e7bc84ccf616b2ca72a69b', 'dependencies changed');
  must(L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'] === '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461' && L.deps.PINNED.anchors['v20/preregistration_mike.json'] === '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af', 'anchors changed');
});
check('F5', 'ChatGPT\'s 1.1 edge-test file is archived byte-for-byte; the copy that runs differs only in its final-round fixtures', () => {
  const orig = path.join(L.TRACKER, 'tests', 'independent', 'original', 'TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js');
  must(fs.existsSync(orig) && sha(orig) === '9d93452fcf16f2c839e8c23a5c33c4fb527c0d9f955d67e40d4ed661d6a39a53', 'original not archived unchanged');
  const upd = fs.readFileSync(path.join(L.TRACKER, 'tests', 'independent', 'TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js'), 'utf8');
  must(/two finalists/i.test(upd), 'running copy lacks its change note');
  must(!/'rcv_final'[^\]]*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/.test(upd), 'running copy still has a three-candidate final round'); // first rounds (e.g. Georgia) may list three candidates
});
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks pass' + (failed.length ? '; failing: ' + failed.map((f) => f.id).join(', ') : ''));
process.exit(failed.length ? 1 : 0);
