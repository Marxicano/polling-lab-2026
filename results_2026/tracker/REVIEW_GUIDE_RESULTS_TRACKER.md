# Review guide for ChatGPT and Kimi (tracker 1.1.4)

Every finding in ChatGPT's Nov 3 review has a regression test in `tests/test_review_regressions.js` that failed on tracker 1.0 (see `TEST_RESULTS_BEFORE_FIX_v1.0.txt`: 21 of 22 checks failed) and passes on 1.1.

| Review item | Fix | Test |
|---|---|---|
| 1. Incomplete certified report scored | Reports validated as units: both named candidates exactly once with their parties, unique names, safe whole numbers, votes sum exactly to total, shared metadata, no split or extended reports; stored reports re-validated on load | B1a-B1g |
| 2. Untracked overrides unvalidated | Legacy override file refused; validated, hash-chained `untracked_results.csv` limited to the 20 untracked states, authority domains, certified statuses, no contradictions | B2a, B2b |
| 3. Recount ignored after certification | Explicit lifecycle: recount suspends until `recount_certified`; ordering by timestamp | B3 |
| 4. Live repo lacks runtime inputs | 60 byte-identical vendored dependencies; tracker needs nothing else | B4 |
| 5. Independents counted as Democrats | Party (41 D / 42 R / 2 I) and caucus (43 / 42) kept separate; Osborn unaligned unless recorded; frozen 53/47 labeled caucus-equivalent | B5 |
| 6. Incomplete fingerprinting | Every load verifies all 60 dependencies, pinned lists, anchors, no extra files, and checkout copies | B6a-B6c |
| A1 Pending hosts allowed | Separate pending list; host usable only after a recorded authority link | A1 |
| A2 Scoring not one-time | `record_registered_scoring.js` writes once with input fingerprints; dashboard only displays it; later changes flagged as revisions | A2 |
| A3 Unanchored chain | Wording corrected; `print_chain_heads.js` for dated commits | A3 |
| A4 Completeness semantics | Reporting unit and the authority's wording required; provisional label names the unit | A4 |
| A5 RCV comparability | Disclosed on the page and in the conventions | (text) |
| A6 Untracked contests | Each needs a certified record; control withheld until all 35 confirmed | A6 |
| A7 Mississippi wording | Sponsor (SPLC Action Fund, two polls) separated from firm alignment (Data for Progress) | A7 |
| 320px overflow | Small-screen table rule | A8 |

Please check in particular:
1. Run `node results_2026/tracker/tests/run_tracker_tests.js` in a fresh clone of the live repository after copying in `results_2026/tracker/` from the patch. Claude could not clone GitHub; test B4 simulates the layout ChatGPT reported.
2. The authority domains for all 35 states (from the list of official state results sites) and the pending hosts.
3. The conventions change from 1.0 to 1.1 (both written before any results), including the status lifecycle.
4. Whether the "never overwritten" record and the Jan 15, 2027 fallback are the right safeguards.

Known limits: untracked authority domains are from a directory, not each authority's own results page; the hash chain is tamper-evident only if heads are published; the tracker has not been run on real returns.

## 1.1.1: ChatGPT's review of tracker 1.1

ChatGPT's three edge tests are included unchanged in `tests/independent/` and run in both test runners. On 1.1 all three failed; on 1.1.1 all pass (`TEST_RESULTS_BEFORE_FIX_v1.1.txt`, `TEST_RESULTS_v1.1.1.txt`).

| Review item | Change | Tests |
|---|---|---|
| B7 winner from the two-candidate margin | `officialWinner()` picks the winner from all candidates in the certified deciding round; majority, runoff and ranked-choice rules applied; aggregate rows never win; ties and undeterminable cases give no winner; the polling error is unchanged | W1-W9, ChatGPT 1-2 |
| B7 validation | Party codes validated; one aggregate row at most; runoff limited to the top two November candidates and only without a November majority; final ranked-choice round only without a first-round majority, first-round candidates only, no aggregates, must be decisive | W2, W6, W7, W8 |
| A9 recount scope | Scope follows the ballots: any recount suspends a ranked-choice race (same ballots); a Georgia runoff recount (separate ballots) withholds only the winner | A9a, A9b, ChatGPT 3 |
| Conventions | 1.1.1 states the winner rules, party codes and recount scope; the Jan 15, 2027 fallback is labeled an administrative cutoff; 1.1 and 1.0 archived byte-for-byte | A9c |

One rule choice for review: the recount scope. Race-level suspension for every recount would be simpler; it would also withhold Georgia's certified November score during a runoff recount even though the runoff uses different ballots.

## 1.1.2: ChatGPT's review of tracker 1.1.1
| Item | Change | Tests |
|---|---|---|
| Three continuing candidates accepted as `rcv_final` | Exactly two required; majority and first-round membership checks kept | F1-AK, F1-ME, reconstructed RCV test 1 and 3 |
| Fixtures | Two-finalist fixtures in W1, W7, A9a and the running copy of ChatGPT's 1.1 edge tests; original archived | F5 |
| Maine Round 0 vs Round 1 | Data-entry guide and human verification checklist | F3 |
| Scope | Conventions, static data, vendored files and anchors unchanged | F4 |

Please run ChatGPT's original `TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE.js` as well: it was described in the review but not attached, so `tests/independent/TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE_reconstructed.js` implements its four described checks. Not changed (needs a rule decision): if Maine's Round 0 shows a candidate above 50% but the Secretary of State still tabulates, the tracker refuses the final round.

## 1.1.3: ChatGPT's review of tracker 1.1.2
| Item | Change | Tests |
|---|---|---|
| Maine majority on the candidate-vote denominator | Legal test on all ballots cast (blank and overvoted first rankings included), from recorded and reconciled counts with an official source | M1, M3, M5, ChatGPT's demonstration |
| Missing counts | Winner withheld for review; final round refused while a candidate exceeds half of the candidate votes | M2, M4 |
| Alaska audit | Statute uses active ballots (AS 15.15.350(d)); unchanged behavior, now stated | M6 |
| Georgia | Votes cast for the office; unchanged | M7 |
| Polling error | Candidate-vote denominator unchanged; conventions 1.1.3 state both | M1, M8 |

ChatGPT's demonstration script is included unchanged. It was written to show the bug, so it now ends with "Unexpected: tracker did not reproduce denominator issue"; `run_maine_blank_ballot_demo.js` treats that as the pass condition. Please confirm the Georgia reading (votes cast for the office) and the Alaska statute reading.

## 1.1.4: missing Maine denominator (Kimi vs 1.1.3)
See DECISION_1_1_4.md. Tests: D1-D6 in test_review_1_1_4.js and Kimi's 13 checks (tests/independent/TRACKER_1_1_3_MAINE_ROUND0_REGRESSION_adapted.js; original in tests/independent/kimi/). The adapted copy maps Kimi's single majority_denominator field onto the tracker's ballots-cast fields and widens three error-message patterns; no expectation changed. Please confirm the statutory reading and that refusing contradicting late counts (D3) is the right escalation.
