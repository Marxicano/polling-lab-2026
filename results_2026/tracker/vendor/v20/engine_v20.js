/* Polling Lab v20 model layer — post-freeze, election-eve analysis. Every calc id starts with v20_.
   Inputs are the v20 data files and the outputs of the FROZEN v19 engine run on the v20 data.
   Nothing here adds a partisan correction to any average: every shift is either zero-mean
   uncertainty or a labeled historical scenario taken from data/calibration_errors.csv. */
const V20 = (() => {
  const asOf = process.env.POLLING_LAB_AS_OF || '2026-11-02';
  const sims = Number(process.env.V20_SIMS || 20000);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    let spare = null;
    return function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0; while (u === 0) u = rand();
      const v = rand(); const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
  }
  // Student-t draw rescaled to unit variance (nu > 2); nu = Infinity gives a normal draw.
  function tUnit(g, nu) {
    if (!isFinite(nu)) return g();
    let c = 0; for (let k = 0; k < nu; k += 1) { const z = g(); c += z * z; }
    return (g() / Math.sqrt(c / nu)) / Math.sqrt(nu / (nu - 2));
  }
  const r1 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 10) / 10);
  const r3 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 1000) / 1000);
  const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const median = (a) => { const v = a.slice().sort((x, y) => x - y); const n = v.length; return n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : null; };
  const quant = (sorted, q) => { const i = (sorted.length - 1) * q; const lo = Math.floor(i); const hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); };
  const lab = (x, opp) => (x == null ? '' : (x > 0 ? (opp || 'D') + '+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1));
  function windowPolls(polls, state) {
    const all = polls.filter((p) => p.state === state).sort((a, b) => a.age - b.age);
    let w = all.filter((p) => p.age <= 30);
    if (w.length < 3) w = all.slice(0, 3);
    return w;
  }
  const comp = (states) => states.filter((s) => s.race === 'yes' && s.forecaster_rating === 'Competitive');
  const oppOf = (c) => (String(c.dem_candidate || '').trim() ? 'D' : 'I');
  function seatsFor(margins, compStates, base, shift) {
    let d = 0, r = 0, i = 0; const flips = [];
    compStates.forEach((c) => {
      const v = margins[c.state];
      let win = c.incumbent_party;
      if (v != null && Math.abs(v + shift) >= 0.05) win = v + shift > 0 ? oppOf(c) : 'R';
      if (win === 'D') d += 1; else if (win === 'I') i += 1; else r += 1;
      if (win !== c.incumbent_party) flips.push(c.state);
    });
    const dem = base.base_d + d; const rep = base.base_r + r;
    return { dem, rep, ind: i, control: dem >= 51 ? 'Democrats' : rep >= 50 ? 'Republicans' : 'No majority without the independent', flips: flips.join(', ') };
  }
  const isYes = (v) => /^yes\b/.test(String(v || ''));
  const isNo = (v) => /^no\b/.test(String(v || ''));
  return { asOf, sims, mulberry32, gauss, tUnit, r1, r3, rms, mean, median, quant, lab, windowPolls, comp, oppOf, seatsFor, isYes, isNo };
})();

/* ---------- Model 1: published poll averages (v19 methods, unchanged, on v20 data) ---------- */
dash.calc('v20_published', {
  inputs: ['sen_methods', 'sen_state_table', 'sen_polls_clean'],
  title: 'Model 1 — published poll averages',
  description: 'The five v19 averaging methods, unchanged, applied to the v20 data (v19 inputs plus verified post-freeze releases), raw margins, as of the v20 date.',
  fn: (m, table, polls) => Array.from(new Set(m.map((x) => x.state))).sort().map((s) => {
    const g = (k) => { const r = m.find((x) => x.state === s && x.norm === 'raw' && x.method === k); return r ? r.margin : null; };
    const t = table.find((x) => x.state === s && x.norm === 'raw') || {};
    const opp = (polls.find((p) => p.state === s) || {}).opp_party || 'D';
    const simpleRow = m.find((x) => x.state === s && x.norm === 'raw' && x.method === 'simple') || {};
    return { state: s, opp_party: opp, simple: g('simple'), per_pollster: g('per_pollster'), lv_only: g('lv_only'), weighted: g('weighted'), house_adj: g('house_adj'),
      polls_window: simpleRow.polls, se_mean: t.se_mean == null ? null : t.se_mean, poll_sd: t.poll_sd == null ? null : t.poll_sd, mean_poll_moe: t.mean_poll_moe == null ? null : t.mean_poll_moe, simple_label: V20.lab(g('simple'), opp) };
  }),
});

/* ---------- Model 2: no-partisan-sponsor averages ---------- */
dash.calc('v20_no_partisan', {
  inputs: ['sen_polls_clean'],
  title: 'Model 2 — averages without partisan-sponsored polls',
  description: 'Same 30-day simple average, excluding every poll with a partisan or campaign sponsor flag (either side). An empty flag does not prove a sponsor is nonpartisan.',
  fn: (polls) => Array.from(new Set(polls.map((p) => p.state))).sort().map((s) => {
    const kept = polls.filter((p) => !p.partisan_flag);
    const w = V20.windowPolls(kept, s);
    const all = V20.windowPolls(polls, s);
    return { state: s, margin: V20.r1(V20.mean(w.map((p) => p.raw))), polls: w.length, dropped_in_window: all.filter((p) => p.partisan_flag).length };
  }),
});

/* ---------- Model 3: pollster house-effect comparisons ---------- */
dash.calc('v20_trimmed', {
  inputs: ['sen_polls_clean', 'sen_house'],
  title: 'Model 3a — symmetric house-effect trim',
  description: 'Simple average after removing the three pollsters with the most Republican and the three with the most Democratic house effects (raw margins, pollsters with 2+ comparable polls). Symmetric by construction.',
  fn: (polls, house) => {
    const h = house.filter((x) => x.norm === 'raw').slice().sort((a, b) => a.lean - b.lean);
    const drop = new Set(h.slice(0, 3).map((x) => x.pollster).concat(h.slice(-3).map((x) => x.pollster)));
    const kept = polls.filter((p) => !drop.has(p.pollster));
    return Array.from(new Set(polls.map((p) => p.state))).sort().map((s) => {
      const w = V20.windowPolls(kept, s);
      return { state: s, margin: V20.r1(V20.mean(w.map((p) => p.raw))), polls: w.length, dropped_pollsters: Array.from(drop).join('; ') };
    });
  },
});

dash.calc('v20_house_table', {
  inputs: ['sen_house', 'pollster_methods'],
  title: 'Model 3b — pollster house effects with methodology tags',
  description: 'Each pollster’s lean relative to other pollsters in the same states (raw margins, shrunk toward zero), joined to recalled-vote and party-weighting tags. Relative to the field, not to the truth.',
  fn: (house, pm) => {
    const tag = {}; pm.forEach((t) => { tag[t.pollster] = t; });
    return house.filter((x) => x.norm === 'raw').map((x) => {
      const t = tag[x.pollster] || {};
      return { pollster: x.pollster, polls: x.polls, states: x.states, lean: x.lean, lean_label: V20.lab(x.lean), recall: V20.isYes(t.recalled_vote_weighting) ? 'yes' : V20.isNo(t.recalled_vote_weighting) ? 'no' : 'unknown', party: V20.isYes(t.party_weighting) ? 'yes' : V20.isNo(t.party_weighting) ? 'no' : 'unknown' };
    }).sort((a, b) => a.lean - b.lean);
  },
});

dash.calc('v20_recall_split', {
  inputs: ['sen_polls_clean', 'pollster_methods'],
  title: 'Model 3c — averages with and without recalled-vote-weighting pollsters',
  description: 'Simple averages using only pollsters verified NOT to weight on recalled 2024 vote, and only those verified to. Unknown-method pollsters are in neither. A sensitivity check, not a correction.',
  fn: (polls, pm) => {
    const tag = {}; pm.forEach((t) => { tag[t.pollster] = t.recalled_vote_weighting; });
    const withTag = (f) => polls.filter((p) => f(tag[p.pollster]));
    return Array.from(new Set(polls.map((p) => p.state))).sort().map((s) => {
      const all = V20.windowPolls(polls, s);
      const no = V20.windowPolls(withTag(V20.isNo), s);
      const yes = V20.windowPolls(withTag(V20.isYes), s);
      const exclYes = V20.windowPolls(polls.filter((p) => !V20.isYes(tag[p.pollster])), s);
      return { state: s, all: V20.r1(V20.mean(all.map((p) => p.raw))), without_recall_yes: V20.r1(V20.mean(exclYes.map((p) => p.raw))), only_recall_no: V20.r1(V20.mean(no.map((p) => p.raw))), only_recall_yes: V20.r1(V20.mean(yes.map((p) => p.raw))), n_no: no.length, n_yes: yes.length };
    });
  },
});

/* ---------- Frozen v19 vs v20 ---------- */
dash.calc('v20_v19_compare', {
  inputs: ['v19_snapshot', 'v20_published'],
  title: 'Frozen v19 (Nov 2, 08:08 ET) vs v20 post-freeze',
  description: 'The frozen raw simple average from the published v19 snapshot next to the v20 raw simple average. The v19 values are read from the frozen file and never recomputed.',
  fn: (snap, pub) => pub.map((p) => {
    const f = snap.find((r) => r.kind === 'senate_state' && r.norm === 'raw' && r.method === 'simple' && r.state === p.state);
    const v19 = f && f.margin !== '' ? Number(f.margin) : null;
    return { state: p.state, v19_frozen: v19, v19_polls: f ? Number(f.polls) : null, v20: p.simple, v20_polls: p.polls_window, change: v19 == null || p.simple == null ? null : V20.r1(p.simple - v19) };
  }),
});

/* ---------- Calibration of the uncertainty model from documented history ---------- */
dash.calc('v20_calibration', {
  inputs: ['calibration_errors', 'sen_polls_clean'],
  title: 'Uncertainty calibration from documented polling history',
  description: 'sigma_sys = root-mean-square of cycle-level signed polling errors (zero mean: no direction assumed). sigma_state = race-specific error left after removing the cycle mean and the sampling error of a typical 2026 poll from AAPOR Senate poll errors. Every input row is in data/calibration_errors.csv.',
  fn: (cal, polls) => {
    const role = (k) => cal.filter((r) => String(r.roles).split(';').indexOf(k) >= 0);
    const val = (r) => Number(r.signed_error);
    const central = role('sys_central').map(val);
    const midterm = role('sys_midterm').map(val);
    const high = central.concat(role('sys_high').map(val));
    const recent = polls.filter((p) => p.date >= '2026-09-01' && isFinite(p.sampling_sd));
    const sampSd = V20.median(recent.map((p) => p.sampling_sd));
    const resid = role('sigma_state').map((r) => {
      const rmse = Number(r.mae) * Math.sqrt(Math.PI / 2);
      return { cycle: r.cycle, rmse: rmse, resid_var: rmse * rmse - val(r) * val(r) - sampSd * sampSd };
    });
    const sigmaState = Math.sqrt(V20.mean(resid.map((x) => Math.max(0, x.resid_var))));
    const out = [
      { key: 'sigma_sys_central', value: V20.r3(V20.rms(central)), n: central.length, derivation: 'RMS of AAPOR all-office signed errors 2016-2024 (zero mean)', inputs: central.join(', ') },
      { key: 'sigma_sys_midterm', value: V20.r3(V20.rms(midterm)), n: midterm.length, derivation: 'RMS of midterm-only errors (AAPOR 2018, 2022, Senate 2022); few cycles, likely overconfident', inputs: midterm.join(', ') },
      { key: 'sigma_sys_high', value: V20.r3(V20.rms(high)), n: high.length, derivation: 'Central set plus the 2025 off-year mean miss (-7.35)', inputs: high.join(', ') },
      { key: 'sigma_state', value: V20.r3(sigmaState), n: resid.length, derivation: 'sqrt(mean over AAPOR Senate cycles of max(0, RMSE^2 - mean^2 - sampling^2)), RMSE = MAE x sqrt(pi/2)', inputs: resid.map((x) => x.cycle + ': RMSE ' + x.rmse.toFixed(2) + ', residual variance ' + x.resid_var.toFixed(2)).join('; ') },
      { key: 'typical_poll_sampling_sd', value: V20.r3(sampSd), n: recent.length, derivation: 'Median per-poll sampling SD of the candidate gap, polls since Sep 1, 2026', inputs: '' },
      { key: 'tail_df', value: 4, n: null, derivation: 'Student-t degrees of freedom for the shared error (heavy tails; fixed by assumption)', inputs: '' },
    ];
    return out;
  },
});

/* ---------- Correlated-error Monte Carlo (experimental probabilities) ---------- */
dash.calc('v20_mc', {
  inputs: ['v20_published', 'v20_calibration', 'states', 'seat_math'],
  title: 'Correlated polling-error simulation',
  description: 'For each simulation: one shared error for all states (Student-t, mean 0, SD sigma_sys), plus an independent state error (normal, SD sigma_state) and the sampling noise of each state average (normal, SD = standard error of its window polls). Centered on Model 1 simple averages with no directional correction. Reproducible seed. Probabilities are experimental (see v20_validation).',
  fn: (pub, cal, states, seatMath) => {
    const c = (k) => (cal.find((x) => x.key === k) || {}).value;
    const base = seatMath[0];
    const cs = V20.comp(states);
    const centers = {}; const se = {};
    pub.forEach((p) => { centers[p.state] = p.simple; se[p.state] = p.se_mean != null && isFinite(p.se_mean) ? Math.max(p.se_mean, 0.5) : 2.0; });
    const variants = [
      { key: 'central', label: 'Central: all general-election cycles 2016-2024, heavy tails', sys: c('sigma_sys_central'), nu: c('tail_df') },
      { key: 'high', label: 'High: adds the 2025 off-year miss', sys: c('sigma_sys_high'), nu: c('tail_df') },
      { key: 'midterm_only', label: 'Midterm-only history (likely overconfident)', sys: c('sigma_sys_midterm'), nu: c('tail_df') },
      { key: 'central_normal', label: 'Central, normal tails', sys: c('sigma_sys_central'), nu: Infinity },
    ];
    const sState = c('sigma_state');
    return variants.map((v, vi) => {
      const g = V20.gauss(V20.mulberry32(20261102 + vi));
      const N = V20.sims; let dCtl = 0, rCtl = 0, none = 0;
      const demSeats = []; const oppWins = {}; const samples = {};
      cs.forEach((s) => { oppWins[s.state] = 0; samples[s.state] = []; });
      for (let i = 0; i < N; i += 1) {
        const eSys = v.sys * V20.tUnit(g, v.nu);
        const m = {};
        cs.forEach((s) => {
          if (centers[s.state] == null) return;
          const x = centers[s.state] + eSys + sState * g() + se[s.state] * g();
          m[s.state] = x; if (vi === 0) samples[s.state].push(x);
          if (x > 0) oppWins[s.state] += 1;
        });
        const r = V20.seatsFor(m, cs, base, 0);
        demSeats.push(r.dem);
        if (r.control === 'Democrats') dCtl += 1; else if (r.control === 'Republicans') rCtl += 1; else none += 1;
      }
      const sorted = demSeats.slice().sort((a, b) => a - b);
      const hist = {}; demSeats.forEach((d) => { hist[d] = (hist[d] || 0) + 1; });
      const res = { key: v.key, label: v.label, sigma_sys: v.sys, sigma_state: sState, tail_df: isFinite(v.nu) ? v.nu : 'normal', sims: N,
        p_dem_control: V20.r3(dCtl / N), p_rep_control: V20.r3(rCtl / N), p_no_majority: V20.r3(none / N),
        dem_seats_p05: V20.quant(sorted, 0.05), dem_seats_p25: V20.quant(sorted, 0.25), dem_seats_p50: V20.quant(sorted, 0.5), dem_seats_p75: V20.quant(sorted, 0.75), dem_seats_p95: V20.quant(sorted, 0.95), dem_seats_mean: V20.r1(V20.mean(demSeats)),
        seat_hist: hist,
        states: cs.filter((s) => centers[s.state] != null).map((s) => ({ state: s.state, center: centers[s.state], p_opp: V20.r3(oppWins[s.state] / N), opp_party: V20.oppOf(s) })) };
      if (vi === 0) {
        res.states.forEach((s) => { const a = samples[s.state].slice().sort((x, y) => x - y); s.p10 = V20.r1(V20.quant(a, 0.1)); s.p90 = V20.r1(V20.quant(a, 0.9)); });
        const ks = Object.keys(samples).filter((k) => samples[k].length);
        const A = samples[ks[0]], B = samples[ks[1]];
        const ma = V20.mean(A), mb = V20.mean(B);
        let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < A.length; i += 1) { sab += (A[i] - ma) * (B[i] - mb); saa += (A[i] - ma) ** 2; sbb += (B[i] - mb) ** 2; }
        const theo = (v.sys * v.sys) / Math.sqrt((v.sys * v.sys + sState * sState + se[ks[0]] ** 2) * (v.sys * v.sys + sState * sState + se[ks[1]] ** 2));
        res.corr_check = { pair: ks[0] + '-' + ks[1], empirical: V20.r3(sab / Math.sqrt(saa * sbb)), theoretical: V20.r3(theo) };
        res.mean_shift_check = V20.r3(V20.mean(A) - centers[ks[0]]);
      }
      return res;
    });
  },
});

/* ---------- Backtest / validation of the uncertainty model ---------- */
dash.calc('v20_validation', {
  inputs: ['calibration_errors', 'v20_calibration', 'v20_published'],
  title: 'Validation: do the uncertainty settings cover documented historical misses?',
  description: '(a) Coverage: the 80% and 95% total-error intervals implied by the central settings, applied to each documented race-level and national miss. (b) Leave-one-cycle-out: sigma_sys re-estimated without each AAPOR cycle, then checked against that cycle. Small, partly selected samples; results decide whether probabilities are labeled experimental.',
  fn: (cal, calib, pub) => {
    const c = (k) => (calib.find((x) => x.key === k) || {}).value;
    const sys = c('sigma_sys_central'); const st = c('sigma_state'); const nu = c('tail_df');
    const seTyp = V20.median(pub.map((p) => p.se_mean).filter((x) => x != null && isFinite(x)));
    const g = V20.gauss(V20.mulberry32(777));
    const draws = []; for (let i = 0; i < 200000; i += 1) draws.push(sys * V20.tUnit(g, nu) + st * g() + seTyp * g());
    draws.sort((a, b) => a - b);
    const q = { p025: V20.quant(draws, 0.025), p10: V20.quant(draws, 0.1), p90: V20.quant(draws, 0.9), p975: V20.quant(draws, 0.975) };
    const rows = cal.filter((r) => String(r.roles).split(';').indexOf('validation') >= 0).map((r) => {
      const e = Number(r.signed_error);
      return { key: r.key, kind: 'coverage', label: r.source + ' (' + r.cycle + ')', error: e, inside80: e >= q.p10 && e <= q.p90, inside95: e >= q.p025 && e <= q.p975, caveat: r.caveat };
    });
    const sysRows = cal.filter((r) => String(r.roles).split(';').indexOf('sys_central') >= 0);
    const t90 = 1.533 / Math.sqrt(2), t975 = 2.776 / Math.sqrt(2); // unit-variance t4 quantiles
    sysRows.forEach((r) => {
      const others = sysRows.filter((x) => x.key !== r.key).map((x) => Number(x.signed_error));
      const s = V20.rms(others); const e = Number(r.signed_error);
      rows.push({ key: 'loo_' + r.key, kind: 'leave_one_cycle_out', label: 'Hold out ' + r.cycle + ' (sigma_sys from the others = ' + s.toFixed(2) + ')', error: e, inside80: Math.abs(e) <= s * t90, inside95: Math.abs(e) <= s * t975, caveat: '' });
    });
    const cov = rows.filter((r) => r.kind === 'coverage');
    const c80 = cov.filter((r) => r.inside80).length / cov.length; const c95 = cov.filter((r) => r.inside95).length / cov.length;
    const loo = rows.filter((r) => r.kind === 'leave_one_cycle_out');
    const l80 = loo.filter((r) => r.inside80).length / loo.length; const l95 = loo.filter((r) => r.inside95).length / loo.length;
    const adequate = c80 >= 0.7 && c95 >= 0.9 && l80 >= 0.7 && l95 >= 0.9 && cov.length >= 20;
    rows.push({ key: 'summary', kind: 'summary', label: 'Coverage ' + Math.round(c80 * 100) + '% (80% nominal) and ' + Math.round(c95 * 100) + '% (95% nominal) on ' + cov.length + ' documented misses; leave-one-out ' + Math.round(l80 * 100) + '% / ' + Math.round(l95 * 100) + '% on ' + loo.length + ' cycles',
      error: null, inside80: null, inside95: null, caveat: adequate ? 'Calibration adequate on available history' : 'NOT adequately calibrated or validated: probabilities are EXPERIMENTAL; use the scenario ranges', interval80: [V20.r1(q.p10), V20.r1(q.p90)], interval95: [V20.r1(q.p025), V20.r1(q.p975)], experimental: !adequate });
    return rows;
  },
});

/* ---------- Model 4: historically calibrated polling-error scenarios ---------- */
dash.calc('v20_error_scenarios', {
  inputs: ['calibration_errors', 'v20_published', 'states', 'seat_math'],
  title: 'Model 4 — what if 2026 polls miss the way past polls did?',
  description: 'Each documented historical miss applied uniformly to every competitive race: result = poll average minus that signed error. Both directions appear because both happened. Scenarios, not forecasts.',
  fn: (cal, pub, states, seatMath) => {
    const cs = V20.comp(states); const base = seatMath[0];
    const m = {}; pub.forEach((p) => { m[p.state] = p.simple; });
    const rows = [{ key: 'none', label: 'Polls exactly right', signed_error: 0 }].concat(cal.filter((r) => String(r.roles).split(';').indexOf('scenario') >= 0).map((r) => ({ key: r.key, label: r.source + ' — ' + r.cycle + ' ' + r.cycle_type, signed_error: Number(r.signed_error) })));
    return rows.map((r) => { const s = V20.seatsFor(m, cs, base, -r.signed_error); return Object.assign({}, r, { applied_shift: -r.signed_error, dem_seats: s.dem, rep_seats: s.rep, ind_seats: s.ind, control: s.control, flips: s.flips }); })
      .sort((a, b) => a.signed_error - b.signed_error);
  },
});

/* ---------- Model 5: turnout-model sensitivity ---------- */
dash.calc('v20_turnout', {
  inputs: ['sen_turnout_scenarios', 'sen_lv_rv_summary', 'gb_lv_rv_summary', 'v20_published'],
  title: 'Model 5 — turnout-model sensitivity',
  description: 'Registered- vs likely-voter versions of the same surveys, likely-voter-only averages, and the labeled turnout scenarios. Sensitivity only; none of these feed Model 1.',
  fn: (scen, sum, gsum, pub) => {
    const rows = pub.map((p) => ({ key: 'lvonly ' + p.state, state: p.state, scenario: 'Likely-voter polls only (Model 1 variant)', value: p.lv_only, delta_vs_main: p.lv_only == null || p.simple == null ? null : V20.r1(p.lv_only - p.simple), n: null, basis: '30-day window' }));
    scen.forEach((s) => rows.push({ key: s.key, state: s.state, scenario: s.scenario, value: s.value, delta_vs_main: s.delta_vs_main, n: s.n, basis: s.basis }));
    sum.filter((s) => ['all', 'october', 'excl marist'].indexOf(s.key) >= 0).forEach((s) => rows.push({ key: 'screen ' + s.key, state: 'All', scenario: 'Screen shift, ' + s.group + ' (RV minus LV; positive = LV more Republican)', value: s.mean_shift, delta_vs_main: null, n: s.pairs, basis: 'same-survey pairs' }));
    (gsum || []).forEach((s, i) => rows.push({ key: 'gb screen ' + i, state: 'US', scenario: 'National generic-ballot screen shift (' + (s.label || s.key || 'matched releases') + ')', value: s.mean_r_shift != null ? s.mean_r_shift : s.mean_shift, delta_vs_main: null, n: s.pairs != null ? s.pairs : s.n, basis: 'same-release pairs' }));
    return rows;
  },
});

/* ---------- Methodology panel for the turnout/recalled-vote hypothesis ---------- */
dash.calc('v20_mike_panel', {
  inputs: ['sen_lv_rv_summary', 'hypothesis_ledger', 'recall_targets', 'v20_recall_split', 'v20_preregistration'],
  title: 'Testing the hypothesis that some likely-voter and recalled-vote methods are too Republican',
  description: 'What the pre-election data can show (descriptive, relative to other polls) and what only results can test (pre-registered). Nothing here adjusts any average.',
  fn: (lv, ledger, targets, split, prereg) => {
    const rows = [];
    lv.filter((s) => ['all', 'october', 'excl marist', 'october excl marist'].indexOf(s.key) >= 0).forEach((s) => rows.push({ key: 'lv ' + s.key, section: 'Descriptive', evidence: 'Likely- vs registered-voter results of the same surveys: ' + s.group, value: s.mean_label, n: s.pairs, reading: 'Measures what the screen does, not whether it is right' }));
    ledger.filter((r) => ['tags', 'tagsgb', 'politicalw', 'tags25'].indexOf(r.key) >= 0).forEach((r) => rows.push({ key: 'ledger ' + r.key, section: 'Descriptive', evidence: r.evidence, value: r.error == null ? '' : (r.error > 0 ? '+' : '') + r.error, n: r.n, reading: r.direction + '. ' + r.limits }));
    targets.forEach((t) => {
      const tm = t.target_r && t.target_d ? Number(t.target_r) - Number(t.target_d) : null;
      const am = t.actual_r && t.actual_d ? Number(t.actual_r) - Number(t.actual_d) : null;
      rows.push({ key: 'target ' + t.key, section: 'Descriptive', evidence: t.pollster + ' ' + t.state + ' recalled-vote target (' + t.survey + ')', value: tm == null ? 'see note' : 'target R+' + tm.toFixed(1) + ' vs 2024 result R+' + am.toFixed(1), n: 1, reading: t.note });
    });
    const d = split.filter((s) => s.all != null && s.without_recall_yes != null).map((s) => s.without_recall_yes - s.all);
    rows.push({ key: 'split', section: 'Descriptive', evidence: 'Average change across states when verified recalled-vote-weighting pollsters are set aside', value: d.length ? (V20.mean(d) > 0 ? '+' : '') + V20.mean(d).toFixed(2) + ' (toward D if positive)' : 'n/a', n: d.length, reading: 'Sensitivity only; method tags are pollster-level and many pollsters are untagged' });
    (prereg[0].tests || []).forEach((t) => rows.push({ key: 'prereg ' + t.id, section: 'Pre-registered (scored after certification)', evidence: t.question, value: 'awaiting results', n: null, reading: 'Supports if: ' + t.supports_hypothesis_if + '. Contradicts if: ' + t.contradicts_hypothesis_if + '.' }));
    return rows;
  },
});

/* ---------- Context and freshness ---------- */
dash.calc('v20_context', {
  inputs: ['context_variables'],
  title: 'Context variables (not applied to any margin)',
  description: 'Approval and turnout information with sources and dates, shown for context only.',
  fn: (ctx) => ctx.map((r) => ({ key: r.key, variable: r.variable, value: r.value, as_of: r.as_of, source: r.source, source_url: r.source_url, use: r.use })),
});

dash.calc('v20_freshness', {
  inputs: ['senate_polls'],
  title: 'Data freshness by state',
  description: 'Newest included poll per state by fieldwork end (or release date when fieldwork is unknown), and how many polls were added after the v19 freeze.',
  fn: (sp) => Array.from(new Set(sp.map((r) => r.state))).sort().map((s) => {
    const inc = sp.filter((r) => r.state === s && r.include === 'yes');
    const key = (r) => r.field_end || r.date;
    const newest = inc.slice().sort((a, b) => key(b).localeCompare(key(a)))[0] || {};
    return { state: s, newest_date: key(newest), newest_pollster: newest.pollster || '', included: inc.length, post_freeze_added: inc.filter((r) => r.release_cohort === 'v20_post_freeze').length };
  }),
});

dash.calc('v20_late_register', {
  inputs: ['senate_polls', 'generic_polls'],
  title: 'Post-freeze releases added in v20',
  description: 'Every poll added after the v19 freeze, with what Claude verified directly and what rests on secondary sources.',
  fn: (sp, gp) => sp.filter((r) => r.release_cohort === 'v20_post_freeze').map((r) => ({ id: r.poll_id, race: r.state + ' Senate', pollster: r.pollster, field: (r.field_start ? r.field_start + ' to ' : '') + (r.field_end || 'release ' + r.date), sample: r.sample_size + ' ' + r.population, result: 'D/I ' + r.dem + ' - R ' + r.rep, verification: r.verification, source_url: r.release_url }))
    .concat(gp.filter((g) => /^GB26V20/.test(g.poll_id)).map((g) => ({ id: g.poll_id, race: 'National generic ballot', pollster: g.pollster, field: g.field_start + ' to ' + g.field_end, sample: g.sample_size + ' ' + g.population, result: 'D ' + g.dem + ' - R ' + g.rep, verification: g.verification, source_url: g.release_url }))),
});
