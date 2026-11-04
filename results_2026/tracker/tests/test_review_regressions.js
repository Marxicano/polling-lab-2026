// Regression tests for ChatGPT's independent tracker review (2026-11-03).
// Each check reproduces one reported failure. Written before the fixes and run against tracker 1.0 first
// (expected: failures), then against tracker 1.1 (expected: all pass). Synthetic data only, in temp folders.
// Usage (from the repository root): node results_2026/tracker/tests/test_review_regressions.js
'use strict';
process.env.V20_SIMS = process.env.V20_SIMS || '3000';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const TRACKER = path.join(__dirname, '..');
const results = [];
function check(id, title, fn) {
  try { fn(); results.push({ id, title, ok: true }); console.log('  PASS ' + id + ' ' + title); }
  catch (e) { results.push({ id, title, ok: false, why: String(e && e.message || e).split('\n')[0].slice(0, 220) }); console.log('  FAIL ' + id + ' ' + title + '\n       -> ' + results[results.length - 1].why); }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const mustThrow = (fn, msg) => { let threw = false; try { fn(); } catch (e) { threw = true; } if (!threw) throw new Error(msg); };
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } }
function freshRequire(p) { Object.keys(require.cache).forEach((k) => { if (k.indexOf(path.sep + 'results_2026' + path.sep + 'tracker' + path.sep) >= 0 || /[\\/](v20|v20_1|v19_frozen)[\\/]/.test(k)) delete require.cache[k]; }); return require(p); }

const L = freshRequire(path.join(TRACKER, 'lib', 'results_lib.js'));
const B = freshRequire(path.join(TRACKER, 'build_dashboard.js'));
const realDir = path.join(TRACKER, 'data');
const real = L.loadData();
const RACE = Object.fromEntries(real.races.map((r) => [r.state, r]));
const SRC = Object.fromEntries(real.sources.map((s) => [s.state, s]));
const authDomain = (st) => (SRC[st].authority_domains || SRC[st].allowed_domains).split(';')[0];
function tmpData() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rv-'));
  for (const f of fs.readdirSync(realDir)) { const s = path.join(realDir, f); if (fs.statSync(s).isDirectory()) copyDir(s, path.join(d, f)); else fs.copyFileSync(s, path.join(d, f)); }
  return d;
}
function report(st, round, status, ts, pct, extra) {
  const e = extra || {}; const total = e.total || 1000000; const race = RACE[st];
  const ch = Math.round(total * pct[0] / 100), rp = Math.round(total * pct[1] / 100), oth = total - ch - rp;
  const cert = /certified/.test(status);
  const base = { state: st, round, reported_pct: e.reported_pct != null ? String(e.reported_pct) : (cert ? '' : '100'), reporting_unit: e.unit != null ? e.unit : (cert ? '' : 'ballots'), authority_status_text: e.stext || (cert ? 'Certified official results' : 'Unofficial results'), reporting_status: status, report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: cert ? (e.cert || '2026-11-30') : '', authority_name: SRC[st].authority, source_url: e.url || ('https://' + authDomain(st) + '/results/2026-general'), notes: 'SYNTHETIC TEST DATA', entered_by: 'regression-test' };
  const rows = [Object.assign({}, base, { candidate: race.challenger, ballot_party: race.challenger_party, votes: String(ch), total_votes: String(total) }), Object.assign({}, base, { candidate: race.republican, ballot_party: 'R', votes: String(rp), total_votes: String(total) })];
  if (oth > 0) rows.push(Object.assign({}, base, { candidate: 'All other candidates and write-ins', ballot_party: 'OTH', votes: String(oth), total_votes: String(total) }));
  return rows;
}
const certifyAll = (d) => real.races.forEach((race) => { L.appendReturns(report(race.state, 'first', 'certified', '2026-11-25T20:00Z', [55, 43]), d); if (race.ranked_choice === 'yes') { /* majority already, no further rounds */ } });

console.log('Tracker review regression tests (ChatGPT, 2026-11-03)');

// ---------- Blocker 1: complete candidate-return validation ----------
check('B1a', 'single-candidate certified report is rejected (was accepted and scored +50)', () => {
  const d = tmpData();
  const rows = report('OH', 'first', 'certified', '2026-11-25T20:00Z', [50, 47]).slice(0, 1);
  rows[0].votes = '500000';
  mustThrow(() => L.appendReturns(rows, d), 'one Brown row with no Husted row was accepted');
});
check('B1b', 'duplicate candidate rows in one report are rejected', () => {
  const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49]);
  rows.push(Object.assign({}, rows[1])); rows[3].votes = '0';
  mustThrow(() => L.appendReturns(rows, d), 'duplicate Hinson row accepted');
});
check('B1c', 'candidate votes must add up to total_votes', () => {
  const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49]); rows[2].votes = String(Number(rows[2].votes) - 1000);
  mustThrow(() => L.appendReturns(rows, d), 'votes summing to less than total accepted');
});
check('B1d', 'negative, fractional and unsafe vote numbers are rejected', () => {
  ['-5', '10.5', '9007199254740993', '1e6'].forEach((v) => { const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49]); rows[2].votes = v; mustThrow(() => L.appendReturns(rows, d), 'votes=' + v + ' accepted'); });
});
check('B1e', 'rows of one report must agree on source, status metadata and reporting share', () => {
  const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49]); rows[1].source_url = 'https://' + authDomain('IA') + '/other-page'; rows[2].reported_pct = '90';
  mustThrow(() => L.appendReturns(rows, d), 'mixed metadata accepted');
});
check('B1f', 'a report cannot be split or extended across appends', () => {
  const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49]);
  mustThrow(() => { L.appendReturns(rows.slice(0, 2), d); L.appendReturns(rows.slice(2), d); }, 'report split across two appends accepted');
});
check('B1g', 'named candidates must carry their own party', () => {
  const d = tmpData(); const rows = report('OH', 'first', 'unofficial', '2026-11-04T03:00Z', [49, 47]); rows[0].ballot_party = 'R';
  mustThrow(() => L.appendReturns(rows, d), 'Brown recorded as Republican accepted');
});

// ---------- Blocker 2: untracked-seat override security ----------
check('B2a', 'an untracked-seat result for a nonexistent state cannot change the seat count', () => {
  const d = tmpData();
  const legacy = path.join(d, 'noncompetitive_overrides.csv');
  fs.writeFileSync(legacy, 'state,holding_party,winner_party,reporting_status,report_timestamp_utc,certification_date,source_url,notes\nZZ,R,D,certified,2026-11-25T20:00Z,2026-11-30,https://not-an-authority.example/test,SYNTHETIC\n');
  let changed = false;
  try { const D = L.loadData(d); const t = L.seatTally(L.compare(D), D, L.frozenPredictions ? L.frozenPredictions() : undefined); const base = t.party || t.base || {}; changed = (base.D || t.dem) !== (L.loadData().races ? (t.party ? 41 : 43) : 43); if (!t.party && t.base && t.base.D === 44) changed = true; } catch (e) { changed = false; }
  must(!changed, 'nonexistent state ZZ moved the base from 43 D / 42 R to 44 D / 41 R');
  must(typeof L.appendUntracked === 'function', 'no validated append path for untracked results');
  mustThrow(() => L.appendUntracked([{ state: 'ZZ', round: 'final', candidate_winner: 'X', winner_party: 'D', reporting_status: 'certified', report_timestamp_utc: '2026-11-25T20:00Z', retrieved_at_utc: '2026-11-25T20:00Z', certification_date: '2026-11-30', authority_name: 'x', source_url: 'https://not-an-authority.example/test', notes: '', entered_by: 'test' }], d), 'ZZ accepted');
});
check('B2b', 'untracked results: tracked states, wrong holder, non-authority URL and contradictions are rejected', () => {
  must(typeof L.appendUntracked === 'function', 'no validated append path for untracked results');
  const row = (st, extra) => Object.assign({ state: st, round: 'final', candidate_winner: 'Steve Daines', winner_party: 'R', reporting_status: 'certified', report_timestamp_utc: '2026-11-25T20:00Z', retrieved_at_utc: '2026-11-25T20:00Z', certification_date: '2026-11-30', authority_name: SRC.MT ? SRC.MT.authority : 'Montana Secretary of State', source_url: 'https://' + (SRC.MT ? authDomain('MT') : 'sosmt.gov') + '/elections/results', notes: 'SYNTHETIC', entered_by: 'test' }, extra || {});
  const d = tmpData();
  mustThrow(() => L.appendUntracked([row('OH')], d), 'tracked state accepted as untracked');
  mustThrow(() => L.appendUntracked([row('MT', { source_url: 'https://apnews.com/x' })], d), 'news URL accepted');
  mustThrow(() => L.appendUntracked([row('MT', { reporting_status: 'unofficial', certification_date: '' })], d), 'unofficial untracked result accepted');
  L.appendUntracked([row('MT')], d);
  mustThrow(() => L.appendUntracked([row('MT', { winner_party: 'D', candidate_winner: 'Someone Else', report_timestamp_utc: '2026-11-26T20:00Z', retrieved_at_utc: '2026-11-26T20:00Z' })], d), 'contradictory certified result accepted without amendment');
  const file = path.join(d, 'untracked_results.csv'); fs.appendFileSync(file, 'ZZ,final,X,D,certified,2026-11-25T20:00Z,2026-11-25T20:00Z,2026-11-30,x,https://not-an-authority.example/test,,test,bad,bad\n');
  mustThrow(() => L.loadData(d), 'hand-edited untracked log loaded without error');
});

// ---------- Blocker 3: recount suspends an earlier certified score ----------
check('B3', 'a recount after certification suspends the score and winner until a recount is certified', () => {
  const d = tmpData();
  L.appendReturns(report('OH', 'first', 'certified', '2026-11-25T20:00Z', [49.6, 49.4]), d);
  L.appendReturns(report('OH', 'first', 'recount', '2026-12-02T20:00Z', [49.6, 49.4], { cert: '' }), d);
  let r = L.compare(L.loadData(d)).find((x) => x.state === 'OH');
  must(r.comparable === 'recount', 'recount ignored: comparable=' + r.comparable);
  must(r.winner === null && r.error_v19 === null, 'winner/error still published during recount');
  must(L.scorecard(L.compare(L.loadData(d)), 'error_v19', 'certified').races === 0, 'race still in the certified scorecard');
  L.appendReturns(report('OH', 'first', 'recount_certified', '2026-12-20T20:00Z', [49.5, 49.5], { cert: '2026-12-20' }), d);
  r = L.compare(L.loadData(d)).find((x) => x.state === 'OH');
  must(r.comparable === 'certified' && r.status === 'recount_certified', 'certified recount result not used');
});

// ---------- Blocker 4: clean checkout of the actual repository layout ----------
check('B4', 'tracker builds and scores from a checkout containing only the files the GitHub repo actually has', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-checkout-'));
  const SRC_REPO = path.join(TRACKER, '..', '..');
  const present = [['v19_frozen/data/snapshot_2026-11-02.csv', 'data/snapshot_2026-11-02.csv'], ['v20/preregistration_mike.json', 'v20/preregistration_mike.json'], ['docs/data/site_v20.json', 'docs/data/site_v20.json'], ['v20_1/score_v201.js', 'v20_1/score_v201.js']];
  present.forEach(([from, to]) => { const s = fs.existsSync(path.join(SRC_REPO, from)) ? path.join(SRC_REPO, from) : null; if (s) { fs.mkdirSync(path.dirname(path.join(repo, to)), { recursive: true }); fs.copyFileSync(s, path.join(repo, to)); } });
  copyDir(TRACKER, path.join(repo, 'results_2026', 'tracker'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-out-'));
  execFileSync(process.execPath, ['-e', "require('./results_2026/tracker/build_dashboard.js').build({ outDir: process.argv[1], builtAt: '2026-11-03T12:00:00Z' })", out], { cwd: repo, stdio: 'pipe', env: Object.assign({}, process.env) });
  must(fs.existsSync(path.join(out, 'index.html')), 'no dashboard produced');
  const script = "const L=require('./results_2026/tracker/lib/results_lib.js');const d=process.argv[1];const D0=L.loadData(d);" +
    "D0.races.forEach(r=>{const t=1000000,c=550000,p=430000;const b={state:r.state,round:'first',reported_pct:'',reporting_unit:'',authority_status_text:'Certified',reporting_status:'certified',report_timestamp_utc:'2026-11-25T20:00Z',retrieved_at_utc:'2026-11-25T20:00Z',certification_date:'2026-11-30',authority_name:'x',source_url:'https://'+(D0.sources.find(s=>s.state===r.state).authority_domains||D0.sources.find(s=>s.state===r.state).allowed_domains).split(';')[0]+'/r',notes:'SYNTHETIC',entered_by:'t'};" +
    "L.appendReturns([Object.assign({},b,{candidate:r.challenger,ballot_party:r.challenger_party,votes:String(c),total_votes:String(t)}),Object.assign({},b,{candidate:r.republican,ballot_party:'R',votes:String(p),total_votes:String(t)}),Object.assign({},b,{candidate:'All other candidates and write-ins',ballot_party:'OTH',votes:String(t-c-p),total_votes:String(t)})],d);});" +
    "const D=L.loadData(d);const res=L.registeredTests(D,L.compare(D),{now:'2026-12-01T00:00Z',scoreOpts:{reps:200}});if(!res.tests||res.tests.length!==4)throw new Error('registered tests did not run');console.log('ok');";
  const d = path.join(repo, 'results_2026', 'tracker', 'tmpdata'); copyDir(path.join(repo, 'results_2026', 'tracker', 'data'), d);
  const o = execFileSync(process.execPath, ['-e', script, d], { cwd: repo, encoding: 'utf8', env: Object.assign({}, process.env) });
  must(/ok/.test(o), 'registered scoring failed in the clean checkout');
});

// ---------- Blocker 5: Democratic / Republican / independent accounting ----------
check('B5', 'party seats and caucus alignment are reported separately (41 D / 42 R / 2 I; caucus 43 / 42)', () => {
  const b = L.baseSeats();
  must(b.party && b.party.D === 41 && b.party.R === 42 && b.party.I === 2, 'base reported as ' + JSON.stringify(b.party || b) + ' instead of party seats 41 D / 42 R / 2 I');
  must(b.caucus && b.caucus.D === 43 && b.caucus.R === 42, 'caucus alignment missing');
  const P = L.frozenPredictions();
  must(/caucus/i.test(String(P.seats19.label || '')), 'frozen 53/47 shown without its caucus-equivalent convention');
});

// ---------- Blocker 6: complete dependency fingerprinting ----------
check('B6a', 'every build verifies all dependencies, including the pre-registration, scorer and registry', () => {
  must(typeof L.verifyDependencies === 'function', 'no dependency verification');
  const v = L.verifyDependencies(); must(v.ok && v.files.length >= 50, 'dependency manifest incomplete: ' + (v.files ? v.files.length : 0));
  ['v20/preregistration_mike.json', 'v20/score_v20.js', 'v20/run_v20.js', 'v20/engine_v20.js', 'v19_frozen/engine.js', 'v20/data/states.csv', 'v20/data/senate_totals.csv', 'v20/data/senate_polls.csv', 'v20_1/exploratory_registry_v201.json', 'v20_1/score_v201.js'].forEach((f) => must(v.files.some((x) => x.path === f), 'not fingerprinted: ' + f));
});
check('B6b', 'a root missing the pre-registration, scorer and registry cannot build (was: builds)', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'partial-root-'));
  const SRC_REPO = path.join(TRACKER, '..', '..');
  [['v19_frozen/data/snapshot_2026-11-02.csv', 'data/snapshot_2026-11-02.csv'], ['docs/data/site_v20.json', 'docs/data/site_v20.json'], ['v20/data/states.csv', 'v20/data/states.csv'], ['v20/data/senate_totals.csv', 'v20/data/senate_totals.csv']].forEach(([f, t]) => { if (fs.existsSync(path.join(SRC_REPO, f))) { fs.mkdirSync(path.dirname(path.join(repo, t)), { recursive: true }); fs.copyFileSync(path.join(SRC_REPO, f), path.join(repo, t)); } });
  copyDir(TRACKER, path.join(repo, 'results_2026', 'tracker'));
  const vend = path.join(repo, 'results_2026', 'tracker', 'vendor');
  ['v20/preregistration_mike.json', 'v20/score_v20.js', 'v20_1/exploratory_registry_v201.json'].forEach((f) => { const p = path.join(vend, f); if (fs.existsSync(p)) fs.unlinkSync(p); });
  let built = true;
  try { execFileSync(process.execPath, ['-e', "require('./results_2026/tracker/build_dashboard.js').build({ outDir: require('os').tmpdir() + '/x-partial-' + Date.now() })"], { cwd: repo, stdio: 'pipe' }); } catch (e) { built = false; }
  must(!built, 'dashboard built without the pre-registration, scorer and registry');
});
check('B6c', 'tampering with any pinned input (e.g. states.csv or run_v20.js) stops the build', () => {
  ['v20/data/states.csv', 'v20/run_v20.js'].forEach((f) => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tamper-'));
    copyDir(TRACKER, path.join(repo, 'results_2026', 'tracker'));
    const p = path.join(repo, 'results_2026', 'tracker', 'vendor', f);
    must(fs.existsSync(p), 'no vendored copy of ' + f);
    fs.appendFileSync(p, '\n');
    let built = true; try { execFileSync(process.execPath, ['-e', "require('./results_2026/tracker/build_dashboard.js').build({ outDir: require('os').tmpdir() + '/x-tamper-' + Date.now() })"], { cwd: repo, stdio: 'pipe' }); } catch (e) { built = false; }
    must(!built, 'build succeeded with a modified ' + f);
  });
});

// ---------- Additional issues ----------
check('A1', 'a results host that is only pending verification is rejected until its authority link is recorded', () => {
  const d = tmpData(); const pending = (SRC.IA.pending_result_hosts || '').split(';').filter(Boolean)[0];
  must(pending, 'no separate list of pending result hosts');
  const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49], { url: 'https://' + pending + '/results' });
  mustThrow(() => L.appendReturns(rows, d), 'pending host accepted without verification');
  L.appendDomainVerification([{ state: 'IA', host: pending, authority_page_url: 'https://' + authDomain('IA') + '/elections/results', verified_at_utc: '2026-11-03T23:00Z', verified_by: 'test', evidence_note: 'authority page links to host (SYNTHETIC)' }], d);
  L.appendReturns(rows, d);
});
check('A2', 'registered H1-H4 scoring is recorded once, with input fingerprints, and never silently recomputed', () => {
  const d = tmpData(); certifyAll(d);
  must(typeof L.recordRegisteredScoring === 'function', 'no one-time registered scoring record');
  const rec = L.recordRegisteredScoring(d, { now: '2026-12-01T00:00Z', scoreOpts: { reps: 200 } });
  must(rec.tests.length === 4 && rec.inputs && rec.inputs.returns_chain_head && rec.inputs.dependency_manifest_sha256, 'record lacks tests or input fingerprints');
  mustThrow(() => L.recordRegisteredScoring(d, { now: '2026-12-02T00:00Z', scoreOpts: { reps: 200 } }), 'record overwritten');
  L.appendReturns(report('KS', 'first', 'amended_certified', '2026-12-05T20:00Z', [54, 44], { cert: '2026-12-05' }), d);
  const S = B.assemble({ dataDir: d, now: '2026-12-06T00:00Z', builtAt: '2026-12-06T00:00:00Z' });
  must(S.registered.record && S.registered.record.recorded_at_utc === rec.recorded_at_utc, 'dashboard does not show the recorded result');
  must(S.registered.inputs_changed_since_record === true, 'later amendment not flagged as a revision');
});
check('A3', 'chain heads can be printed for independent anchoring; wording does not claim tamper-proofing', () => {
  must(fs.existsSync(path.join(TRACKER, 'print_chain_heads.js')), 'no chain-head printer');
  const readme = fs.readFileSync(path.join(TRACKER, 'README.md'), 'utf8');
  must(!/tamper-proof/i.test(readme) && /anchor/i.test(readme), 'README does not explain anchoring');
});
check('A4', 'a reporting share needs its unit, and provisional labels say which unit reached 100%', () => {
  const d = tmpData(); const rows = report('IA', 'first', 'unofficial', '2026-11-04T03:00Z', [47, 49], { unit: '' });
  mustThrow(() => L.appendReturns(rows, d), 'reported_pct=100 accepted without a unit');
  L.appendReturns(report('IA', 'first', 'unofficial', '2026-11-04T05:00Z', [47, 49], { unit: 'precincts' }), d);
  const r = L.compare(L.loadData(d)).find((x) => x.state === 'IA');
  must(r.comparable === 'provisional' && r.reporting_unit === 'precincts', 'unit not carried into the comparison');
});
check('A6', 'chamber control is not computed until all 20 untracked contests are confirmed', () => {
  const d = tmpData(); certifyAll(d);
  const D = L.loadData(d); const t = L.seatTally(L.compare(D), D, L.frozenPredictions());
  must(t.control && t.control.computed === false, 'control computed while 20 untracked contests are only assumed');
});
check('A7', 'Mississippi disclosure separates sponsorship from firm alignment', () => {
  const S = B.assemble({ now: '2026-11-03T12:00Z', builtAt: '2026-11-03T12:00:00Z' });
  const t = S.disclosures.join(' ');
  must(!/Democratic-sponsored polls/.test(t) && /SPLC Action Fund/.test(t) && /Data for Progress/.test(t), 'Mississippi wording still calls all three polls Democratic-sponsored');
});
check('A8', 'small screens: tables fit a 320-pixel viewport', () => {
  const S = B.assemble({ now: '2026-11-03T12:00Z', builtAt: '2026-11-03T12:00:00Z' }); const html = B.render(S);
  must(/@media \(max-width:\s*360px\)/.test(html), 'no small-screen table rule');
});

const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' review checks pass' + (failed.length ? '; failing: ' + failed.map((f) => f.id).join(', ') : ''));
process.exit(failed.length ? 1 : 0);
