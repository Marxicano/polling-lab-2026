# Tracker 1.1.3 — Maine Round 0 denominator minimal fix

**Status:** pre-release; synthetic regression inputs only. No real election results are entered. No polling prediction or H1–H4 definition is changed.

## Legal and scoring denominators are different quantities

Maine's initial ranked-choice majority test is whether a candidate has more than 50% of **all ballots cast for the office**, including ballots with a blank first ranking, a first-ranking overvote, or a first ranking for an excluded candidate. The Secretary of State distinguishes that election-night tally as **Round 0** from the subsequent tabulation's **Round 1**.

- [Maine Revised Statutes, 21-A §723-A(2)](https://legislature.maine.gov/legis/statutes/21-A/title21-Asec723-A.html)
- [Maine Secretary of State RCV FAQ](https://www.maine.gov/sos/elections-voting/ranked-choice-voting-frequently-asked-questions)
- [Maine Secretary of State RCV glossary](https://www.maine.gov/sos/elections-voting/resources-for-ranked-choice-voting)

The pre-registered polling-error calculation remains unchanged. It continues to use the stated candidate-vote/scoring denominator. The statutory ballots-cast denominator is used **only** for Maine's initial majority determination.

## Minimal data-contract change

Add one report-level field, repeated identically on every candidate row:

- `total_votes` — existing candidate-vote total, including the tracker's documented OTH/write-in aggregate; retain for scoring and reconciliation.
- `majority_denominator` — official Maine Round 0 ballots cast for the office, including blank, overvoted, and excluded-candidate first choices; use only for the initial legal majority test.

The existing `authority_name`, `source_url`, report timestamp, and certification fields provide the report-level provenance. Do not insert blank or overvoted ballots into `OTH`. If the authority does not publish enough information to establish `majority_denominator`, leave it blank; do not infer it from candidate votes.

## Minimal code change

1. Preserve `majority_denominator` through report ingestion, storage, and reload.
2. In `validateReport()`, call `assessMaineRound0(reportRows)` only for Maine `round === 'first'`. Invalid supplied values and row inconsistencies are rejected. A completely missing denominator is accepted but cannot support a positive majority declaration.
3. In `officialWinner()` / `compare()`, replace only Maine's initial candidate-vote majority branch with the helper's three-way decision:
   - `majority`: declare the existing unique leader using `2 * leaderVotes > majority_denominator`.
   - `no_majority`: declare no initial winner.
   - `review`: declare no initial winner and set `winner_basis` to `HUMAN REVIEW: Maine Round 0 majority_denominator unavailable; no first-round majority inferred`.
4. Leave every non-Maine branch, Maine `rcv_final` handling, scoring calculation, frozen data file, and H1–H4 file unchanged.

The supplied helper implements the contract. Only local variable names and existing return-object plumbing should need adaptation in `results_lib.js`.

### Fail-safe missing-data rule

A missing denominator does not always create uncertainty about the initial outcome. If

```text
2 * leaderVotes <= candidateVoteTotal
```

then no majority is mathematically possible because blank/overvoted ballots can only increase the legal denominator. If the leader exceeds half the candidate-vote total but the statutory denominator is missing, the tracker must withhold the initial winner and flag review rather than silently setting `majority_denominator = total_votes`.

This preserves the existing final-round regressions whose first-round leaders have only 400 of 1,000 candidate votes, while closing ChatGPT's false-majority case.

## Regression files

- `TRACKER_1_1_3_maine_round0_majority.txt`: helper source; save as `maine_round0_majority.js` for the contract test, or as `results_2026/tracker/lib/maine_round0_majority.js` for tracker integration.
- `TRACKER_1_1_3_maine_round0_majority_tests.txt`: standalone contract tests; save beside the helper as `test_maine_round0_majority.js` and run `node test_maine_round0_majority.js`.
- `TRACKER_1_1_3_MAINE_ROUND0_REGRESSION.txt`: 12 tracker-level checks; save as `results_2026/tracker/tests/independent/TRACKER_1_1_3_MAINE_ROUND0_REGRESSION.js` and run from the complete project root.

The new integration regression covers ChatGPT's exact 48/42/5/5 example, acceptance of a subsequent two-candidate RCV final, missing-denominator review behavior, an explicit majority, the exact-50% boundary, malformed/inconsistent inputs, candidate-vote reconciliation, and SHA-256 checks for the frozen prediction and H1–H4 files. The original final-round regression should also be rerun unchanged.

## Test output actually obtained

The standalone denominator helper and its contract tests were executed with Node.js v20.20.2:

```text
PASS 1: ChatGPT 48/42/5/5 case: 48,000 is not a majority of 100,000 ballots
PASS 2: Same candidate-vote-only majority without the statutory denominator goes to review
PASS 3: Unambiguous Round 0 majority: 51,000 of 100,000 passes
PASS 4: Exactly 50,000 of 100,000 is not more than 50%
PASS 5: Missing denominator needs no review when no majority is mathematically possible
PASS 6: Statutory denominator below the candidate-vote total is rejected
PASS 7: Inconsistent denominators across candidate rows are rejected
PASS 8: Partially missing denominators are rejected
PASS 9: Candidate-vote reconciliation remains enforced
PASS 10: Malformed and noninteger statutory denominators are rejected
10/10 denominator contract checks passed
```

The 12-check tracker integration regression passed `node --check`. Its integrated execution is **not claimed**: the review ZIP contains only ChatGPT's audit and two regression scripts, not `results_lib.js`, the 1.1.2 schema/storage files, or the full tracker project. The public repository history likewise contains no tracker source.

The immutable inputs in a clean public checkout were independently hashed and match the registered values:

```text
7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461  data/snapshot_2026-11-02.csv
15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af  v20/preregistration_mike.json
```

ChatGPT's previously reported tracker and original four-case passes are not represented as rerun here. A full integrated test pass requires the complete reviewed 1.1.2 project. The tracker remains pre-release.
