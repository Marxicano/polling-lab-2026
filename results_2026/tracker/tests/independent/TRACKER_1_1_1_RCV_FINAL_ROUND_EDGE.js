// Independent reviewer regression: official final RCV report must have exactly two continuing candidates.
// Copy to results_2026/tracker/tests/independent/ and run from the project root:
//   node results_2026/tracker/tests/independent/TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('../../lib/results_lib.js');
const B = L.loadData();
const R = Object.fromEntries(B.races.map(x => [x.state,x]));
const S = Object.fromEntries(B.sources.map(x => [x.state,x]));
function fresh() { const d=fs.mkdtempSync(path.join(os.tmpdir(),'rcv-final-edge-')); fs.cpSync(L.DATA,d,{recursive:true});return d; }
function rep(st,round,t,cands) {
 const race=R[st], total=cands.reduce((s,x)=>s+x[2],0);
 const b={state:st,round,reporting_status:'certified',reported_pct:'',reporting_unit:'',authority_status_text:'SYNTHETIC TEST',report_timestamp_utc:t,retrieved_at_utc:t,certification_date:'2026-11-30',authority_name:S[st].authority,source_url:'https://'+S[st].authority_domains.split(';')[0]+'/results',notes:'SYNTHETIC',entered_by:'independent-test'};
 return cands.map(([n,p,v])=>({...b,candidate:n==='CH'?race.challenger:n==='REP'?race.republican:n,ballot_party:n==='CH'?race.challenger_party:n==='REP'?'R':p,votes:String(v),total_votes:String(total)}));
}
let failed=0;
for (const st of ['AK','ME']) {
 const d=fresh();
 L.appendReturns(rep(st,'first','2026-11-30T01:00Z',[['CH','',400],['REP','',350],['Third candidate','I',250]]),d);
 // The following is an INTERMEDIATE RCV round, not a legally complete final tabulation.
 try {
  L.appendReturns(rep(st,'rcv_final','2026-12-01T01:00Z',[['CH','',200],['REP','',250],['Third candidate','I',550]]),d);
  console.log('FAIL',st,'accepted a purported final RCV round containing THREE remaining candidates; reported winner='+L.compare(L.loadData(d)).find(x=>x.state===st).winner_candidate);failed++;
 } catch(e) { console.log('PASS',st,'rejects three-candidate purported final RCV round:',e.message.split('\n')[0]); }
 const d2=fresh();
 L.appendReturns(rep(st,'first','2026-11-30T01:00Z',[['CH','',400],['REP','',350],['Third candidate','I',250]]),d2);
 try {
  L.appendReturns(rep(st,'rcv_final','2026-12-01T01:00Z',[['REP','',450],['Third candidate','I',550]]),d2);
  const w=L.compare(L.loadData(d2)).find(x=>x.state===st);
  if(w.winner!=='I'){console.log('FAIL',st,'two-finalist winner incorrect',w.winner);failed++;}else console.log('PASS',st,'correct two-finalist ranked-choice result: independent wins');
 }catch(e){console.log('FAIL',st,'rejected valid two-finalist result:',e.message);failed++;}
}
process.exitCode=failed?1:0;
