/* Polling Lab v20.1 — post-freeze methodology review layer (Kimi audit integration).
   Runs on top of the UNCHANGED v20 run (v19 engine + v20 engine + v20 data). Every id starts with v201_.
   Nothing here edits a v19 or v20 output, the v20 probabilities, or the H1-H4 pre-registration.
   New analyses are exploratory (E1-E3 in exploratory_registry_v201.json), never confirmatory. */
const V201 = (() => {
  const sims = Number(process.env.V20_SIMS || 20000);
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(rand) { let spare = null; return function () { if (spare !== null) { const s = spare; spare = null; return s; } let u = 0; while (u === 0) u = rand(); const v = rand(); const r = Math.sqrt(-2 * Math.log(u)); spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v); }; }
  function tUnit(g, nu) { if (!isFinite(nu)) return g(); let c = 0; for (let k = 0; k < nu; k += 1) { const z = g(); c += z * z; } return (g() / Math.sqrt(c / nu)) / Math.sqrt(nu / (nu - 2)); }
  const r3 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 1000) / 1000);
  const r1 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 10) / 10);
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
  const quant = (s, q) => { const i = (s.length - 1) * q; const lo = Math.floor(i); const hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  const isYes = (v) => /^yes\b/.test(String(v || '')); const isNo = (v) => /^no\b/.test(String(v || ''));
  const comp = (states) => states.filter((s) => s.race === 'yes' && s.forecaster_rating === 'Competitive');
  const oppOf = (c) => (String(c.dem_candidate || '').trim() ? 'D' : 'I');
  function seatsFor(m, cs, base) {
    let d = 0, r = 0, i = 0; cs.forEach((c) => { const v = m[c.state]; let w = c.incumbent_party; if (v != null && Math.abs(v) >= 0.05) w = v > 0 ? oppOf(c) : 'R'; if (w === 'D') d += 1; else if (w === 'I') i += 1; else r += 1; });
    const dem = base.base_d + d; const rep = base.base_r + r;
    return { dem, rep, ind: i, control: dem >= 51 ? 'Democrats' : rep >= 50 ? 'Republicans' : 'No majority without the independent' };
  }
  function windowPolls(polls, state) { const all = polls.filter((p) => p.state === state).sort((a, b) => a.age - b.age); let w = all.filter((p) => p.age <= 30); if (w.length < 3) w = all.slice(0, 3); return w; }
  // Student-t (unit variance, nu=4) density and quantiles; normal CRPS (closed form).
  const lgamma = (z) => { const g = 7; const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z); z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i += 1) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); };
  function logT(x, sigma, nu) { const s = sigma / Math.sqrt(nu / (nu - 2)); const z = x / s; return lgamma((nu + 1) / 2) - lgamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - Math.log(s) - ((nu + 1) / 2) * Math.log(1 + (z * z) / nu); }
  function logN(x, sigma) { return -0.5 * Math.log(2 * Math.PI) - Math.log(sigma) - (x * x) / (2 * sigma * sigma); }
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  function crpsN(x, sigma) { const z = x / sigma; const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); return sigma * (z * (2 * Phi(z) - 1) + 2 * pdf - 1 / Math.sqrt(Math.PI)); }
  return { sims, mulberry32, gauss, tUnit, r1, r3, mean, rms, quant, isYes, isNo, comp, oppOf, seatsFor, windowPolls, logT, logN, crpsN };
})();

/* ---------- K8 / K6: data contract with explicit nulls and reason codes ---------- */
dash.calc('v201_poll_metadata', {
  inputs: ['senate_polls', 'pollster_methods'],
  title: 'Poll metadata contract (v20.1)',
  description: 'Per Senate row: release group, raw and effective n with an explicit effective-n status, recalled-vote use, weighting recipe, evidence status, source version and retrieval time. Unknown values are null with a reason code; nothing is inferred silently.',
  fn: (sp, pm) => {
    const tag = {}; pm.forEach((t) => { tag[t.pollster] = t; });
    return sp.map((r) => {
      const t = tag[r.pollster] || null;
      const v = String(r.verification || '') + ' ' + String(r.provenance || '');
      const evidence = /read by Claude|read directly|primary|pollster release|pollster report|original/i.test(v) ? 'primary source read' : /PollCheck|270toWin|pollster link|DDHQ/i.test(v) ? 'aggregator listing with pollster link' : 'secondary or unspecified';
      const neffStatus = r.effective_n ? 'published' : r.sample_size ? 'not published (v19 engine uses raw n as an assumption; design effect unknown)' : 'sample size not reported (v19 engine assumes 600)';
      let retrieval = null; let retrievalReason = 'not recorded at ingestion (before v20.1)';
      if (r.release_cohort === 'v20_post_freeze') { retrieval = '2026-11-02'; retrievalReason = ''; }
      if (r.poll_id === 'FL-020') { retrieval = '2026-10-29'; retrievalReason = 'methodology read by Claude; crosstabs by ChatGPT'; }
      if (r.poll_id === 'FL-NOV01-REDBOX2') { retrieval = '2026-11-01'; retrievalReason = 'ChatGPT v18.1 audit'; }
      return {
        poll_id: r.poll_id, state: r.state, pollster: r.pollster, include: r.include,
        release_group_id: [r.state, r.pollster, r.field_end || r.date].join('|'),
        raw_n: r.sample_size ? Number(r.sample_size) : null, effective_n: r.effective_n ? Number(r.effective_n) : null, neff_status: neffStatus,
        population: r.population || null,
        recall_use: t ? (V201.isYes(t.recalled_vote_weighting) ? 'yes' : V201.isNo(t.recalled_vote_weighting) ? 'no' : 'unknown') : 'unknown',
        recall_use_scope: t ? t.tag_scope || 'pollster-level' : 'no tag',
        weighting_recipe: t && (t.party_weighting || t.recalled_vote_weighting) ? ('party: ' + (t.party_weighting || 'not stated') + '; recalled vote: ' + (t.recalled_vote_weighting || 'not stated')) : null,
        weighting_recipe_reason: t ? '' : 'pollster methods not documented in the lab',
        sponsor_affiliation: r.partisan_flag || 'none flagged',
        evidence_status: evidence,
        source_version: r.poll_id === 'FL-020' ? 'redbox_fl_w1' : r.poll_id === 'FL-NOV01-REDBOX2' ? 'redbox_fl_w2' : '',
        source_retrieval_timestamp: retrieval, source_retrieval_reason: retrievalReason,
      };
    });
  },
});

dash.calc('v201_metadata_summary', {
  inputs: ['v201_poll_metadata'],
  title: 'Metadata coverage (included polls)',
  description: 'How many included polls have a published effective n, a documented recalled-vote method, a primary-source read and a recorded retrieval time.',
  fn: (meta) => {
    const inc = meta.filter((m) => m.include === 'yes');
    const count = (f) => inc.filter(f).length;
    return [
      { key: 'included', label: 'Included Senate polls', n: inc.length },
      { key: 'neff_published', label: 'Effective n published by the pollster', n: count((m) => m.neff_status === 'published') },
      { key: 'neff_assumed', label: 'Effective n not published (raw n used as an assumption)', n: count((m) => /^not published/.test(m.neff_status)) },
      { key: 'neff_600', label: 'Sample size not reported (600 assumed)', n: count((m) => /^sample size not reported/.test(m.neff_status)) },
      { key: 'recall_yes', label: 'Recalled-vote weighting documented: yes', n: count((m) => m.recall_use === 'yes') },
      { key: 'recall_no', label: 'Recalled-vote weighting documented: no', n: count((m) => m.recall_use === 'no') },
      { key: 'recall_unknown', label: 'Recalled-vote use unknown', n: count((m) => m.recall_use === 'unknown') },
      { key: 'primary', label: 'Primary source read', n: count((m) => m.evidence_status === 'primary source read') },
      { key: 'aggregator', label: 'Aggregator listing with pollster link', n: count((m) => m.evidence_status === 'aggregator listing with pollster link') },
      { key: 'retrieval_known', label: 'Retrieval time recorded', n: count((m) => m.source_retrieval_timestamp) },
    ];
  },
});

/* ---------- K6: what the silent effective-n default does ---------- */
dash.calc('v201_neff_sensitivity', {
  inputs: ['sen_polls_clean', 'v20_published'],
  title: 'Effective-n assumption: sensitivity',
  description: 'The v19 engine uses raw n when a pollster publishes no effective n. This recomputes the n-dependent outputs (mean gap margin of error and the recency-weighted average) assuming a design effect of 1.5 for those polls. The simple average and the v20 simulation do not use per-poll n, so they are unaffected.',
  fn: (polls, pub) => Array.from(new Set(polls.map((p) => p.state))).sort().map((s) => {
    const w = V201.windowPolls(polls, s);
    const moe = (deff) => V201.mean(w.map((p) => (p.effective_n ? p.margin_moe : p.margin_moe * Math.sqrt(deff))));
    const wavg = (deff) => { const all = polls.filter((p) => p.state === s).sort((a, b) => a.age - b.age); let win = all.filter((p) => p.age <= 30); if (win.length < 3) win = all.slice(0, 3); const wt = win.map((p) => Math.pow(0.5, p.age / 14) * Math.sqrt(Math.min(p.effective_n || (p.sample_size || 600) / deff, 2000))); const tw = wt.reduce((a, b) => a + b, 0); return win.reduce((acc, p, i) => acc + wt[i] * p.raw, 0) / tw; };
    const p = pub.find((x) => x.state === s) || {};
    return { state: s, polls_window: w.length, published_neff_in_window: w.filter((x) => x.effective_n).length, mean_moe_v19_assumption: V201.r1(moe(1)), mean_moe_deff_1_5: V201.r1(moe(1.5)), weighted_v20: p.weighted, weighted_deff_1_5: V201.r1(wavg(1.5)), weighted_change: V201.r1(wavg(1.5) - wavg(1)) };
  }),
});

/* ---------- K7: two distinct RedBox Florida waves ---------- */
dash.calc('v201_redbox_waves', {
  inputs: ['redbox_waves_v201', 'senate_polls', 'fl_redbox_kimi_subgroup_full'],
  title: 'RedBox Florida: two separate surveys',
  description: 'Wave 1 (Oct 20-23, n 4,823) and wave 2 (Oct 30-31, n 2,898) have different samples, weights, effective n, targets and margins. Wave-1 subgroup arithmetic is checked against Kimi’s reproduction.',
  fn: (waves, sp, sub) => {
    const rows = waves.map((w) => { const p = sp.find((r) => r.poll_id === w.poll_id_in_v19_v20) || {}; return Object.assign({ kind: 'wave', data_row_n: p.sample_size, data_row_effective_n: p.effective_n, data_row_margin: p.dem && p.rep ? Number(p.dem) - Number(p.rep) : null }, w); });
    const pct = (x) => Number(String(x).replace('%', ''));
    const g = (k) => sub.find((r) => r.key === k);
    const already = pct(g('already').Moody) - pct(g('already').Nixon);
    const notYet = pct(g('not_yet').Moody) - pct(g('not_yet').Nixon);
    const s = 0.41657011; // weighted already-voted share from Kimi's reproduction of the wave-1 crosstabs
    const mix = s * already + (1 - s) * notYet;
    const breakEven = notYet / (notYet - already);
    rows.push({ kind: 'check', wave_id: 'redbox_fl_w1', check: 'mixture of already-voted and not-yet-voted margins at s = 0.41657', value: V201.r3(mix), expected: 6.808, ok: Math.abs(mix - 6.808) <= 0.002 });
    rows.push({ kind: 'check', wave_id: 'redbox_fl_w1', check: 'already-voted break-even share (algebraic sensitivity, not a forecast)', value: Number(breakEven.toFixed(5)), expected: 0.59424, ok: Math.abs(breakEven - 0.59424) <= 0.0001 });
    const n1 = Number(waves[0].raw_n), n2 = Number(waves[1].raw_n);
    rows.push({ kind: 'check', wave_id: 'both', check: 'waves share no sample size, effective n, design effect or margin', value: [n1 !== n2, waves[0].effective_n !== waves[1].effective_n, waves[0].design_effect !== waves[1].design_effect].every(Boolean), expected: true, ok: true });
    return rows;
  },
});

/* ---------- K3: calibration sources and where v20 mixed estimators ---------- */
dash.calc('v201_calibration_review', {
  inputs: ['calibration_sources_v201', 'v20_calibration'],
  title: 'Calibration inputs by estimator',
  description: 'Each historical input with its comparability group. v20 settings that combine different estimators are relabeled as cross-source stress settings; their numbers are unchanged.',
  fn: (src, cal) => {
    const rows = src.map((r) => ({ kind: 'input', key: r.key, group: r.comparability_group, cycle: r.cycle, signed_error: Number(r.signed_error), used_in_v20_as: r.used_in_v20_as, v201_label: r.v201_label }));
    const c = (k) => (cal.find((x) => x.key === k) || {}).value;
    rows.push({ kind: 'setting', key: 'sigma_sys_central', group: 'AAPOR all-office only', value: c('sigma_sys_central'), v201_label: 'Single estimator series; retained as the central scale' });
    rows.push({ kind: 'setting', key: 'sigma_sys_high', group: 'AAPOR all-office + RealClearPolitics 2025 governor mean', value: c('sigma_sys_high'), v201_label: 'Mixes estimators: relabeled a cross-source stress setting, not a calibrated scale' });
    rows.push({ kind: 'setting', key: 'sigma_sys_midterm', group: 'AAPOR all-office 2018, 2022 + AAPOR Senate-only 2022', value: c('sigma_sys_midterm'), v201_label: 'Mixes all-office and Senate-only values from two cycles: relabeled a diagnostic, not a calibrated scale' });
    return rows;
  },
});

/* ---------- K4 / E1: rolling-origin backtest at cycle level, with proper scores ---------- */
dash.calc('v201_rolling_origin', {
  inputs: ['calibration_sources_v201'],
  title: 'Rolling-origin backtest of mean rules (AAPOR all-office cycles)',
  description: 'For each test cycle, only earlier cycles are used (no leakage). Rules differ only in the mean they assume; the scale is the root-mean-square of the training errors. Scores: residual, coverage of t(4) intervals, log score and normal CRPS. Four test cycles: a diagnostic, not a validated calibration.',
  fn: (src) => {
    const series = src.filter((r) => /^AAPOR updated archive, all offices/.test(r.comparability_group)).map((r) => ({ cycle: Number(r.cycle), type: r.cycle_type, e: Number(r.signed_error) })).sort((a, b) => a.cycle - b.cycle);
    const rules = {
      zero_mean: (train) => 0,
      running_mean: (train) => V201.mean(train.map((x) => x.e)),
      shrunk_mean_half: (train) => 0.5 * V201.mean(train.map((x) => x.e)),
      previous_presidential: (train) => { const p = train.filter((x) => x.type === 'Presidential'); return p.length ? p[p.length - 1].e : 0; },
    };
    const t90 = 1.533 / Math.sqrt(2), t975 = 2.776 / Math.sqrt(2);
    const rows = [];
    series.forEach((test, i) => {
      const train = series.slice(0, i);
      if (!train.length) return;
      const sigma = V201.rms(train.map((x) => x.e));
      Object.keys(rules).forEach((k) => {
        const mu = rules[k](train); const res = test.e - mu;
        rows.push({ kind: 'fold', rule: k, test_cycle: test.cycle, test_type: test.type, train_cycles: train.map((x) => x.cycle).join(' '), max_train_cycle: Math.max.apply(null, train.map((x) => x.cycle)), mean_used: V201.r3(mu), sigma: V201.r3(sigma), error: test.e, residual: V201.r3(res), inside80: Math.abs(res) <= sigma * t90, inside95: Math.abs(res) <= sigma * t975, log_score_t4: V201.r3(V201.logT(res, sigma, 4)), log_score_normal: V201.r3(V201.logN(res, sigma)), crps_normal: V201.r3(V201.crpsN(res, sigma)) });
      });
    });
    Object.keys(rules).forEach((k) => {
      const fm = rows.filter((r) => r.kind === 'fold' && r.rule === k && r.test_type === 'Midterm');
      rows.push({ kind: 'summary_midterm_folds', rule: k, folds: fm.length, mae: V201.r3(V201.mean(fm.map((r) => Math.abs(r.residual)))), rmse: V201.r3(V201.rms(fm.map((r) => r.residual))), mean_log_score_t4: V201.r3(V201.mean(fm.map((r) => r.log_score_t4))), mean_crps_normal: V201.r3(V201.mean(fm.map((r) => r.crps_normal))) });
    });
    Object.keys(rules).forEach((k) => {
      const f = rows.filter((r) => r.kind === 'fold' && r.rule === k);
      rows.push({ kind: 'summary', rule: k, folds: f.length, mae: V201.r3(V201.mean(f.map((r) => Math.abs(r.residual)))), rmse: V201.r3(V201.rms(f.map((r) => r.residual))), coverage80: V201.r3(f.filter((r) => r.inside80).length / f.length), coverage95: V201.r3(f.filter((r) => r.inside95).length / f.length), mean_log_score_t4: V201.r3(V201.mean(f.map((r) => r.log_score_t4))), mean_crps_normal: V201.r3(V201.mean(f.map((r) => r.crps_normal))) });
    });
    // Cross-check against Kimi's in-sample aggregate table (all five cycles; not a backtest).
    const all = series.map((x) => x.e);
    rows.push({ kind: 'kimi_check', rule: 'zero_mean (in-sample, five cycles)', mae: V201.r3(V201.mean(all.map(Math.abs))), rmse: V201.r3(V201.rms(all)), expected_mae: 2.22, expected_rmse: 2.772 });
    const prevPres = [series[1].e - series[0].e, series[2].e - series[0].e, series[3].e - series[2].e, series[4].e - series[2].e];
    rows.push({ kind: 'kimi_check', rule: 'previous presidential transported (2018-2024)', mae: V201.r3(V201.mean(prevPres.map(Math.abs))), rmse: V201.r3(V201.rms(prevPres)), expected_mae: 2.9, expected_rmse: 3.237 });
    return rows;
  },
});

/* ---------- K5: correlation-structure diagnostic (does not change displayed probabilities) ---------- */
dash.calc('v201_correlation_sensitivity', {
  inputs: ['v20_published', 'v20_calibration', 'states', 'seat_math', 'regions_v201'],
  title: 'Regional correlation diagnostic (uncalibrated)',
  description: 'Keeps every state’s total error variance exactly as in v20 and moves a share rho of the state error into a component shared within Census regions. Marginal state chances stay the same; only joint outcomes change. Rho is an assumption that available data cannot estimate.',
  fn: (pub, cal, states, seatMath, regions) => {
    const c = (k) => (cal.find((x) => x.key === k) || {}).value;
    const sys = c('sigma_sys_central'); const st = c('sigma_state'); const nu = c('tail_df');
    const cs = V201.comp(states); const base = seatMath[0];
    const reg = {}; regions.forEach((r) => { reg[r.state] = r.census_region; });
    const center = {}; const se = {}; pub.forEach((p) => { center[p.state] = p.simple; se[p.state] = p.se_mean != null && isFinite(p.se_mean) ? Math.max(p.se_mean, 0.5) : 2.0; });
    const regs = Array.from(new Set(cs.map((s) => reg[s.state])));
    return [0, 0.25, 0.5].map((rho, ri) => {
      const g = V201.gauss(V201.mulberry32(20261150 + ri)); const N = V201.sims;
      let dC = 0, rC = 0, nC = 0; const seats = []; const opp = {}; cs.forEach((s) => { opp[s.state] = 0; });
      for (let i = 0; i < N; i += 1) {
        const eSys = sys * V201.tUnit(g, nu); const eReg = {}; regs.forEach((r) => { eReg[r] = g(); });
        const m = {};
        cs.forEach((s) => { if (center[s.state] == null) return; const x = center[s.state] + eSys + st * (Math.sqrt(rho) * eReg[reg[s.state]] + Math.sqrt(1 - rho) * g()) + se[s.state] * g(); m[s.state] = x; if (x > 0) opp[s.state] += 1; });
        const r = V201.seatsFor(m, cs, base); seats.push(r.dem);
        if (r.control === 'Democrats') dC += 1; else if (r.control === 'Republicans') rC += 1; else nC += 1;
      }
      const s = seats.slice().sort((a, b) => a - b);
      return { rho: rho, label: rho === 0 ? 'v20 structure (national + independent state errors)' : 'Regional share ' + rho + ' (assumed)', p_dem_control: V201.r3(dC / N), p_rep_control: V201.r3(rC / N), p_no_majority: V201.r3(nC / N), dem_seats_p05: V201.quant(s, 0.05), dem_seats_p50: V201.quant(s, 0.5), dem_seats_p95: V201.quant(s, 0.95), state_p_opp: Object.fromEntries(Object.keys(opp).map((k) => [k, V201.r3(opp[k] / N)])), sims: N, status: 'uncalibrated diagnostic; not used for displayed probabilities' };
    });
  },
});

/* ---------- K2 / K11 / E2: recall-stratified sensitivity, gated on documented recall use ---------- */
dash.calc('v201_recall_scenarios', {
  inputs: ['sen_polls_clean', 'pollster_methods', 'recall_scenario_params_v201', 'states', 'seat_math', 'v20_published'],
  title: 'Recall-weighting scenario (hypothetical)',
  description: 'a_p = kappa x q_p x b: polls from pollsters documented to weight on recalled 2024 vote (q = 1) are moved toward the challenger by kappa x b points; polls with no documented recall use (or unknown) are not moved. b values are a modeled claim (1.0) and a recall-margin reconstruction (2.2), neither validated as a horse-race error. Never enters the averages.',
  fn: (polls, pm, params, states, seatMath, pub) => {
    const tag = {}; pm.forEach((t) => { tag[t.pollster] = t.recalled_vote_weighting; });
    const cs = V201.comp(states); const base = seatMath[0];
    const b = {}; params.forEach((p) => { b[p.key] = Number(p.b_points); });
    const variants = [{ key: 'k0', kappa: 0, b: 0, label: 'No adjustment (equals Model 1 simple)' }, { key: 'k05_low', kappa: 0.5, b: b.b_low }, { key: 'k1_low', kappa: 1, b: b.b_low }, { key: 'k05_high', kappa: 0.5, b: b.b_high }, { key: 'k1_high', kappa: 1, b: b.b_high }];
    return variants.map((v) => {
      const shift = v.kappa * v.b;
      const adj = polls.map((p) => Object.assign({}, p, { raw: p.raw + (V201.isYes(tag[p.pollster]) ? shift : 0) }));
      const m = {}; let affected = 0; let windowTotal = 0;
      Array.from(new Set(polls.map((p) => p.state))).forEach((s) => { const w = V201.windowPolls(adj, s); windowTotal += w.length; affected += w.filter((p) => V201.isYes(tag[p.pollster])).length; m[s] = V201.r1(V201.mean(w.map((p) => p.raw))); });
      const seats = V201.seatsFor(m, cs, base);
      const changes = pub.map((p) => (m[p.state] == null || p.simple == null ? 0 : m[p.state] - p.simple));
      return { key: v.key, label: v.label || ('kappa ' + v.kappa + ' x b ' + v.b + ' = ' + shift.toFixed(2) + ' points toward the challenger, recall-weighting polls only'), kappa: v.kappa, b: v.b, shift_points: V201.r3(shift), window_polls_shifted: affected, window_polls_total: windowTotal, mean_state_change: V201.r3(V201.mean(changes)), max_state_change: V201.r3(Math.max.apply(null, changes)), dem_seats: seats.dem, rep_seats: seats.rep, ind_seats: seats.ind, control: seats.control, margins: m, status: v.kappa ? 'hypothetical scenario; not validated' : 'baseline' };
    });
  },
});

/* ---------- K13: Florida official snapshot (context only) ---------- */
dash.calc('v201_fl_official', {
  inputs: ['fl_official_2026-11-02_0809'],
  title: 'Florida official ballots by party registration, Nov 2 08:09 ET (context only)',
  description: 'Administrative counts by registration at one timestamp. Not candidate votes and not the final electorate.',
  fn: (rows) => rows.map((r) => { const t = Number(r.total); const s = (k) => V201.r3((100 * Number(r[k])) / t); return { category: r.category, republican: Number(r.republican), democratic: Number(r.democratic), npa: Number(r.npa), other: Number(r.other), total: t, rep_share: s('republican'), dem_share: s('democratic'), npa_share: s('npa'), other_share: s('other'), timestamp_et: r.timestamp_et, use: r.use }; }),
});

dash.calc('v201_assessment', {
  inputs: ['kimi_assessment_v201'],
  title: 'Kimi recommendations against v20’s actual code',
  description: 'What v20 already does, what v20.1 corrects, and what cannot be validated with available data.',
  fn: (rows) => rows,
});
