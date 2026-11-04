// Independent reviewer demonstration (synthetic returns only): Maine Round 0 denominator.
// Run from the root of an extracted tracker project:
// node /path/to/TRACKER_1_1_2_MAINE_BLANK_BALLOT_EDGE.js
'use strict';
const path=require('path'),fs=require('fs'),os=require('os');
const L=require(path.resolve(process.cwd(),'results_2026/tracker/lib/results_lib.js'));
const root=L.loadData(),race=root.races.find(x=>x.state==='ME'),src=root.sources.find(x=>x.state==='ME');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maine-blank-edge-'));fs.cpSync(L.DATA,tmp,{recursive:true});
const t='2026-12-01T12:00:00Z';
function report(round, pairs, ts){
 const sum=pairs.reduce((v,x)=>v+x[2],0);
 const b={state:'ME',round,office:'U.S. Senate',reporting_status:'certified',reported_pct:'',reporting_unit:'',authority_status_text:'SYNTHETIC TEST ONLY',report_timestamp_utc:ts,retrieved_at_utc:ts,certification_date:'2026-12-01',authority_name:src.authority,source_url:`https://${src.authority_domains.split(';')[0]}/results`,notes:'SYNTHETIC: 100000 ballots cast, including 5000 blank first-choice ballots',entered_by:'independent-auditor'};
 return pairs.map(([candidate,ballot_party,votes])=>({...b,candidate,ballot_party,votes:String(votes),total_votes:String(sum)}));
}
const d=race.challenger,r=race.republican;
// 100,000 ballots for this contest, 95,000 valid first choices, 5,000 blank first choices.
// Under Maine's majority rule, the D candidate's 48,000 first choices are only 48% of all ballots.
// The tracker has no explicit blank/overvote first-choice field; its 95000 valid vote total passes its validations.
const first=report('first',[[d,'D',48000],[r,'R',42000],['Third candidate','I',5000]],t);
L.appendReturns(first,tmp);
const me=L.compare(L.loadData(tmp)).find(x=>x.state==='ME');
console.log('REAL MAINE THRESHOLD (all 100,000 ballots, blanks included): 48000/100000 = 48%; no first-round majority.');
console.log('TRACKER (95,000 entered candidate votes, 5,000 blanks omitted):',JSON.stringify({winner:me.winner,winner_candidate:me.winner_candidate,winner_basis:me.winner_basis,firstRoundTotal:me.first_round.total}));
if (me.winner !== 'D') throw new Error('Unexpected: tracker did not reproduce denominator issue');
try { L.appendReturns(report('rcv_final',[[d,'D',52000],[r,'R',43000]],'2026-12-02T12:00:00Z'),tmp); console.log('UNEXPECTED: accepted RCV final after false majority'); }
catch(e){console.log('REJECTS potential actual RCV final:',e.message.split('\n')[0]);}
console.log('This is a denominator/data-contract gap; do not use invented blank-as-other values to mask it.');
