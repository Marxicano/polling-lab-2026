// Builds docs/results/index.html (data embedded, no external scripts) and docs/results/data/results_dashboard.json.
// Usage: node results_2026/tracker/build_dashboard.js   (never computes the registered tests; it only shows a recorded result)
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib/results_lib.js');

function assemble(opts) {
  const o = opts || {};
  const D = L.loadData(o.dataDir); // verifies every dependency, static file and log on each build
  const P = L.frozenPredictions();
  const rows = L.compare(D);
  const g = L.gate(D, rows, o.now);
  const lastRetrieved = D.returns.concat(D.untracked).map((r) => r.retrieved_at_utc).sort().slice(-1)[0] || null;
  const count = (k) => rows.filter((r) => r.comparable === k).length;
  const rc = D.deps.repo_checks.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {});
  return {
    meta: { tracker_version: '1.1.4 (pre-release; not production-ready)', built_utc: (o.builtAt || new Date().toISOString()).slice(0, 16).replace('T', ' '), last_retrieved_utc: lastRetrieved,
      returns_rows: D.returns.length, untracked_rows: D.untracked.length, domain_verifications: D.domains.length,
      chain_heads: { returns: D.returnsHead, untracked: D.untrackedHead, domains: D.domainsHead }, conventions_sha256: D.conventionsHash, static_manifest_sha256: D.staticHash,
      dependencies: { verified: D.deps.ok, files: D.deps.files.length, manifest_sha256: D.deps.manifest_sha256, checkout_copies: rc },
      anchors: { v19_snapshot: L.deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'], prereg: L.deps.PINNED.anchors['v20/preregistration_mike.json'] } },
    status_counts: { none: count('none'), partial: count('partial'), provisional: count('provisional'), certified: count('certified'), recount: count('recount') },
    races: rows,
    seats: L.seatTally(rows, D, P),
    scorecards: { primary: L.scorecard(rows, 'error_v19', 'certified'), secondary: L.scorecard(rows, 'error_v20', 'certified'), provisional_v19: L.scorecard(rows, 'error_v19', 'provisional'), provisional_v20: L.scorecard(rows, 'error_v20', 'provisional') },
    registered: { gate: g, record: D.record, inputs_changed_since_record: L.inputsChangedSinceRecord(D), ready_to_record: g.ready && !D.record },
    sources: D.sources.map((s) => ({ state: s.state, tracked: s.tracked, authority: s.authority, url: s.authority_url, pending_hosts: s.pending_result_hosts, verified_hosts: D.domains.filter((v) => v.state === s.state).map((v) => v.host), status: s.verification_status, notes: s.notes })),
    conventions: D.conventions,
    disclosures: [
      'Only 28 of 458 included v20 poll records were read against the pollster’s own release; most rest on aggregator listings with links.',
      'Mississippi’s frozen R+7.3 average rests on three stale polls (79-498 days old), all flagged Democratic-aligned: two sponsored by the SPLC Action Fund (Impact Research) and one from Data for Progress with no named sponsor. It is scored as published, with this warning.',
      'Partisan sponsor flags and documented firm alignment are different variables; many pollsters’ recalled-vote methods are unknown, which can limit H2 and H3.',
      'The frozen v19 seat count (53 D / 47 R) is caucus-equivalent: it counts the two sitting independents who caucus with Democrats as Democratic seats. This page shows party affiliation and caucus alignment separately.',
      'In Alaska and Maine, poll head-to-head questions are compared with first-choice ballot shares; the two are not identical, so those comparisons are approximate.',
      'v20 probabilities are experimental, not calibrated. One election’s results cannot validate them.',
      'The results logs are hash-chained: edits and deletions are detected, but a complete rewrite is not unless chain heads are published separately (print_chain_heads.js).',
    ],
  };
}

const CSS = `:root{--bg:#f6f5f1;--card:#fff;--ink:#16191d;--muted:#5b636b;--line:#e1ded7;--d:#2a5ea8;--r:#b5362f;--i:#8a6a12;--chip:#eceef1;--warn:#875800;--warnbg:#fff2d4;--ok:#1f6b3a;--okbg:#e3f3e8;--top:#14202e;--topink:#f2f4f7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#101316;--card:#191d21;--ink:#ebe8e2;--muted:#a2a8ad;--line:#2d3338;--d:#7fa9e8;--r:#ee8b84;--i:#dcb663;--chip:#252a2f;--warn:#f0c46a;--warnbg:#382c12;--ok:#8fd19b;--okbg:#17301f;--top:#0b1118;--topink:#e8ecf1;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#101316;--card:#191d21;--ink:#ebe8e2;--muted:#a2a8ad;--line:#2d3338;--d:#7fa9e8;--r:#ee8b84;--i:#dcb663;--chip:#252a2f;--warn:#f0c46a;--warnbg:#382c12;--ok:#8fd19b;--okbg:#17301f;--top:#0b1118;--topink:#e8ecf1;color-scheme:dark}
:root{box-sizing:border-box;padding-bottom:env(safe-area-inset-bottom,0px)}*,*:before,*:after{box-sizing:inherit}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:var(--top)}
header{background:var(--top);color:var(--topink);padding:14px 14px 12px;padding-top:calc(14px + env(safe-area-inset-top,0px))}
header h1{font-size:1.25rem;margin:0 0 4px}header p{margin:0;opacity:.85;font-size:.9rem}
main{max-width:980px;margin:0 auto;padding:12px 14px 40px}
h2{font-size:1.08rem;margin:1.4em 0 .5em}p{margin:.35em 0 .8em}a{color:inherit}
.muted{color:var(--muted);font-size:.9rem}.small{font-size:.82rem}
.notice{background:var(--warnbg);border:1px solid var(--warn);border-radius:12px;padding:10px 12px;font-size:.92rem;margin:4px 0 12px}
.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px}
.kpi .v{font-size:1.5rem;font-weight:700}.kpi .l{font-size:.8rem;color:var(--muted)}
.D{color:var(--d)}.R{color:var(--r)}.I{color:var(--i)}
.badge{display:inline-block;border-radius:999px;padding:2px 9px;font-size:.76rem;font-weight:600;background:var(--chip);color:var(--muted)}
.badge.cert{background:var(--okbg);color:var(--ok)}.badge.unof{background:var(--warnbg);color:var(--warn)}
.hd{display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap}
.rowtbl{width:100%;border-collapse:collapse;font-size:.88rem}.rowtbl td,.rowtbl th{padding:6px 5px;border-bottom:1px solid var(--line);text-align:right}
.rowtbl td:first-child,.rowtbl th:first-child{text-align:left}.rowtbl th{color:var(--muted);font-weight:600;font-size:.78rem}
.wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}code{font-size:.8em;word-break:break-all}
@media (max-width:360px){main{padding:10px 8px 32px}.card{padding:10px 8px}.rowtbl{font-size:.8rem}.rowtbl td,.rowtbl th{padding:5px 3px}.kpi .v{font-size:1.25rem}}
footer{max-width:980px;margin:0 auto;padding:12px 14px 30px;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line)}`;

const SCRIPT = `(function(){var S=JSON.parse(document.getElementById('data').textContent);function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function lab(x,o){if(x==null)return '–';var v=Number(x);var s=Math.abs(v).toFixed(2).replace(/0$/,'');return (v>0?(o||'D')+'+':v<0?'R+':'Even ')+s;}
function mg(x,o){if(x==null)return '<span class="muted">–</span>';return '<span class="'+(x>0?(o||'D'):x<0?'R':'')+'">'+lab(x,o)+'</span>';}
function err(x){return x==null?'–':(x>0?'+':'')+x.toFixed(2);}
var SL={certified:'Certified',recount_certified:'Certified after recount',amended_certified:'Amended certification'};
function badge(r){if(r.comparable==='certified')return '<span class="badge cert">'+(SL[r.status]||'Certified')+(r.certification_date?' · '+esc(r.certification_date):'')+'</span>';if(r.comparable==='recount')return '<span class="badge unof">Recount in progress</span>';if(r.comparable==='provisional')return '<span class="badge unof">Unofficial · 100% of '+esc(r.reporting_unit)+' reported</span>';if(r.comparable==='partial')return '<span class="badge unof">Unofficial · '+(r.reported_pct==null?'share reported not given':r.reported_pct+'% of '+esc(r.reporting_unit))+'</span>';return '<span class="badge">No official results yet</span>';}
var c=S.status_counts;$('kpis').innerHTML=[['No results yet',c.none],['Unofficial, partial',c.partial],['Unofficial, complete',c.provisional],['Certified',c.certified],['Recount',c.recount]].map(function(k){return '<div class="card kpi"><div class="l">'+k[0]+'</div><div class="v">'+k[1]+'</div></div>';}).join('');
var se=S.seats;$('seats').innerHTML='<div class="wrap"><table class="rowtbl"><thead><tr><th></th><th>Democratic</th><th>Republican</th><th>Independent</th></tr></thead><tbody><tr><td>Party affiliation</td><td class="D">'+se.party.D+'</td><td class="R">'+se.party.R+'</td><td class="I">'+se.party.I+'</td></tr><tr><td>Caucus alignment</td><td class="D">'+se.caucus.D+'</td><td class="R">'+se.caucus.R+'</td><td class="I">'+se.caucus.unaligned+' unaligned</td></tr></tbody></table></div><p class="small muted">Includes '+se.untracked_assumed+' untracked contest(s) assumed held by the current party (not confirmed), '+se.untracked_confirmed+' confirmed by certified results, and '+se.tracked_undecided+' tracked race(s) still undecided (not counted). King and Sanders are independents who caucus with Democrats; a newly elected independent is unaligned unless an official statement is recorded.</p><p><strong>Control:</strong> '+(se.control.computed?esc(se.control.result):esc(se.control.reason))+'.</p><p class="small muted">Frozen v19 expected '+se.frozen_v19.dem+' D · '+se.frozen_v19.rep+' R · '+se.frozen_v19.ind+' I ('+esc(se.frozen_v19.label)+').</p>';
$('races').innerHTML=S.races.map(function(r){var o=r.challenger_party;var f=r.first_round;var body='<div class="hd"><strong>'+esc(r.name)+'</strong>'+badge(r)+'</div><div class="muted small">'+esc(r.challenger)+' ('+o+') vs '+esc(r.republican)+' (R)'+(r.ranked_choice==='yes'?' · ranked choice':'')+(r.state==='GA'?' · runoff if no majority':'')+'</div>';
body+='<div class="wrap"><table class="rowtbl" style="margin-top:6px"><thead><tr><th></th><th>Margin</th><th>Error</th></tr></thead><tbody><tr><td>Frozen v19 (primary)</td><td>'+mg(r.v19,o)+'</td><td>'+err(r.error_v19)+'</td></tr><tr><td>v20 post-freeze (secondary)</td><td>'+mg(r.v20,o)+'</td><td>'+err(r.error_v20)+'</td></tr>';
if(f)body+='<tr><td>Official first-round count'+(r.comparable==='partial'?' (partial)':r.comparable==='recount'?' (under recount)':'')+'</td><td>'+(r.comparable==='partial'||r.comparable==='recount'?'<span class="muted">not compared</span>':mg(f.margin,o))+'</td><td class="small muted">'+f.challenger_pct.toFixed(2)+'% – '+f.republican_pct.toFixed(2)+'% of '+f.total.toLocaleString()+'</td></tr>';
function lead(x){var c=x.candidates[0];return esc(c.candidate)+' ('+esc(c.ballot_party)+') '+c.pct.toFixed(2)+'%';}
if(r.majority_test&&(r.ranked_choice==='yes'||r.state==='GA')){var mt=r.majority_test;body+='<tr><td colspan="3" class="small muted">Majority test: '+(mt.result==='unknown'?'cannot be checked yet ('+esc(mt.note)+')':(mt.share==null?esc(mt.note):esc(mt.candidate)+' '+mt.share.toFixed(2)+'% of '+mt.denominator.toLocaleString())+(mt.result==='yes'?' — majority':' — no majority'))+'. '+esc(mt.rule)+'. The polling error uses candidate votes only.</td></tr>';}
if(r.final_round)body+='<tr><td>Final ranked-choice round'+(r.final_round_status==='recount'?' (under recount)':'')+' — decides the winner, not scored</td><td colspan="2" class="small">Leader: '+lead(r.final_round)+'</td></tr>';
if(r.runoff)body+='<tr><td>Runoff'+(r.runoff_status==='recount'?' (under recount)':'')+' — decides the winner, not scored</td><td colspan="2" class="small">Leader: '+lead(r.runoff)+'</td></tr>';
body+='</tbody></table></div><p class="small muted">'+(r.comparable==='provisional'?'Provisional comparison: unofficial and may still change; not a score. ':'')+(r.winner?'Winner ('+esc(r.winner_basis)+'): <strong class="'+r.winner+'">'+esc(r.winner_candidate||'')+' ('+esc(r.winner_ballot_party||r.winner)+')</strong>'+(r.winner==='I'?' — counted as independent/other':'')+'. ':r.winner_basis?esc(r.winner_basis)+'. ':'')+(r.authority_status_text?'Authority status: “'+esc(r.authority_status_text)+'”. ':'')+(r.report_timestamp_utc?'Report '+esc(r.report_timestamp_utc)+' UTC. ':'')+(r.source_url?'<a href="'+esc(r.source_url)+'" rel="noopener">Official source</a>':'')+'</p>';return '<div class="card">'+body+'</div>';}).join('');
function sc(s,title){return '<tr><td>'+title+'</td><td>'+s.races+'</td><td>'+(s.mean_signed_error==null?'–':err(s.mean_signed_error))+'</td><td>'+(s.mean_abs_error==null?'–':s.mean_abs_error.toFixed(2))+'</td><td>'+(s.races?s.leader_right+' of '+s.races:'–')+'</td></tr>';}
$('scores').innerHTML='<thead><tr><th>Scorecard</th><th>Races</th><th>Mean signed</th><th>Mean absolute</th><th>Leader right</th></tr></thead><tbody>'+sc(S.scorecards.primary,'Primary: frozen v19 vs certified')+sc(S.scorecards.secondary,'Secondary: v20 vs certified')+sc(S.scorecards.provisional_v19,'Provisional: v19 vs complete unofficial')+sc(S.scorecards.provisional_v20,'Provisional: v20 vs complete unofficial')+'</tbody>';
var R=S.registered,g=R.gate;if(!R.record){$('reg').innerHTML='<p><strong>Not recorded: '+esc(g.reason)+'.</strong> '+(R.ready_to_record?'Ready: run record_registered_scoring.js once to fix the result.':'The four pre-registered tests run once, unchanged, after certification (or with the certified races available on Jan 15, 2027).')+'</p>';}else{var rec=R.record;$('reg').innerHTML='<p class="small muted">Recorded '+esc(rec.recorded_at_utc)+' · '+esc(rec.gate.reason)+' · '+rec.results_used+' certified races · replicates '+esc(rec.replicates)+(rec.registered_replicates?'':' (NOT the registered 10,000: test record)')+'</p><div class="wrap"><table class="rowtbl"><thead><tr><th>Test</th><th>Estimate</th><th>90% interval</th><th>Decision</th></tr></thead><tbody>'+rec.tests.map(function(t){return '<tr><td>'+esc(t.id)+'</td><td>'+(t.primary==null?'–':t.primary)+'</td><td>'+(t.primary_ci?t.primary_ci.join(' to '):'–')+'</td><td><strong>'+esc(t.decision)+'</strong></td></tr>';}).join('')+'</tbody></table></div>'+(R.inputs_changed_since_record?'<p class="notice small">Official data changed after this result was recorded. The recorded result stands; any re-analysis is a labeled revision, not a replacement.</p>':'');}
$('unt').innerHTML='<thead><tr><th>State</th><th>Held by</th><th>Status</th></tr></thead><tbody>'+se.untracked.map(function(u){return '<tr><td>'+esc(u.name)+'</td><td>'+u.holder+'</td><td>'+(u.status==='confirmed'?'<span class="badge cert">Certified: '+esc(u.party)+'</span>':u.status==='recount'?'<span class="badge unof">Recount</span>':'<span class="badge">Assumed held (not confirmed)</span>')+'</td></tr>';}).join('')+'</tbody>';
$('discl').innerHTML=S.disclosures.map(function(d){return '<li>'+esc(d)+'</li>';}).join('');
$('src').innerHTML='<thead><tr><th>State</th><th>Election authority</th><th>Results hosts awaiting verification</th></tr></thead><tbody>'+S.sources.map(function(s){return '<tr><td>'+s.state+(s.tracked==='yes'?'':' <span class="small muted">(untracked)</span>')+'</td><td><a href="'+esc(s.url)+'" rel="noopener">'+esc(s.authority)+'</a>'+(s.notes?'<div class="small muted">'+esc(s.notes)+'</div>':'')+'</td><td class="small">'+(s.pending_hosts?esc(s.pending_hosts).replace(/;/g,', '):'–')+(s.verified_hosts.length?'<div>verified: '+esc(s.verified_hosts.join(', '))+'</div>':'')+'</td></tr>';}).join('')+'</tbody>';
var m=S.meta;$('foot').innerHTML='Tracker '+esc(m.tracker_version)+' · built '+esc(m.built_utc)+' UTC · last official data retrieved '+esc(m.last_retrieved_utc||'none yet')+' · dependencies verified: '+m.dependencies.files+' files (manifest <code>'+esc(m.dependencies.manifest_sha256.slice(0,12))+'…</code>) · log heads <code>'+esc(m.chain_heads.returns.slice(0,10))+'</code> <code>'+esc(m.chain_heads.untracked.slice(0,10))+'</code> <code>'+esc(m.chain_heads.domains.slice(0,10))+'</code> · frozen v19 <code>'+esc(m.anchors.v19_snapshot.slice(0,12))+'…</code> · pre-registration <code>'+esc(m.anchors.prereg.slice(0,12))+'…</code>';})();`;

function render(S) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Polling Lab 2026 — Senate results tracker (pre-release)</title><meta name="description" content="Official 2026 Senate returns for the 15 races the Polling Lab tracked, compared with the frozen v19 and post-freeze v20 estimates. Unofficial and certified results are labeled separately. Pre-release."><style>' + CSS + '</style></head><body>' +
    '<header><h1>2026 Senate results tracker</h1><p>Pre-release for review · official state sources only · unofficial and certified results labeled separately</p></header><main>' +
    '<div class="notice"><strong>How to read this page.</strong> Unofficial returns are partial and change as ballots are counted; they are never treated as final. Errors are computed only from certified results (scores) or from unofficial counts reporting 100% of ballots or precincts (labeled provisional). A recount suspends what depends on the recounted ballots: the whole race in ranked-choice states, only the winner during a Georgia runoff recount. The frozen v19 snapshot is the primary comparison; v20 is a secondary, post-freeze comparison. No result here comes from news projections.</div>' +
    '<div class="grid" id="kpis"></div><h2>Senate seats</h2><div class="card" id="seats"></div>' +
    '<h2>The 15 tracked races</h2><div id="races"></div>' +
    '<h2>Scorecards</h2><div class="card wrap"><table class="rowtbl" id="scores"></table></div><p class="small muted">Signed error = estimate minus result; negative means the estimate was too Republican. Leader right compares the sign of the estimate with the official first-round margin.</p>' +
    '<h2>Pre-registered tests (H1–H4)</h2><div class="card" id="reg"></div>' +
    '<h2>The 20 untracked contests</h2><div class="card wrap"><table class="rowtbl" id="unt"></table></div>' +
    '<h2>Disclosures</h2><div class="card"><ul id="discl"></ul></div>' +
    '<h2>Official sources</h2><div class="card wrap"><table class="rowtbl" id="src"></table></div>' +
    '</main><footer id="foot"></footer><script type="application/json" id="data">' + JSON.stringify(S).replace(/</g, '\\u003c') + '</script><script>' + SCRIPT + '</script></body></html>';
}

function build(opts) {
  const o = opts || {};
  const S = assemble(o);
  const html = render(S);
  const dir = o.outDir || path.join(L.REPO, 'docs', 'results');
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'data', 'results_dashboard.json'), JSON.stringify(S, null, 1));
  return { S, html };
}
module.exports = { assemble, render, build };
if (require.main === module) { const { S } = build(); console.log('built docs/results/index.html (pre-release): ' + S.races.length + ' races; ' + JSON.stringify(S.status_counts) + '; registered tests: ' + S.registered.gate.reason + '; dependencies verified: ' + S.meta.dependencies.files + ' files'); }
