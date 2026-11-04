// Polling Lab v20 — scoring after certification (does not run on Election Day; needs certified results).
// Usage: node v20/score_v20.js data/results_2026.csv [out.json]
// results CSV columns: state,dem_pct,rep_pct,ind_pct,source_url  (ind_pct used where the challenger is an independent)
// Scores: (1) accuracy of every v20 model and the frozen v19 average, (2) calibration of the experimental
// simulation, (3) the four pre-registered tests in preregistration_mike.json. Nothing is re-tuned.
const fs = require('fs');
const path = require('path');
const { load, parseCSV } = require('./run_v20.js');

function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const r2 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 100) / 100);
function interval(stats, level) { const s = stats.slice().sort((a, b) => a - b); const lo = s[Math.floor(((1 - level) / 2) * (s.length - 1))]; const hi = s[Math.ceil((1 - (1 - level) / 2) * (s.length - 1))]; return [r2(lo), r2(hi)]; }
function clusterBoot(groups, statFn, reps, seed) {
  const keys = Object.keys(groups); const R = rng(seed); const out = [];
  for (let b = 0; b < reps; b += 1) {
    const sample = []; for (let i = 0; i < keys.length; i += 1) sample.push(...groups[keys[Math.floor(R() * keys.length)]]);
    const v = statFn(sample); if (v != null && isFinite(v)) out.push(v);
  }
  return out;
}
function decide(estimate, ci, supportsIfNegative) {
  if (estimate == null || !ci) return 'inconclusive';
  if (supportsIfNegative) return ci[1] < 0 ? 'supports' : ci[0] > 0 ? 'contradicts' : 'inconclusive';
  return ci[0] > 0 ? 'supports' : ci[1] < 0 ? 'contradicts' : 'inconclusive';
}

function score(resultsRows, opts) {
  const o = opts || {};
  const { out, data } = o.loaded || load();
  const prereg = data.v20_preregistration[0];
  const reps = o.reps || prereg.bootstrap.replicates; const seed = prereg.bootstrap.seed; const level = prereg.bootstrap.interval;
  const opp = {}; out.v20_published.forEach((p) => { opp[p.state] = p.opp_party; });
  const result = {};
  resultsRows.forEach((r) => { const ch = opp[r.state] === 'I' ? Number(r.ind_pct) : Number(r.dem_pct); result[r.state] = ch - Number(r.rep_pct); });
  const has = (s) => result[s] != null && isFinite(result[s]);

  // (1) model accuracy
  const models = {
    v19_frozen_simple: Object.fromEntries(out.v20_v19_compare.map((r) => [r.state, r.v19_frozen])),
    v20_simple: Object.fromEntries(out.v20_published.map((r) => [r.state, r.simple])),
    v20_per_pollster: Object.fromEntries(out.v20_published.map((r) => [r.state, r.per_pollster])),
    v20_lv_only: Object.fromEntries(out.v20_published.map((r) => [r.state, r.lv_only])),
    v20_weighted: Object.fromEntries(out.v20_published.map((r) => [r.state, r.weighted])),
    v20_house_adj: Object.fromEntries(out.v20_published.map((r) => [r.state, r.house_adj])),
    v20_no_partisan: Object.fromEntries(out.v20_no_partisan.map((r) => [r.state, r.margin])),
    v20_trimmed: Object.fromEntries(out.v20_trimmed.map((r) => [r.state, r.margin])),
    v20_without_recall_yes: Object.fromEntries(out.v20_recall_split.map((r) => [r.state, r.without_recall_yes])),
  };
  const accuracy = Object.keys(models).map((k) => {
    const e = Object.keys(models[k]).filter((s) => has(s) && models[k][s] != null).map((s) => ({ s, err: models[k][s] - result[s], right: Math.sign(models[k][s]) === Math.sign(result[s]) }));
    return { model: k, states: e.length, mean_signed_error: r2(mean(e.map((x) => x.err))), mean_abs_error: r2(mean(e.map((x) => Math.abs(x.err)))), rmse: r2(Math.sqrt(mean(e.map((x) => x.err * x.err)))), leaders_right: e.filter((x) => x.right).length };
  });

  // (2) simulation calibration (experimental)
  const calibration = out.v20_mc.map((v) => {
    const st = v.states.filter((s) => has(s.state));
    const brier = mean(st.map((s) => (s.p_opp - (result[s.state] > 0 ? 1 : 0)) ** 2));
    const cov = v.key === 'central' ? st.filter((s) => result[s.state] >= s.p10 && result[s.state] <= s.p90).length / st.length : null;
    return { variant: v.key, states: st.length, brier: r2(brier), coverage_80: cov == null ? null : r2(cov) };
  });

  // (3) pre-registered tests
  const tests = [];
  // H1 — same-survey LV vs RV
  const pairs = data.senate_lv_rv_pairs.filter((p) => has(p.state)).map((p) => {
    const lv = Number(p.lv_dem) - Number(p.lv_rep); const rv = Number(p.rv_dem) - Number(p.rv_rep);
    const eL = lv - result[p.state]; const eR = rv - result[p.state];
    return { pollster: p.pollster, state: p.state, primary: Math.abs(eL) - Math.abs(eR), secondary: eL - eR };
  });
  const byPollster = {}; pairs.forEach((p) => { (byPollster[p.pollster] = byPollster[p.pollster] || []).push(p); });
  const h1n = pairs.length; const h1states = new Set(pairs.map((p) => p.state)).size;
  const h1p = mean(pairs.map((p) => p.primary)); const h1s = mean(pairs.map((p) => p.secondary));
  const h1ci = h1n ? interval(clusterBoot(byPollster, (a) => mean(a.map((x) => x.primary)), reps, seed), level) : null;
  let h1 = h1n >= 10 && h1states >= 4 ? decide(h1p, h1ci, false) : 'insufficient data';
  if (h1 === 'supports' && !(h1s < 0)) h1 = 'inconclusive';
  tests.push({ id: 'H1_lv_screen', n_pairs: h1n, n_states: h1states, primary: r2(h1p), primary_ci: h1ci, secondary: r2(h1s), decision: h1 });

  // H2 — recalled-vote weighting, pollster-level
  const tag = {}; data.pollster_methods.forEach((t) => { tag[t.pollster] = t.recalled_vote_weighting; });
  const isYes = (v) => /^yes\b/.test(String(v || '')); const isNo = (v) => /^no\b/.test(String(v || ''));
  const late = out.sen_polls_clean.filter((p) => has(p.state) && String(p.date) >= '2026-10-01');
  const pmean = (f) => { const g = {}; late.filter((p) => f(tag[p.pollster])).forEach((p) => { (g[p.pollster] = g[p.pollster] || []).push(p.raw - result[p.state]); }); return g; };
  const gy = pmean(isYes); const gn = pmean(isNo);
  const ky = Object.keys(gy); const kn = Object.keys(gn);
  const pm = (g) => mean(Object.keys(g).map((k) => mean(g[k])));
  const pma = (g) => mean(Object.keys(g).map((k) => mean(g[k].map(Math.abs))));
  let h2 = 'insufficient data'; let h2est = null; let h2ci = null;
  if (ky.length >= 3 && kn.length >= 3) {
    h2est = pm(gy) - pm(gn);
    const R = rng(seed + 2); const stats = [];
    for (let b = 0; b < reps; b += 1) {
      const sy = []; for (let i = 0; i < ky.length; i += 1) sy.push(mean(gy[ky[Math.floor(R() * ky.length)]]));
      const sn = []; for (let i = 0; i < kn.length; i += 1) sn.push(mean(gn[kn[Math.floor(R() * kn.length)]]));
      stats.push(mean(sy) - mean(sn));
    }
    h2ci = interval(stats, level);
    h2 = decide(h2est, h2ci, true);
    if (h2 === 'supports' && !(pma(gy) > pma(gn))) h2 = 'inconclusive';
  }
  tests.push({ id: 'H2_recalled_vote', pollsters_recall: ky.length, pollsters_no_recall: kn.length, primary: r2(h2est), primary_ci: h2ci, mae_recall: r2(ky.length ? pma(gy) : null), mae_no_recall: r2(kn.length ? pma(gn) : null), decision: h2 });

  // H3 — average without recall-weighting pollsters
  const split = out.v20_recall_split.filter((r) => has(r.state) && r.all != null && r.without_recall_yes != null);
  const maeAll = mean(split.map((r) => Math.abs(r.all - result[r.state])));
  const maeEx = mean(split.map((r) => Math.abs(r.without_recall_yes - result[r.state])));
  const fullSigned = mean(split.map((r) => r.all - result[r.state]));
  let h3 = 'insufficient data';
  if (split.length >= 8) h3 = maeEx - maeAll <= -0.5 && fullSigned < 0 ? 'supports' : maeEx - maeAll >= 0.5 ? 'contradicts' : 'inconclusive';
  tests.push({ id: 'H3_average_without_recall', states: split.length, primary: r2(maeEx - maeAll), full_mean_signed_error: r2(fullSigned), decision: h3 });

  // H4 — direction of the frozen averages
  const fz = out.v20_v19_compare.filter((r) => has(r.state) && r.v19_frozen != null).map((r) => ({ state: r.state, err: r.v19_frozen - result[r.state] }));
  const h4est = mean(fz.map((x) => x.err));
  const byState = {}; fz.forEach((x) => { byState[x.state] = [x]; });
  const h4ci = fz.length ? interval(clusterBoot(byState, (a) => mean(a.map((x) => x.err)), reps, seed + 4), level) : null;
  tests.push({ id: 'H4_direction', states: fz.length, primary: r2(h4est), primary_ci: h4ci, negative_states: fz.filter((x) => x.err < 0).length, decision: fz.length ? decide(h4est, h4ci, true) : 'insufficient data' });

  return { scored_at: new Date().toISOString(), states_with_results: Object.keys(result).length, accuracy, calibration, tests };
}

module.exports = { score };

if (require.main === module) {
  const f = process.argv[2];
  if (!f) { console.error('usage: node v20/score_v20.js <results.csv> [out.json]'); process.exit(1); }
  const res = score(parseCSV(fs.readFileSync(f, 'utf8')));
  const txt = JSON.stringify(res, null, 1);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], txt); else console.log(txt);
}
