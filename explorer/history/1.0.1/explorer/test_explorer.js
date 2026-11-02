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
out.v20_error_scenarios.forEach((s) => { const r = PL.seats(PL.marginsFor('simple'), s.applied_shift); assert.deepStrictEqual([r.dem, r.rep, r.ind], [s.dem_seats, s.rep_seats, s.ind_seats], 'scenario ' + s.key); });
const off = out.v20_error_scenarios.find((s) => s.key === 'offyear_2025'); const ro = PL.seats(PL.marginsFor('simple'), off.applied_shift);
assert(ro.ind === 1 && ro.dem === 56, 'Osborn counted as an independent, not a Democrat');
ok('app seat math reproduces every v20 historical-miss scenario (D/R/I), with Osborn separate');

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
console.log('PASS: ' + n + ' explorer checks.');
