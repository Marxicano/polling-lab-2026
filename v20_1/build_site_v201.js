// Builds docs/v20-1/index.html (separate page; the v20 dashboard at docs/index.html is not touched).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { load, ROOT } = require('./run_v201.js');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
function build(opts) {
  const o = opts || {};
  const { out } = o.loaded || load();
  const pubV20 = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'data', 'site_v20.json'), 'utf8'));
  const site = {
    meta: { version: 'v20.1 methodology review (post-freeze)', built_at_utc: (o.builtAt || new Date().toISOString()).replace('T', ' ').slice(0, 16),
      v19_snapshot_sha256: sha('v19_frozen/data/snapshot_2026-11-02.csv'), v20_prereg_sha256: sha('v20/preregistration_mike.json'), v20_engine_sha256: sha('v20/engine_v20.js'),
      v201_engine_sha256: sha('v20_1/engine_v201.js'), exploratory_registry_sha256: sha('v20_1/exploratory_registry_v201.json'), kimi_report_sha256: sha('reviews/kimi/INDEPENDENT_METHODOLOGY_AUDIT_2026-11-02.md'),
      v20_central_p_dem_control_published: pubV20.seats.variants.find((v) => v.key === 'central').p_dem_control },
    assessment: out.v201_assessment, redbox: out.v201_redbox_waves, calibration: out.v201_calibration_review,
    rolling: out.v201_rolling_origin, correlation: out.v201_correlation_sensitivity.map((r) => Object.assign({}, r, { state_p_opp: undefined })),
    recall: out.v201_recall_scenarios.map((r) => Object.assign({}, r, { margins: undefined })), metadata: out.v201_metadata_summary, neff: out.v201_neff_sensitivity, florida: out.v201_fl_official,
    registry: JSON.parse(fs.readFileSync(path.join(__dirname, 'exploratory_registry_v201.json'), 'utf8')),
    not_validatable: [
      'Hierarchical regional, office, state, contest and late-movement error scales: need a contest-level historical dataset of election-eve averages and certified results with information freezes (not in the repository).',
      'Calibrated control probabilities: the cycle-level series has five points; proper-score calibration of chamber probabilities needs many contests across cycles.',
      'A 1-2 point national horse-race effect of recalled-vote weighting: requires respondent microdata and State Navigate’s private cells.',
      'RedBox’s turnout model and wave-1 methodology from the live URL: the page now documents wave 2; only time-stamped earlier reads exist.',
      'Likely-voter screen backtests S0-S4: need respondent-level data and validated turnout.',
      'Design effects for 446 polls that publish no effective n.',
    ],
  };
  const css = fs.readFileSync(path.join(ROOT, 'v20', 'site_template.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Polling Lab 2026 — v20.1 methodology review</title><style>' + css + '</style></head><body>' +
  '<header><div class="muted">Polling Lab 2026 · v20.1 · post-freeze methodology review</div><h1>Kimi’s audit, checked against v20’s code</h1>' +
  '<div class="banner"><strong>Nothing published is replaced.</strong> The v19 snapshot (<code id="h19"></code>), the v20 election-eve analysis and its H1-H4 pre-registration (<code id="hpr"></code>) are unchanged; v20’s central Democratic-control figure stays <span id="pc"></span> (experimental). This page adds corrections of labels and metadata, and diagnostics. <a href="../index.html">Open the v20 dashboard</a>.</div>' +
  '<nav class="toc"><a href="#a">Assessment</a><a href="#rb">RedBox waves</a><a href="#cal">Calibration inputs</a><a href="#ro">Backtest</a><a href="#cor">Correlation</a><a href="#rec">Recall scenario</a><a href="#neff">Effective n</a><a href="#fl">Florida ballots</a><a href="#reg">Exploratory registry</a><a href="#nv">Not validatable</a></nav></header><main>' +
  '<h2 id="a">Recommendation by recommendation</h2><div class="wrap"><table id="tA"></table></div>' +
  '<h2 id="rb">Two RedBox Florida surveys, kept separate</h2><div class="wrap"><table id="tRB"></table></div><div class="wrap" style="margin-top:8px"><table id="tRBc"></table></div>' +
  '<h2 id="cal">Calibration inputs by estimator</h2><p class="muted">v20’s high and midterm-only settings mix estimators; they are relabeled here, with the same numbers.</p><div class="wrap"><table id="tCal"></table></div>' +
  '<h2 id="ro">Rolling-origin backtest (E1, exploratory)</h2><p class="muted">Each test cycle uses only earlier cycles. Lower CRPS and higher log score are better. Four folds, two of them midterms.</p><div class="wrap"><table id="tRO"></table></div><details><summary>Every fold</summary><div class="wrap"><table id="tROf"></table></div></details>' +
  '<h2 id="cor">Regional correlation diagnostic (uncalibrated)</h2><p class="muted">Each state’s total uncertainty is held at v20’s value; only the share shared within Census regions changes.</p><div class="wrap"><table id="tCor"></table></div>' +
  '<h2 id="rec">Recall-weighting scenario (E2, hypothetical)</h2><p class="muted">Only polls from pollsters documented to weight on recalled 2024 vote move, toward the challenger, by kappa x b.</p><div class="wrap"><table id="tRec"></table></div>' +
  '<h2 id="neff">Effective sample sizes</h2><div class="wrap"><table id="tMeta"></table></div><div class="wrap" style="margin-top:8px"><table id="tNeff"></table></div>' +
  '<h2 id="fl">Florida ballots by party registration, Nov 2 08:09 ET (context only)</h2><div class="wrap"><table id="tFL"></table></div>' +
  '<h2 id="reg">Exploratory registry</h2><p class="muted">SHA-256 <code id="hreg"></code>. These are not part of H1-H4.</p><div class="wrap"><table id="tReg"></table></div>' +
  '<h2 id="nv">What available data cannot validate</h2><ul id="nvL"></ul></main><footer><p id="foot"></p></footer>' +
  '<script type="application/json" id="d">' + JSON.stringify(site).replace(/</g, '\\u003c') + '</script><script>(function(){var S=JSON.parse(document.getElementById("d").textContent);function e(i){return document.getElementById(i);}function x(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}function T(id,h,rows){e(id).innerHTML="<thead><tr>"+h.map(function(c){return"<th"+(c.l?" class=\\"l\\"":"")+">"+x(c.t||c)+"</th>";}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return"<tr>"+r.map(function(c,i){return"<td"+(h[i]&&h[i].l?" class=\\"l\\"":"")+">"+x(c)+"</td>";}).join("")+"</tr>";}).join("")+"</tbody>";}function p(v){return v==null?"–":Math.round(v*100)+"%";}' +
  'e("h19").textContent=S.meta.v19_snapshot_sha256;e("hpr").textContent=S.meta.v20_prereg_sha256;e("pc").textContent=p(S.meta.v20_central_p_dem_control_published);e("hreg").textContent=S.meta.exploratory_registry_sha256;' +
  'T("tA",[{t:"ID"},{t:"Recommendation",l:1},{t:"v20 status"},{t:"Evidence in v20",l:1},{t:"v20.1 action",l:1},{t:"Validation",l:1}],S.assessment.map(function(r){return[r.id,r.recommendation,r.v20_status,r.v20_evidence,r.v201_action,r.validation_status];}));' +
  'T("tRB",[{t:"Wave"},"Fieldwork","Released","Raw n","Effective n","Design effect","Moody margin",{t:"Weighting targets",l:1},{t:"Evidence",l:1},{t:"Caveat",l:1}],S.redbox.filter(function(r){return r.kind==="wave";}).map(function(r){return[r.wave_id,r.field,r.released,r.raw_n,r.effective_n,r.design_effect,r.moody_margin,r.weighting_targets,r.targets_evidence,r.caveat];}));' +
  'T("tRBc",[{t:"Check",l:1},"Value","Expected","OK"],S.redbox.filter(function(r){return r.kind==="check";}).map(function(r){return[r.check,r.value,r.expected,r.ok?"yes":"NO"];}));' +
  'T("tCal",[{t:"Item"},{t:"Estimator",l:1},"Cycle","Value",{t:"v20.1 label",l:1}],S.calibration.map(function(r){return[r.key,r.group,r.cycle||"",r.kind==="input"?r.signed_error:r.value,r.v201_label];}));' +
  'T("tRO",[{t:"Rule"},"Folds","MAE","RMSE","Mean log score (t4)","Mean CRPS","Set"],S.rolling.filter(function(r){return /summary/.test(r.kind);}).map(function(r){return[r.rule,r.folds,r.mae,r.rmse,r.mean_log_score_t4,r.mean_crps_normal,r.kind==="summary"?"all 4 folds":"2 midterm folds"];}));' +
  'T("tROf",[{t:"Rule"},"Test","Train","Mean","SD","Error","Residual","In 80%","In 95%","CRPS"],S.rolling.filter(function(r){return r.kind==="fold";}).map(function(r){return[r.rule,r.test_cycle,r.train_cycles,r.mean_used,r.sigma,r.error,r.residual,r.inside80?"yes":"no",r.inside95?"yes":"no",r.crps_normal];}));' +
  'T("tCor",[{t:"Setting",l:1},"D control","R control","No majority","D seats 5th–50th–95th"],S.correlation.map(function(r){return[r.label,p(r.p_dem_control),p(r.p_rep_control),p(r.p_no_majority),r.dem_seats_p05+"–"+r.dem_seats_p50+"–"+r.dem_seats_p95];}));' +
  'T("tRec",[{t:"Scenario",l:1},"Shift","Window polls moved","Mean state change","Largest change","D seats","R seats","Status"],S.recall.map(function(r){return[r.label,r.shift_points,r.window_polls_shifted+" of "+r.window_polls_total,r.mean_state_change,r.max_state_change,r.dem_seats,r.rep_seats,r.status];}));' +
  'T("tMeta",[{t:"Included polls",l:1},"Count"],S.metadata.map(function(r){return[r.label,r.n];}));' +
  'T("tNeff",[{t:"State"},"Window polls","With published effective n","Mean gap MOE (raw n)","Mean gap MOE (design effect 1.5)","Weighted avg (v20)","Weighted avg (deff 1.5)"],S.neff.map(function(r){return[r.state,r.polls_window,r.published_neff_in_window,r.mean_moe_v19_assumption,r.mean_moe_deff_1_5,r.weighted_v20,r.weighted_deff_1_5];}));' +
  'T("tFL",[{t:"Category",l:1},"Republican","Democratic","NPA","Other","Total","R share","D share"],S.florida.map(function(r){return[r.category,r.republican.toLocaleString(),r.democratic.toLocaleString(),r.npa.toLocaleString(),r.other.toLocaleString(),r.total.toLocaleString(),r.rep_share,r.dem_share];}));' +
  'T("tReg",[{t:"ID"},{t:"What",l:1},{t:"Status",l:1},{t:"Use",l:1}],S.registry.analyses.map(function(r){return[r.id,r.what,r.status,r.decision_use];}));' +
  'e("nvL").innerHTML=S.not_validatable.map(function(t){return"<li>"+x(t)+"</li>";}).join("");e("foot").textContent="Polling Lab 2026 v20.1 · built "+S.meta.built_at_utc+" UTC · review-layer engine "+S.meta.v201_engine_sha256.slice(0,12)+"… · Kimi report "+S.meta.kimi_report_sha256.slice(0,12)+"…";})();</script></body></html>';
  const dir = o.docsDir || path.join(ROOT, 'docs', 'v20-1');
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'data', 'site_v201.json'), JSON.stringify(site, null, 1));
  return { site, html };
}
module.exports = { build };
if (require.main === module) { const { site } = build(); console.log('built docs/v20-1/index.html; v20 central (published) ' + site.meta.v20_central_p_dem_control_published); }
