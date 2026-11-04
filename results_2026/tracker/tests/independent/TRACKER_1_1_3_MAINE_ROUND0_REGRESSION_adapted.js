// ADAPTED COPY (Claude, tracker 1.1.4) of Kimi's TRACKER_1_1_3_MAINE_ROUND0_REGRESSION (original in kimi/, unchanged).
// Kimi's draft used one field, majority_denominator. The tracker (approved by ChatGPT in its 1.1.3 review) records the
// same legal denominator as ballots_cast_for_office with its official breakdown and source. Adaptations, and nothing else:
//  1. report(): majority_denominator N is entered as ballots_cast_for_office N, blank_first_rank N - candidate votes,
//     overvote and excluded 0, denominator_source_url = source_url; malformed or partial values are passed through as-is.
//  2. Rejection patterns also accept the tracker's wording ("ballots cast", "whole numbers", "disagree", "reconcile").
//  3. The v19 snapshot is found at data/ (GitHub layout) or v19_frozen/data/ (complete ZIP layout).
//  4. The closing count prints the 13 checks the file defines (Kimi's original prints /12).
// All 13 expectations, including Kimi's test 4 (an official final round accepted without the denominator), are unchanged.
// Polling Lab results tracker 1.1.3 — Maine Round 0 denominator regression.
// PRE-RELEASE; SYNTHETIC RETURNS ONLY. No real election results are used.
// Save as results_2026/tracker/tests/independent/TRACKER_1_1_3_MAINE_ROUND0_REGRESSION.js
// in the complete tracker 1.1.2 project, apply the minimal fix, then run from project root:
//   node results_2026/tracker/tests/independent/TRACKER_1_1_3_MAINE_ROUND0_REGRESSION.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const L = require('../../lib/results_lib.js');
const B = L.loadData();
const race = B.races.find(x => x.state === 'ME');
const src = B.sources.find(x => x.state === 'ME');
let passed = 0;

function fresh() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'me-round0-denominator-'));
  fs.cpSync(L.DATA, d, { recursive: true });
  return d;
}
function report(round, pairs, ts, denominator) {
  const candidateVoteTotal = pairs.reduce((s, x) => s + x[2], 0);
  const base = {
    state: 'ME', round, office: 'U.S. Senate', reporting_status: 'certified',
    reported_pct: '', reporting_unit: '', authority_status_text: 'SYNTHETIC TEST ONLY',
    report_timestamp_utc: ts, retrieved_at_utc: ts, certification_date: '2026-12-01',
    authority_name: src.authority,
    source_url: `https://${src.authority_domains.split(';')[0]}/results`,
    notes: 'SYNTHETIC ONLY; official-source fields are simulated for regression',
    entered_by: 'independent-auditor'
  };
  return pairs.map(([candidate, ballotParty, votes]) => {
    const row = { ...base, candidate, ballot_party: ballotParty,
      votes: String(votes), total_votes: String(candidateVoteTotal) };
    if (denominator !== undefined) {
      const n = String(denominator);
      Object.assign(row, { ballots_cast_for_office: n, blank_first_rank: /^\d+$/.test(n) ? String(Number(n) - candidateVoteTotal) : n, overvote_first_rank: '0', excluded_first_rank: '0', denominator_source_url: base.source_url });
    }
    return row;
  });
}
function first(pairs, denominator) {
  return report('first', pairs, '2026-12-01T12:00:00Z', denominator);
}
function final(pairs) {
  return report('rcv_final', pairs, '2026-12-02T12:00:00Z');
}
function compare(d) { return L.compare(L.loadData(d)).find(x => x.state === 'ME'); }
function noFirstRoundWinner(x) { assert.ok(!x.winner, `unexpected winner: ${x.winner}`); }
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${passed}: ${name}`); }
  catch (e) { console.error(`FAIL: ${name}\n${e.stack || e}`); process.exitCode = 1; }
}
function rejected(rows, pattern) {
  const d = fresh();
  assert.throws(() => L.appendReturns(rows, d), new RegExp(pattern.source + '|ballots cast|whole numbers|disagree|reconcile', 'i'));
}
const D = race.challenger, R = race.republican;
const edge = [[D,'D',48000],[R,'R',42000],['Third candidate','I',5000]];
const edgeFinal = [[D,'D',52000],[R,'R',43000]];

// 1–2: ChatGPT's exact 48/42/5/5 reproduction, now with the statutory denominator.
test('48/42/5/5: no false Round 0 majority; scoring denominator stays 95,000', () => {
  const d = fresh();
  L.appendReturns(first(edge, 100000), d);
  const x = compare(d);
  noFirstRoundWinner(x);
  assert.equal(Number(x.first_round.total), 95000);
});
test('48/42/5/5: a two-candidate official RCV final is accepted after no majority', () => {
  const d = fresh();
  L.appendReturns(first(edge, 100000), d);
  L.appendReturns(final(edgeFinal), d);
  assert.equal(compare(d).winner, 'D');
});

// 3–4: missing information must fail safe, without breaking no-majority reports.
test('Candidate-vote-only majority without statutory denominator is withheld and flagged', () => {
  const d = fresh();
  L.appendReturns(first(edge), d);
  const x = compare(d);
  noFirstRoundWinner(x);
  assert.match(String(x.winner_basis), /denominator/i);
  assert.match(String(x.winner_basis), /review/i);
});
test('Missing denominator still permits an official two-candidate RCV final', () => {
  const d = fresh();
  L.appendReturns(first(edge), d);
  L.appendReturns(final(edgeFinal), d);
  assert.equal(compare(d).winner, 'D');
});
test('Missing denominator needs no review when no majority is mathematically possible', () => {
  const d = fresh();
  L.appendReturns(first([[D,'D',40000],[R,'R',40000],['Third candidate','I',15000]]), d);
  noFirstRoundWinner(compare(d));
});

// 5–6: positive majority and strict more-than-half boundary.
test('Unambiguous majority: 51,000 of 100,000 ballots elects the Democrat', () => {
  const d = fresh();
  L.appendReturns(first([[D,'D',51000],[R,'R',39000],['Third candidate','I',5000]], 100000), d);
  const x = compare(d);
  assert.equal(x.winner, 'D');
  assert.equal(x.winner_candidate, D);
  assert.equal(Number(x.first_round.total), 95000);
});
test('Exactly 50,000 of 100,000 ballots is not a majority', () => {
  const d = fresh();
  L.appendReturns(first([[D,'D',50000],[R,'R',40000],['Third candidate','I',5000]], 100000), d);
  noFirstRoundWinner(compare(d));
});

// 7–10: data-contract checks; blanks/overvotes are never inserted as OTH candidates.
test('Statutory denominator below candidate-vote total is rejected', () => {
  rejected(first(edge, 94999), /denominator/i);
});
test('Inconsistent denominators across candidate rows are rejected', () => {
  const rows = first(edge, 100000);
  rows[1].ballots_cast_for_office = '99999'; rows[1].blank_first_rank = '4999';
  rejected(rows, /denominator/i);
});
test('Partially missing denominators across candidate rows are rejected', () => {
  const rows = first(edge, 100000);
  ['ballots_cast_for_office', 'blank_first_rank', 'overvote_first_rank', 'excluded_first_rank', 'denominator_source_url'].forEach((k) => { delete rows[1][k]; });
  rejected(rows, /denominator/i);
});
test('Malformed statutory denominator is rejected', () => {
  rejected(first(edge, '100000.5'), /denominator/i);
});

// 11–12: immutable research inputs, checked directly from the clean project root.
for (const [file, expected] of Object.entries({
  'data/snapshot_2026-11-02.csv': '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461',
  'v20/preregistration_mike.json': '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af'
})) {
  test(`Immutable input unchanged: ${file}`, () => {
    const p = fs.existsSync(path.resolve(process.cwd(), file)) ? file : file.replace(/^data\//, 'v19_frozen/data/');
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(process.cwd(), p))).digest('hex');
    assert.equal(actual, expected);
  });
}
console.log(`${passed}/13 tracker integration checks passed`); // Kimi's original prints /12 but defines 13 checks
