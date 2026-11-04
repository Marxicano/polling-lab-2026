'use strict';
const fs=require('fs'),os=require('os'),path=require('path');
// ADAPTED COPY (Claude): only the hard-coded /mnt/data path changed to this project's library; original in chatgpt_1_1_3/.
const L=require('../../lib/results_lib.js');
const base=L.loadData();
const r=base.races.find(x=>x.state==='ME');const source=base.sources.find(x=>x.state==='ME');
const url='https://'+source.authority_domains.split(';')[0]+'/elections';
function dir(){let d=fs.mkdtempSync(path.join(os.tmpdir(),'maine-audit-'));fs.cpSync(L.DATA,d,{recursive:true});return d;}
function rows(d,withDen){
 const names=[[r.challenger,'D',48000],[r.republican,'R',42000],['third contender','I',5000]];
 const baseFields={state:'ME',office:'U.S. Senate',round:'first',reporting_status:'certified',report_timestamp_utc:'2026-11-25T10:00Z',retrieved_at_utc:'2026-11-25T12:00Z',certification_date:'2026-11-25',authority_name:source.authority,source_url:url,authority_status_text:'SYNTHETIC certified return',reported_pct:'',reporting_unit:'',entered_by:'independent review',notes:'NOT A REAL ELECTION RETURN'};
 if(withDen)Object.assign(baseFields,{ballots_cast_for_office:'100000',blank_first_rank:'5000',overvote_first_rank:'0',excluded_first_rank:'0',denominator_source_url:url});
 return names.map(([candidate,ballot_party,votes])=>({...baseFields,candidate,ballot_party,votes:String(votes),total_votes:'95000'}));
}
for(const withDen of [false,true]){
 const d=dir();L.appendReturns(rows(d,withDen),d);const res=L.compare(L.loadData(d)).find(x=>x.state==='ME');console.log(JSON.stringify({withDen,firstRoundMargin:res.first_round.margin,error_v19:res.error_v19,legalDenominator:res.majority_test.denominator,legalMajority:res.majority_test.result,winner:res.winner,winnerBasis:res.winner_basis}));fs.rmSync(d,{recursive:true,force:true});
}
