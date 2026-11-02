// v20.1 exploratory scoring (E2, E3) after certification. Runs the unchanged v20 scorer first.
// Usage: node v20_1/score_v201.js data/results_2026.csv [out.json]
const fs = require('fs');
const { load, parseCSV } = require('./run_v201.js');
const { score: scoreV20 } = require('../v20/score_v20.js');
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const crpsN = (x, s) => { const z = x / s; return s * (z * (2 * Phi(z) - 1) + 2 * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) - 1 / Math.sqrt(Math.PI)); };
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const r3 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 1000) / 1000);
function score(resultsRows, opts) {
  const L = (opts && opts.loaded) || load();
  const { out } = L;
  const confirmatory = scoreV20(resultsRows, { loaded: L.v20, reps: opts && opts.reps });
  const opp = {}; out.v20_published.forEach((p) => { opp[p.state] = p.opp_party; });
  const res = {}; resultsRows.forEach((r) => { res[r.state] = (opp[r.state] === 'I' ? Number(r.ind_pct) : Number(r.dem_pct)) - Number(r.rep_pct); });
  const cal = Object.fromEntries(out.v20_calibration.map((r) => [r.key, r.value]));
  const central = out.v20_mc.find((v) => v.key === 'central');
  const states = central.states.filter((s) => res[s.state] != null && isFinite(res[s.state]));
  const se = Object.fromEntries(out.v20_published.map((p) => [p.state, p.se_mean != null ? Math.max(p.se_mean, 0.5) : 2]));
  const e3 = states.map((s) => { const sd = Math.sqrt(cal.sigma_sys_central ** 2 + cal.sigma_state ** 2 + se[s.state] ** 2); return { state: s.state, brier: (s.p_opp - (res[s.state] > 0 ? 1 : 0)) ** 2, crps: crpsN(res[s.state] - s.center, sd) }; });
  const e2 = out.v201_recall_scenarios.map((v) => { const st = Object.keys(v.margins).filter((k) => res[k] != null && v.margins[k] != null); return { scenario: v.key, states: st.length, mean_abs_error: r3(mean(st.map((k) => Math.abs(v.margins[k] - res[k])))), mean_signed_error: r3(mean(st.map((k) => v.margins[k] - res[k]))) }; });
  return { confirmatory_H1_H4: confirmatory.tests, model_accuracy: confirmatory.accuracy, exploratory: { E2_recall_scenarios: e2, E3_proper_scores: { states: e3.length, mean_brier: r3(mean(e3.map((x) => x.brier))), mean_crps: r3(mean(e3.map((x) => x.crps))), by_state: e3.map((x) => ({ state: x.state, brier: r3(x.brier), crps: r3(x.crps) })) } }, note: 'E2 and E3 are exploratory; only H1-H4 are confirmatory.' };
}
module.exports = { score };
if (require.main === module) { const f = process.argv[2]; if (!f) { console.error('usage: node v20_1/score_v201.js <results.csv> [out.json]'); process.exit(1); } const r = score(parseCSV(fs.readFileSync(f, 'utf8'))); const t = JSON.stringify(r, null, 1); if (process.argv[3]) fs.writeFileSync(process.argv[3], t); else console.log(t); }
