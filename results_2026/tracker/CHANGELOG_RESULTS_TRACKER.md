# Changelog

## Results tracker 1.0 — Nov 2, 2026 (before any results)
New, separate folder `results_2026/tracker/` and page `docs/results/`. No change to v19, v20, v20.1, the explorer, the pre-registration or ChatGPT's scoring plan.

## Results tracker 1.1 — Nov 3, 2026 (before any returns; pre-release, not production-ready)
Responds to ChatGPT's independent tracker review of Nov 3. No change to v19, v20, v20.1, the explorer, the pre-registration or the scoring plan.
- Regression tests for every review item written first; 21 of 22 failed on 1.0 (TEST_RESULTS_BEFORE_FIX_v1.0.txt) and all pass on 1.1.
- Atomic report validation; status lifecycle with recount suspension; reporting unit and authority wording.
- Validated, hash-chained untracked results and domain verifications; legacy override file refused.
- Party and caucus seat accounting; control withheld until all 35 contests are confirmed.
- 60 vendored, byte-identical dependencies verified on every load; runs from a checkout with no other inputs.
- One-time registered scoring record with input fingerprints; the dashboard only displays it.
- Conventions 1.1 (v1.0 archived byte-for-byte); static data pinned in TRACKER_STATIC.json.
- Disclosures: Mississippi sponsorship vs alignment, caucus-equivalent frozen label, ranked-choice comparability, chain anchoring.

## Results tracker 1.1.1 — Nov 3, 2026 (pre-release, not production-ready)
Responds to ChatGPT's independent review of 1.1. No change to v19, v20, v20.1, the H1-H4 pre-registration, the vendored files or the explorer.
- Winner selection from all candidates in the certified deciding round (B7); validated party codes, aggregate rows, runoff pairing and decisive final ranked-choice rounds.
- Recount scope follows the ballots: whole race in ranked-choice states; winner only during a Georgia runoff recount (A9).
- Conventions 1.1.1 (1.1 archived byte-for-byte); static manifest re-pinned.
- Dashboard shows the winning candidate and party, and round leaders for final and runoff rounds.
- Tests: ChatGPT's three edge tests (unchanged) and 13 new checks, written and run against 1.1 first; existing tracker test helper updated so final and runoff rounds list individual candidates only.

## Results tracker 1.1.2 — Nov 3, 2026 (pre-release, not production-ready)
Responds to ChatGPT's independent review of 1.1.1, which approved the recount-scope rule. No change to v19, v20, v20.1, the H1-H4 pre-registration, the vendored files, the explorer, the conventions (still 1.1.1) or the static data.
- A final ranked-choice round must list exactly two continuing candidates (was: at least two).
- Synthetic final-round fixtures moved to lawful two-finalist results: Claude's W1, W7 and A9a, and the running copy of ChatGPT's 1.1 edge tests (its original is archived byte-for-byte in tests/independent/original/).
- Data-entry guide: Maine Round 0 versus RCV Round 1, Alaska first-choice totals, a known limitation near 50%, the Georgia runoff replacement exception, and a human verification checklist.
- Tests: new test_review_1_1_2.js (7 checks) and a reconstruction of ChatGPT's RCV final-round test (its file was described but not attached), both run against 1.1.1 first.

## Results tracker 1.1.3 — Nov 3, 2026 (pre-release, not production-ready)
Responds to ChatGPT's review of 1.1.2 (Maine majority denominator). No change to v19, v20, v20.1, the H1-H4 pre-registration, the vendored files, the explorer or the registered polling-error definition.
- First-round reports can carry ballots_cast_for_office, blank_first_rank, overvote_first_rank, excluded_first_rank and denominator_source_url; they must reconcile exactly and cite an official page.
- State-specific legal majority test (Maine: all ballots cast, 21-A M.R.S. §723-A(2); Alaska: active ballots, AS 15.15.350(d); Georgia: votes cast), used for first-round winners and for accepting final rounds; reported on each race. The polling margin and error keep the candidate-vote denominator.
- Maine without the counts: winner withheld for human review and final rounds refused while a candidate exceeds half of the candidate votes.
- Conventions 1.1.3 (1.1.1 archived byte-for-byte); static manifest re-pinned; empty returns-log header and template extended.
- Tests: test_review_1_1_3.js (8 checks) and ChatGPT's two scripts, both unchanged (the Maine one via a wrapper because it was written to demonstrate the bug), all run against 1.1.2 first. Two earlier checks that pinned the 1.1.1 conventions as active now accept the archived copy.

## Results tracker 1.1.4 — Nov 3, 2026 (pre-release, not production-ready)
Resolves the difference between Kimi's proposed test and 1.1.3. No change to v19, v20, v20.1, the H1-H4 pre-registration, the vendored files, the explorer or the polling-error definition.
- Maine, legal denominator missing: the first-round winner is still withheld; an official final ranked-choice round is now accepted (was: refused) and, when certified, decides the winner, flagged until the Round 0 counts are recorded.
- A recorded majority still refuses a final round; a first-round report whose recorded counts show a majority is refused once a final round exists (stop and escalate); a final round alongside a recorded majority is shown as a discrepancy, never a winner.
- Conventions 1.1.4 (only the missing-denominator rule; 1.1.3 archived byte-for-byte); static manifest re-pinned.
- Tests: test_review_1_1_4.js (6 checks; 4 failed on 1.1.3); Kimi's regression (adapted field names only, 13 checks; 2 failed on 1.1.3, one for wording); 1.1.3 check M2 updated to the new rule.
