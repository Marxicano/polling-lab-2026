// Builds docs/explorer/index.html: a mobile-first explorer over the published v20 outputs (and v20.1 review fields).
// It recomputes nothing statistical: every number comes from the v20/v20.1 run or the frozen v19 snapshot.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { load, ROOT, parseCSV } = require('../v20_1/run_v201.js');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const SHORT = { aapor_2016: '2016', aapor_2018: '2018', aapor_2020: '2020', aapor_2022: '2022', aapor_2024: '2024', silver_2018: '2018 (Silver)', silver_2022: '2022 (Silver)', aapor_senate_2022: 'Senate 2022', aapor_senate_2024: 'Senate 2024', offyear_2025: '2025 off-year', race_nj_2021: 'NJ 2021', generic_2024: 'Generic 2024', none: 'No error' };
const NOTES = {
  AK: 'Ranked-choice ballot. Averages use first-choice or head-to-head numbers as published; final-round shares are stored separately for five polls.',
  NE: 'Independent Dan Osborn vs Republican Pete Ricketts; no Democrat on the ballot. Osborn is counted as an independent seat, never folded into the Democratic total.',
  FL: 'Two RedBox surveys are separate polls: Oct 20-23 (n 4,823, effective 1,520) and Oct 30-31 (n 2,898, effective 2,120). Big Data Poll Oct 26-30 is excluded pending reconciliation of its versions.',
  MS: 'Every Mississippi poll has a partisan sponsor, so the no-partisan-sponsor method has no estimate here.',
  MI: 'Democrat Haley Stevens endorsed Republican Mike Rogers on Nov 1, after the final Siena fieldwork. No poll measures its effect.',
  IA: 'Closest race. GrayHouse (Oct 28-31) weighted to a 2024 vote target of Trump 54, Harris 43, which is 2.2 points less Republican than the 2024 result.',
  TX: 'AtlasIntel’s Oct 28-Nov 1 poll is of adults, not likely voters, and is kept as published.',
};
function build(opts) {
  const o = opts || {};
  const L = o.loaded || load();
  const { out, data } = L;
  const comp = data.states.filter((s) => s.race === 'yes' && s.forecaster_rating === 'Competitive').map((s) => { const opp = String(s.dem_candidate || '').trim() ? 'D' : 'I'; return { state: s.state, name: s.name, inc: s.incumbent_party, opp, challenger: opp === 'I' ? s.ind_candidate + ' (I)' : s.dem_candidate + ' (D)', republican: s.rep_candidate + ' (R)' }; });
  const pick = (arr, s) => arr.find((r) => r.state === s) || {};
  // Probabilities and scenarios are taken from the PUBLISHED v20 / v20.1 outputs, never re-simulated here.
  const pub20 = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'data', 'site_v20.json'), 'utf8'));
  const pub201 = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'v20-1', 'data', 'site_v201.json'), 'utf8'));
  const usable = pub20.seats.variants.filter((v) => v.key !== 'midterm_only');
  const pubRace = Object.fromEntries(pub20.races.map((r) => [r.state, r]));
  // 30-day window membership, exactly as the v19/v20 simple average defines it
  const win = new Set();
  Array.from(new Set(out.sen_polls_clean.map((p) => p.state))).forEach((s) => { const all = out.sen_polls_clean.filter((p) => p.state === s).sort((a, b) => a.age - b.age); let w = all.filter((p) => p.age <= 30); if (w.length < 3) w = all.slice(0, 3); w.forEach((p) => win.add(p.poll_id)); });
  const meta = Object.fromEntries(out.v201_poll_metadata.map((m) => [m.poll_id, m]));
  const models = {};
  comp.forEach((c) => {
    const p = pick(out.v20_published, c.state); const pr = pubRace[c.state] || {};
    models[c.state] = { v19_frozen: pick(out.v20_v19_compare, c.state).v19_frozen, simple: p.simple, per_pollster: p.per_pollster, lv_only: p.lv_only, weighted: p.weighted, house_adj: p.house_adj, no_partisan: pick(out.v20_no_partisan, c.state).margin, trimmed: pick(out.v20_trimmed, c.state).margin, without_recall: pick(out.v20_recall_split, c.state).without_recall_yes,
      p_opp: pr.p_opp, p_lo: pr.p_opp_min, p_hi: pr.p_opp_max, p10: pr.p10, p90: pr.p90, polls: p.polls_window,
      post_freeze: data.senate_polls.filter((r) => r.state === c.state && r.release_cohort === 'v20_post_freeze' && win.has(r.poll_id)).length };
  });
  const polls = data.senate_polls.map((r) => { const m = meta[r.poll_id] || {}; return { id: r.poll_id, s: r.state, pl: r.pollster, sp: r.sponsor || '', fl: r.partisan_flag || '', fs: r.field_start || '', fe: r.field_end || '', dt: r.date || '', n: r.sample_size ? Number(r.sample_size) : null, pop: r.population || '', d: r.dem === '' ? null : Number(r.dem), r: r.rep === '' ? null : Number(r.rep), inc: r.include, why: r.exclusion_reason || '', coh: r.release_cohort === 'v20_post_freeze' ? 'v20' : 'v19', ev: m.evidence_status === 'primary source read' ? 'primary' : m.evidence_status === 'aggregator listing with pollster link' ? 'agg' : 'sec', neff: r.effective_n ? Number(r.effective_n) : null, wave: r.poll_id === 'FL-020' ? 'RedBox wave 1 (Oct 20-23)' : r.poll_id === 'FL-NOV01-REDBOX2' ? 'RedBox wave 2 (Oct 30-31)' : '', url: r.release_url || r.source_page || '', w: win.has(r.poll_id) }; });
  const closest = comp.slice().sort((a, b) => Math.abs(models[a.state].simple) - Math.abs(models[b.state].simple))[0];
  const gb = out.gb_methods.find((r) => r.cycle === '2026' && r.norm === 'raw' && r.method === 'simple');
  const gbSnap = data.v19_snapshot.find((r) => r.kind === 'generic_ballot' && r.norm === 'raw' && r.method === 'simple');
  const v19polls = parseCSV(fs.readFileSync(path.join(ROOT, 'v19_frozen', 'data', 'senate_polls.csv'), 'utf8'));
  const inc = data.senate_polls.filter((r) => r.include === 'yes');
  const D = {
    meta: { as_of: L.asOf, built: (o.builtAt || new Date().toISOString()).replace('T', ' ').slice(0, 16), included: inc.length, post_freeze: inc.filter((r) => r.release_cohort === 'v20_post_freeze').length, v19_included: v19polls.filter((r) => r.include === 'yes').length, newest: inc.map((r) => r.field_end || r.date).sort().slice(-1)[0],
      v19_hash: sha('v19_frozen/data/snapshot_2026-11-02.csv'), v20_engine: sha('v20/engine_v20.js'), prereg_hash: sha('v20/preregistration_mike.json'), polls_hash: sha('v20/data/senate_polls.csv') },
    base: { base_d: out.seat_math[0].base_d, base_r: out.seat_math[0].base_r },
    comp, models, polls, notes: NOTES,
    model_list: [
      { key: 'simple', label: 'v20 average (Model 1)', desc: 'Mean of included polls with fieldwork ending in the last 30 days (the three most recent if fewer), raw challenger-minus-Republican margins. The same code as the frozen snapshot, run on the expanded v20 poll list.', swing: true },
      { key: 'v19_frozen', label: 'Frozen v19 snapshot', desc: 'The official pre-election value, read from the published snapshot file; never recomputed.', swing: true },
      { key: 'per_pollster', label: 'One poll per pollster', desc: 'Latest poll from each pollster, so frequent releases do not dominate.', swing: true },
      { key: 'lv_only', label: 'Likely-voter polls only', desc: 'Drops registered-voter and adult samples.', swing: true },
      { key: 'weighted', label: 'Recency and size weighted', desc: 'Weights halve every 14 days and grow with the square root of sample size (raw n when no effective n is published).', swing: true },
      { key: 'house_adj', label: 'House-effect adjusted', desc: 'Removes each pollster’s average lean relative to other pollsters in the same states (shrunk toward zero). Relative to the field, not to the truth.', swing: true },
      { key: 'no_partisan', label: 'No partisan sponsors', note: 'Sensitivity only', desc: 'Drops polls with a partisan or campaign sponsor on either side.', swing: true },
      { key: 'trimmed', label: 'Symmetric trim', note: 'Sensitivity only', desc: 'Drops the three most Republican-leaning and three most Democratic-leaning pollsters.', swing: true },
      { key: 'without_recall', label: 'Without recalled-vote weighting', note: 'Sensitivity only', desc: 'Drops pollsters documented to weight on recalled 2024 vote; pollsters with unknown methods stay in.', swing: true },
    ],
    scenarios: pub20.scenarios.map((s) => ({ key: s.key, short: SHORT[s.key] || s.key, label: s.label, signed_error: s.signed_error, applied_shift: s.applied_shift, dem_seats: s.dem_seats, rep_seats: s.rep_seats, ind_seats: s.ind_seats, flips: s.flips || '' })),
    mc: { central: usable.find((v) => v.key === 'central').p_dem_control, lo: Math.min.apply(null, usable.map((v) => v.p_dem_control)), hi: Math.max.apply(null, usable.map((v) => v.p_dem_control)), validation: (pub20.validation.find((r) => r.key === 'summary') || {}).caveat },
    corr: pub201.correlation.map((r) => ({ label: r.rho === 0 ? 'v20 structure' : 'regional share ' + r.rho, p: r.p_dem_control })),
    mike: out.v20_mike_panel.filter((r) => ['lv all', 'lv october', 'lv october excl marist', 'ledger tags', 'ledger tagsgb', 'target grayhouse_ia', 'split'].indexOf(r.key) >= 0).map((r) => ({ key: r.key, value: r.value, evidence: r.evidence })),
    generic: { v20: gb ? gb.margin : null, v19: gbSnap ? Number(gbSnap.margin) : null },
    closest: { name: closest.name, margin: models[closest.state].simple, opp: closest.opp, p_opp: models[closest.state].p_opp },
    links: { repo: 'https://github.com/Marxicano/polling-lab-2026', list: [
      { label: 'v20 dashboard', url: '../' }, { label: 'v20.1 methodology review', url: '../v20-1/' }, { label: 'ChatGPT’s app', url: '../app/' },
      { label: 'Frozen snapshot (GitHub)', url: 'https://github.com/Marxicano/polling-lab-2026/blob/main/data/snapshot_2026-11-02.csv' }, { label: 'Freeze record', url: 'https://github.com/Marxicano/polling-lab-2026/blob/main/SNAPSHOT_RECORD.md' }, { label: 'Repository', url: 'https://github.com/Marxicano/polling-lab-2026' } ] },
  };
  const tpl = fs.readFileSync(path.join(__dirname, 'explorer_template.html'), 'utf8');
  const html = tpl.replace('__DATA__', JSON.stringify(D).replace(/</g, '\\u003c'));
  const dir = o.docsDir || path.join(ROOT, 'docs', 'explorer');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { D, html };
}
module.exports = { build };
if (require.main === module) { const { D, html } = build(); console.log('built docs/explorer/index.html: ' + D.comp.length + ' races, ' + D.polls.length + ' poll rows, ' + Math.round(html.length / 1024) + ' KB'); }
