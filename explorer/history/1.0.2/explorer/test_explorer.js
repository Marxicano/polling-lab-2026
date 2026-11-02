// Explorer tests: built from published numbers only, seat math matches v20, Osborn separate, labels honest, renders without errors.
process.env.V20_SIMS = process.env.V20_SIMS || '4000';
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
let n = 0; const ok = (m) => { n += 1; console.log('  ok  ' + m); };
['SHA256SUMS_V20.txt', 'SHA256SUMS_V20_1.txt'].forEach((list) => fs.readFileSync(path.join(ROOT, list), 'utf8').trim().split('\n').forEach((l) => { const [h, f] = l.split(/\s+/); assert.strictEqual(sha(f.replace(/^\.\//, '')), h, list + ': ' + f); }));
assert.strictEqual(sha('v19_frozen/data/snapshot_2026-11-02.csv'), '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461');
ok('frozen v19, published v20 and v20.1 files are unchanged');

const { load } = require('../v20_1/run_v201.js'); const L = load(); const { out, data } = L;
const { build } = require('./build_explorer.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-'));
const { D, html } = build({ loaded: L, docsDir: tmp, builtAt: '2026-11-02T23:00:00Z' });
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const json = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/)[1];
assert.deepStrictEqual(JSON.parse(json), JSON.parse(JSON.stringify(D)));

// logic harness (no DOM): exposes PL.seats
const logicWin = {}; new Function('window', 'document', script)(logicWin, { getElementById: () => ({ textContent: json }) });
const PL = logicWin.PL;
const base = PL.seats(PL.marginsFor('simple'), 0);
assert.deepStrictEqual([base.dem, base.rep, base.ind], [53, 47, 0]);
// 1.0.2: official v20 totals are read from the published scenarios and shown unchanged; the stable
// (whole-hundredth) recomputation equals them everywhere except the one documented floating-point edge.
out.v20_error_scenarios.forEach((s) => {
  const off = PL.officialAt('simple', s.applied_shift);
  assert(off && off.key === s.key, 'official overlay found for ' + s.key);
  assert.deepStrictEqual([off.dem_seats, off.rep_seats, off.ind_seats], [s.dem_seats, s.rep_seats, s.ind_seats], 'official total preserved: ' + s.key);
  const r = PL.seats(PL.marginsFor('simple'), s.applied_shift);
  if (s.key === 'offyear_2025') assert.deepStrictEqual([r.dem, r.rep, r.ind], [57, 42, 1], 'exact arithmetic on the rounded Mississippi average');
  else assert.deepStrictEqual([r.dem, r.rep, r.ind], [s.dem_seats, s.rep_seats, s.ind_seats], 'stable recomputation matches official: ' + s.key);
});
const off = out.v20_error_scenarios.find((s) => s.key === 'offyear_2025'); const ro = PL.officialAt('simple', off.applied_shift);
assert(ro.ind_seats === 1 && ro.dem_seats === 56, 'Osborn counted as an independent, not a Democrat');
ok('official v20 scenario totals preserved (D/R/I, Osborn separate); stable recomputation matches all but the documented Mississippi edge');

out.v20_published.forEach((p) => { const m = D.models[p.state]; if (!m) return; assert.strictEqual(m.simple, p.simple); assert.strictEqual(m.lv_only, p.lv_only); assert.strictEqual(m.house_adj, p.house_adj); assert.strictEqual(m.polls, p.polls_window); });
out.v20_v19_compare.forEach((r) => { if (D.models[r.state]) assert.strictEqual(D.models[r.state].v19_frozen, r.v19_frozen); });
assert.strictEqual(D.mc.central, 0.804, 'published v20 probability, not a re-simulation');
const pub20 = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'data', 'site_v20.json'), 'utf8'));
pub20.races.forEach((r) => { assert.strictEqual(D.models[r.state].p_opp, r.p_opp); assert.strictEqual(D.models[r.state].p10, r.p10); }); assert.strictEqual(D.meta.v19_hash, '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461');
ok('every margin, poll count and probability shown is the published v20 value; frozen values come from the snapshot');

assert.strictEqual(D.polls.length, data.senate_polls.length); assert.strictEqual(D.meta.included, 458); assert.strictEqual(D.meta.post_freeze, 13); assert.strictEqual(D.meta.v19_included, 445);
Object.keys(D.models).forEach((s) => assert.strictEqual(D.polls.filter((p) => p.s === s && p.w).length, D.models[s].polls, 'window membership ' + s));
assert(D.polls.filter((p) => p.coh === 'v20').length === 13 && D.polls.filter((p) => p.wave).length === 2);
ok('poll explorer has all 461 rows; window membership matches each average; post-freeze rows and RedBox waves flagged');

const slider = html.match(/id="wiSlider" min="(-?\d+)" max="(-?\d+)"/); assert(slider && Number(slider[1]) === -Number(slider[2]), 'symmetric swing range');
const sliderStep = html.match(/id="wiSlider"[^>]*step="([0-9.]+)"/);
assert(sliderStep && Number(sliderStep[1]) === 0.01, 'hundredth-point slider precision required for +7.35 scenario');
D.scenarios.forEach((sc) => { const steps = (sc.applied_shift + 8) / Number(sliderStep[1]); assert(Math.abs(steps - Math.round(steps)) < 1e-8, 'scenario is representable on slider: ' + sc.key); });
assert(/documented past misses/.test(script) && !/D\.scenarios\.length \+ ' documented/.test(script));
assert(/Built after the official freeze/.test(script) && /not forecasts/.test(script) && /experimental/i.test(script));
assert(!/frozen November 2 election-eve data/i.test(html), 'must not call v20 data frozen');
assert(!/<script[^>]+src=/.test(html) && /viewport-fit=cover/.test(html) && /prefers-color-scheme/.test(html));
ok('symmetric slider, honest labels, no external scripts, mobile viewport and dark mode');

// full render smoke test with a minimal DOM
function el() { const cl = new Set(); return { innerHTML: '', textContent: '', value: '', addEventListener() {}, querySelectorAll: () => [], getAttribute: () => '0', setAttribute() {}, classList: { toggle: (c, on) => (on ? cl.add(c) : cl.delete(c)), add: (c) => cl.add(c), contains: (c) => cl.has(c) }, style: {} }; }
const els = {}; const doc = { getElementById: (id) => (id === 'data' ? { textContent: json } : (els[id] = els[id] || el())), querySelectorAll: () => [] };
els.raceSort = el(); els.raceSort.value = 'close'; els.wiSlider = el(); els.wiSlider.value = '-2.7'; els.pState = el(); els.pState.value = 'all'; els.pScope = el(); els.pScope.value = 'inc'; els.pCohort = el(); els.pCohort.value = 'any'; els.pEvid = el(); els.pEvid.value = 'any'; els.pSponsor = el(); els.pSponsor.value = 'any'; els.pSearch = el(); els.pSearch.value = '';
['overview', 'races', 'race-IA', 'race-NE', 'whatif', 'polls', 'methods'].forEach((h) => {
  const w = { location: { hash: '#' + h }, addEventListener() {}, scrollTo() {} }; els.wiModel = el(); els.wiModel.value = 'simple';
  new Function('window', 'document', script)(w, doc);
});
assert(/Iowa/.test(els.raceDetail.innerHTML) || /Nebraska/.test(els.raceDetail.innerHTML));
assert.strictEqual(els.wiD.textContent, 51); assert.strictEqual(els.wiR.textContent, 49);
assert(/polls match/.test(els.pCount.textContent) && els.pList.innerHTML.length > 1000 && /Three versions, kept separate/.test(els.methods.innerHTML));
ok('every view renders; the what-if at the 2024 miss (-2.7) shows 51 D / 49 R, as v20 does');

// ---------- 1.0.2 regression tests: scenario-sensitive ranges and stable tie rule ----------
const PUBS = Object.fromEntries(pub20.scenarios.map((s) => [s.key, s]));
assert.strictEqual(PL.TIE_H, 5); assert.strictEqual(PL.SENS_H, 50);
assert.strictEqual(PL.toH(7.35), 735); assert.strictEqual(PL.toH(7.3 + 0.05), 735); assert.strictEqual(PL.toH(-7.3), -730); assert.strictEqual(PL.toH('7.35'), 735);
assert.notStrictEqual(-7.3 + 7.35, 0.05, 'raw floating point really is unstable here (documents why integers are used)');
ok('margins and shifts compared in whole hundredths; 7.35, 7.3 + 0.05 and "7.35" all map to 735');

// Mississippi under the 2025 off-year miss (+7.35)
const msShift = PUBS.offyear_2025.applied_shift; assert.strictEqual(PL.toH(msShift), 735);
const rMS = PL.seats(PL.marginsFor('simple'), msShift); const ms = rMS.sensitive.find((s) => s.state === 'MS');
assert(ms && ms.t === 5 && ms.tie === false && ms.winner === 'D', 'Mississippi lands at exactly +5 hundredths: not a tie under the v20 rule');
assert.deepStrictEqual(rMS.sensitive.map((s) => s.state), ['MS'], 'Mississippi is the only race within 0.5 under this miss');
const rgMS = PL.seatRange(rMS);
assert.deepStrictEqual([rgMS.dem, rgMS.rep, rgMS.ind], [[56, 57], [42, 43], [1, 1]]);
const offMS = PL.officialAt('simple', msShift); assert.deepStrictEqual([offMS.dem_seats, offMS.rep_seats, offMS.ind_seats], [56, 43, 1]);
assert.strictEqual(PL.officialWinners(offMS).MS, 'R', 'official v20 total counted Mississippi for the incumbent');
[msShift + 1e-9, msShift - 1e-9, 7.3 + 0.05, Number('7.35')].forEach((v) => { const x = PL.seats(PL.marginsFor('simple'), v); assert.deepStrictEqual([x.dem, x.rep, x.ind, x.sensitive.map((s) => s.t).join()], [57, 42, 1, '5'], 'stable under float noise: ' + v); });
ok('Mississippi at +7.35: exactly D+0.05, scenario-sensitive, official 56 D / 43 R / 1 I kept, range D 56-57 / R 42-43 / I 1, unchanged by float noise');

// The four zero-margin cases
[['AK', 'aapor_senate_2024'], ['OH', 'aapor_2024'], ['SC', 'aapor_senate_2022'], ['TX', 'aapor_2016']].forEach(([st, key]) => {
  const sc = PUBS[key]; const r = PL.seats(PL.marginsFor('simple'), sc.applied_shift); const s = r.sensitive.find((x) => x.state === st);
  assert(s && s.t === 0 && s.tie === true && s.winner === 'R', st + ' lands at exactly 0 and the Republican incumbent keeps it under ' + key);
  assert.strictEqual(PL.officialWinners(sc)[st], 'R', st + ' official v20 winner');
  assert.deepStrictEqual([r.dem, r.rep, r.ind], [sc.dem_seats, sc.rep_seats, sc.ind_seats], 'official total equals stable total for ' + key);
  const rg = PL.seatRange(r);
  assert(rg.dem[0] <= sc.dem_seats && rg.dem[1] >= sc.dem_seats + 1, 'range lets the tied race go either way: ' + key);
  [1e-9, -1e-9].forEach((e) => { const x = PL.seats(PL.marginsFor('simple'), sc.applied_shift + e); assert.strictEqual(x.sensitive.find((y) => y.state === st).t, 0); });
});
const r24 = PL.seatRange(PL.seats(PL.marginsFor('simple'), PUBS.aapor_2024.applied_shift));
assert.deepStrictEqual([r24.dem, r24.rep, r24.ind], [[49, 53], [47, 51], [0, 0]]);
assert(r24.controls.indexOf('Democrats') >= 0 && r24.controls.indexOf('Republicans') >= 0, '2024-style miss: control depends on near-ties');
ok('zero-margin cases (AK Senate 2024, OH 2024, SC Senate 2022, TX 2016): exactly 0, incumbent kept, official totals kept, ranges include one more Democratic seat');

// Every scenario: official total within its range; D/R/I separate and complete; deterministic on the slider grid
pub20.scenarios.forEach((sc) => {
  const r = PL.seats(PL.marginsFor('simple'), sc.applied_shift); const rg = PL.seatRange(r);
  assert(rg.dem[0] <= sc.dem_seats && sc.dem_seats <= rg.dem[1] && rg.rep[0] <= sc.rep_seats && sc.rep_seats <= rg.rep[1] && rg.ind[0] <= sc.ind_seats && sc.ind_seats <= rg.ind[1], 'official inside range: ' + sc.key);
  const kD = rg.dem[1] - rg.dem[0], kI = rg.ind[1] - rg.ind[0];
  assert.strictEqual(rg.dem[0] + rg.rep[0] + rg.ind[0] + kD + kI, 100); assert.strictEqual(rg.rep[1] - rg.rep[0], kD + kI);
});
for (let k = -800; k <= 800; k += 1) { const v = k / 100; const a = PL.seats(PL.marginsFor('simple'), v); const b = PL.seats(PL.marginsFor('simple'), v + 1e-9); assert.deepStrictEqual([a.dem, a.rep, a.ind, a.sensitive.length], [b.dem, b.rep, b.ind, b.sensitive.length], 'grid ' + v); }
assert.strictEqual(PL.officialAt('lv_only', msShift), null); assert.strictEqual(PL.officialAt('simple', 7.34), null);
ok('every official total lies in its range; ranges keep D/R/I separate and sum to 100; all 1,601 slider positions deterministic; official overlay only at documented shifts on the v20 average');

// Wording and rendering of the new elements
assert(/not a calibrated probability, a margin of error or a confidence interval/.test(script) && /Not a probability or margin of error/.test(script) && /Official v20 result/.test(script));
assert(/Senate explorer 1\.0\.2/.test(script));
function el2() { const cl = new Set(); return { innerHTML: '', textContent: '', value: '', addEventListener() {}, querySelectorAll: () => [], getAttribute: () => '0', setAttribute() {}, classList: { toggle: (c, on) => (on ? cl.add(c) : cl.delete(c)) }, style: {} }; }
function renderAt(model, v) { const E = {}; const docx = { getElementById: (id) => (id === 'data' ? { textContent: json } : (E[id] = E[id] || el2())), querySelectorAll: () => [] }; ['raceSort', 'pState', 'pScope', 'pCohort', 'pEvid', 'pSponsor', 'pSearch'].forEach((k) => { E[k] = el2(); }); E.raceSort.value = 'close'; E.pState.value = 'all'; E.pScope.value = 'inc'; E.pCohort.value = 'any'; E.pEvid.value = 'any'; E.pSponsor.value = 'any'; E.wiModel = el2(); E.wiModel.value = model; E.wiSlider = el2(); E.wiSlider.value = v; new Function('window', 'document', script)({ location: { hash: '#whatif' }, addEventListener() {}, scrollTo() {} }, docx); return E; }
const e1 = renderAt('simple', '7.35');
assert.deepStrictEqual([e1.wiD.textContent, e1.wiR.textContent, e1.wiI.textContent], [56, 43, 1]);
assert(/Official v20 result/.test(e1.wiMode.textContent) && /D 56–57/.test(e1.wiRange.innerHTML) && /R 42–43/.test(e1.wiRange.innerHTML) && /Mississippi/.test(e1.wiSens.innerHTML) && /floating-point edge/.test(e1.wiSens.innerHTML));
const e2 = renderAt('simple', '-2.7');
assert.deepStrictEqual([e2.wiD.textContent, e2.wiR.textContent], [51, 49]); assert(/D 49–53/.test(e2.wiRange.innerHTML) && /Ohio/.test(e2.wiSens.innerHTML) && /tie under the v20 rule/.test(e2.wiSens.innerHTML));
const e3 = renderAt('simple', '1.03');
assert(/Computed with the v20 tie rule/.test(e3.wiMode.textContent));
const e4 = renderAt('lv_only', '7.35');
assert(/Computed with the v20 tie rule/.test(e4.wiMode.textContent), 'official overlay only applies to the v20 average baseline');
assert(/<td>2025 off-year<\/td>/.test(e1.wiScenTable.innerHTML) && /56<\/span> · <span class="R">43/.test(e1.wiScenTable.innerHTML));
ok('what-if shows the official 56 / 43 / 1 at +7.35 with range 56-57 and the Mississippi note; 51 / 49 at -2.7 with Ohio flagged as a tie; computed label elsewhere; scenario table lists official totals and ranges');

console.log('PASS: ' + n + ' explorer checks.');
