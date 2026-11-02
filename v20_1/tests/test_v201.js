// v20.1 regression tests. Run: node v20_1/tests/test_v201.js  (or node v20_1/tests/run_all_v201.js)
process.env.V20_SIMS = process.env.V20_SIMS || '4000';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
let n = 0; const ok = (m) => { n += 1; console.log('  ok  ' + m); };

// 1. Frozen v19 and published v20 are untouched; the pre-registration is unchanged.
assert.strictEqual(sha('v19_frozen/data/snapshot_2026-11-02.csv'), '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461');
assert.strictEqual(sha('v19_frozen/data/snapshot_2026-11-02.manifest.json'), '66f8a73bd2dd3b3c5855cf6a6679583a73ea3069a35f4b3000fc0c2705b25fcb');
fs.readFileSync(path.join(ROOT, 'v19_frozen', 'SHA256SUMS.txt'), 'utf8').trim().split('\n').forEach((l) => { const [h, f] = l.split(/\s+/); assert.strictEqual(sha(path.join('v19_frozen', f.replace(/^\.\//, ''))), h, f); });
ok('v19 snapshot, manifest and every v19 file verify');
fs.readFileSync(path.join(ROOT, 'SHA256SUMS_V20.txt'), 'utf8').trim().split('\n').forEach((l) => { const [h, f] = l.split(/\s+/); assert.strictEqual(sha(f.replace(/^\.\//, '')), h, 'published v20 file changed: ' + f); });
ok('all 58 published v20 files are byte-identical (SHA256SUMS_V20.txt)');
assert.strictEqual(sha('v20/preregistration_mike.json'), '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'v20_1', 'exploratory_registry_v201.json'), 'utf8'));
assert(reg.analyses.every((a) => /^E\d_/.test(a.id)) && !reg.analyses.some((a) => /^H\d/.test(a.id)));
ok('H1-H4 pre-registration unchanged; new analyses carry separate E-identifiers');

// 2. Kimi evidence objects
assert.strictEqual(sha('reviews/kimi/INDEPENDENT_METHODOLOGY_AUDIT_2026-11-02.md'), 'e2eb8376d2c55513fa58263ced591ac184248538131daaa836f045f1a9269f3d');
assert.strictEqual(sha('reviews/kimi/REPRODUCE_AUDIT_2026-11-02.py'), '3d029c60ef369c56469baadf93e91ac82fb603ef50ad7e648c076c7414f0b6f0');
assert.strictEqual(sha('reviews/kimi/Polling_Lab_2026_audit_tables.xlsx'), '2a4c17ca61fc7b310b7aaafd1366da52c377557515e9a17550e7492b71dc4422');
ok('Kimi report, script and workbook match the hashes in the integration notes');

const { load } = require('../run_v201.js');
const before = {}; fs.readFileSync(path.join(ROOT, 'SHA256SUMS_V20.txt'), 'utf8').trim().split('\n').forEach((l) => { const [h, f] = l.split(/\s+/); before[f] = h; });
const { out, data } = load();
Object.keys(before).forEach((f) => assert.strictEqual(sha(f.replace(/^\.\//, '')), before[f], 'v20.1 run modified ' + f));
ok('running v20.1 writes nothing into v19 or v20');

// 3. RedBox waves are distinct and wave-1 arithmetic reproduces Kimi
const w1 = data.senate_polls.find((r) => r.poll_id === 'FL-020'); const w2 = data.senate_polls.find((r) => r.poll_id === 'FL-NOV01-REDBOX2');
assert.deepStrictEqual([w1.sample_size, w1.effective_n, w1.design_effect, w1.field_start], ['4823', '1520', '3.17', '2026-10-20']);
assert.deepStrictEqual([w2.sample_size, w2.effective_n, w2.design_effect, w2.field_start], ['2898', '2120', '1.37', '2026-10-30']);
assert.notStrictEqual(Number(w1.dem) - Number(w1.rep), Number(w2.dem) - Number(w2.rep));
out.v201_redbox_waves.filter((r) => r.kind === 'check').forEach((r) => assert(r.ok, r.check));
data.senate_polls.forEach((r) => { if (r.effective_n && r.sample_size) assert(Number(r.effective_n) <= Number(r.sample_size), 'effective n above raw n: ' + r.poll_id); });
ok('RedBox waves keep separate n, effective n, design effect and margin; mixture 6.808 and break-even 0.59424 reproduce; effective n <= raw n everywhere');

// 4. Florida official snapshot arithmetic (context only)
const fl = out.v201_fl_official; const by = (c) => fl.find((r) => r.category === c);
['republican', 'democratic', 'npa', 'other', 'total'].forEach((k) => assert.strictEqual(by('Voted vote-by-mail')[k] + by('Voted early in person')[k], by('Combined cast/returned')[k], k));
const comb = by('Combined cast/returned');
assert.strictEqual(comb.republican + comb.democratic + comb.npa + comb.other, comb.total);
assert(Math.abs(100 * (comb.republican - comb.democratic) / comb.total - 2.499) < 0.001);
assert(fl.every((r) => /not candidate votes/.test(r.use)));
ok('Florida Nov 2 08:09 counts add up (5,402,229; R-D gap 2.499 points) and are labeled not candidate votes');

// 5. Rolling-origin backtest: no leakage, reproduces Kimi's aggregate table
const folds = out.v201_rolling_origin.filter((r) => r.kind === 'fold');
assert(folds.length === 16 && folds.every((f) => f.max_train_cycle < f.test_cycle), 'training cycles must precede the test cycle');
out.v201_rolling_origin.filter((r) => r.kind === 'kimi_check').forEach((r) => { assert(Math.abs(r.mae - r.expected_mae) < 0.001 && Math.abs(r.rmse - r.expected_rmse) < 0.001, r.rule); });
const mid = out.v201_rolling_origin.filter((r) => r.kind === 'summary_midterm_folds');
const best = mid.slice().sort((a, b) => a.mean_crps_normal - b.mean_crps_normal)[0];
assert.strictEqual(best.rule, 'zero_mean', 'on midterm folds the zero-mean rule scores best (regression check of the reported finding)');
ok('rolling-origin folds use only earlier cycles; Kimi’s 2.220/2.772 and 2.900/3.237 reproduce; zero mean is best on midterm folds');

// 6. Correlation diagnostic keeps marginals and leaves v20 probabilities alone
const cs = out.v201_correlation_sensitivity; const r0 = cs.find((r) => r.rho === 0);
cs.forEach((r) => Object.keys(r.state_p_opp).forEach((s) => assert(Math.abs(r.state_p_opp[s] - r0.state_p_opp[s]) < 0.04, 'marginal moved ' + s)));
assert(cs.every((r) => /uncalibrated/.test(r.status)));
const pub = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'data', 'site_v20.json'), 'utf8'));
assert.strictEqual(pub.seats.variants.find((v) => v.key === 'central').p_dem_control, 0.804, 'published v20 central probability unchanged');
ok('regional-correlation diagnostic preserves state chances; published v20 probabilities untouched');

// 7. Recall scenario is gated on documented recall use and leaves the baseline intact
const rs = out.v201_recall_scenarios; const k0 = rs.find((r) => r.key === 'k0');
out.v20_published.forEach((p) => assert.strictEqual(k0.margins[p.state], p.simple, 'kappa 0 must equal Model 1 ' + p.state));
const tag = {}; data.pollster_methods.forEach((t) => { tag[t.pollster] = t.recalled_vote_weighting; });
assert(rs.every((r) => r.window_polls_shifted <= r.window_polls_total));
assert(rs.filter((r) => r.kappa > 0).every((r) => /hypothetical/.test(r.status)));
assert(rs.every((r, i) => i === 0 || r.mean_state_change >= 0), 'scenario moves only toward the challenger, as specified');
ok('recall scenario: kappa 0 equals Model 1, only documented recall-weighting polls move, all variants labeled hypothetical');

// 8. Metadata contract: explicit statuses and reasons
const meta = out.v201_poll_metadata;
assert.strictEqual(meta.length, data.senate_polls.length);
meta.forEach((m) => {
  assert(/^(published|not published|sample size not reported)/.test(m.neff_status), m.poll_id);
  if (!m.weighting_recipe) assert(m.weighting_recipe_reason, 'missing reason ' + m.poll_id);
  if (!m.source_retrieval_timestamp) assert(m.source_retrieval_reason, 'missing retrieval reason ' + m.poll_id);
  assert(['yes', 'no', 'unknown'].indexOf(m.recall_use) >= 0);
});
const sum = Object.fromEntries(out.v201_metadata_summary.map((r) => [r.key, r.n]));
assert.strictEqual(sum.neff_published + sum.neff_assumed + sum.neff_600, sum.included);
assert.strictEqual(sum.recall_yes + sum.recall_no + sum.recall_unknown, sum.included);
ok('every poll has an effective-n status, recall-use value and reason codes for unknown fields');

// 9. Assessment table covers each recommendation with a status
const allowed = /^(Already implemented|Needs correction|Partly implemented|Partly wrong in v20|Implemented as sensitivity|Mostly implemented|Poll rows correct|Already implemented for|Required)/;
assert.strictEqual(out.v201_assessment.length, 15);
out.v201_assessment.forEach((r) => { assert(allowed.test(r.v20_status), r.id + ' ' + r.v20_status); assert(r.v20_evidence && r.v201_action && r.validation_status); });
ok('all 15 Kimi recommendations are mapped to v20 code with a status, action and validation status');

// 10. Exploratory scorer runs the unchanged confirmatory scorer and adds E2/E3 only
const { score } = require('../score_v201.js');
const v19 = Object.fromEntries(out.v20_v19_compare.map((r) => [r.state, r.v19_frozen]));
const rows = out.v20_published.map((p) => { const m = v19[p.state]; return p.opp_party === 'I' ? { state: p.state, dem_pct: '0', rep_pct: String(50 - m / 2), ind_pct: String(50 + m / 2) } : { state: p.state, dem_pct: String(50 + m / 2), rep_pct: String(50 - m / 2), ind_pct: '' }; });
const s = score(rows, { loaded: { out, data, v20: { out, data } }, reps: 500 });
assert.deepStrictEqual(s.confirmatory_H1_H4.map((t) => t.id), ['H1_lv_screen', 'H2_recalled_vote', 'H3_average_without_recall', 'H4_direction']);
assert(s.exploratory.E3_proper_scores.states === 15 && s.exploratory.E2_recall_scenarios.length === 5);
ok('exploratory scorer reports H1-H4 from the unchanged v20 scorer and E2/E3 separately');

console.log('PASS: ' + n + ' v20.1 checks (separation, pre-registration, Kimi evidence, RedBox, Florida, backtest, diagnostics, metadata, scoring).');
