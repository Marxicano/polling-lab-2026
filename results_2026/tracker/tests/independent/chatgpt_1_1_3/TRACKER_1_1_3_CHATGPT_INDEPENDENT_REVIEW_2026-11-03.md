# Polling Lab results tracker 1.1.3 — ChatGPT independent review

Date: November 3, 2026. Status: **conditional approval of Maine denominator implementation; not a release authorization**. No official result rows were created or imported during this review.

## Basis and verification

- Inspected the user-supplied `polling_lab_results_tracker_1_1_3_patch (1).zip`, `TRACKER_1_1_3_TEST_RESULTS (1).txt`, and the prior independent 1.1.2 review archive. The patch ZIP passes CRC validation.
- All **26 file after-images** listed in the patch's own fingerprint manifest match their SHA-256 hashes (the 27th ZIP entry is the manifest itself). The original 1.1.2 **before-images cannot be verified** because the 1.1.2 base ZIP was not among the files supplied in this branch.
- Overlaid 1.1.3 onto the available original 1.1 full ZIP plus the 1.1.1 patch, solely for code inspection and synthetic testing. `test_review_1_1_3.js` passed **8/8**; `test_review_1_1_1.js` passed **13/13**. Original polling/explorer suites passed **14/14**, tracker checks passed **9/9**, and original review regressions passed **22/22**.
- The **full aggregate test runner did not pass on that reconstructed partial base**: 1.1.2's historical archived test copy and reconstructed independent fixture were not included, and the original unadapted 1.1 independent fixture still uses a three-candidate `rcv_final` that 1.1.2 intentionally prohibits. These failures do not independently demonstrate a defect in the 1.1.3 code, but they mean this review does **not** certify Claude's complete green run on the genuine 1.1.2 base. Verify from a full 1.1.3 ZIP, or supply the actual 1.1.2 base for strict patch-chain reproducibility.
- v19 snapshot SHA-256 checked: `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`.
- H1–H4 preregistration SHA-256 checked: `15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af`.
- The 1.1.3 patch changes only `results_2026/tracker/` and `docs/results/`; it has no model or preregistration inputs.

## Scientific and legal review

**Maine:** The relevant current statute, 21-A M.R.S. §723-A(2), makes the first-round threshold more than 50% of **all ballots cast for the office**, expressly including blank or overvoted first rankings and first rankings for excluded candidates. The code's `ballots_cast_for_office = candidate_votes + blank_first_rank + overvote_first_rank + excluded_first_rank` reconciliation matches this conceptual denominator, *provided every category corresponds to the authority's official breakdown*. Do not treat these categories as separate candidates in the polling comparison. Sources: https://www.legislature.maine.gov/legis/statutes/21-A/title21-Asec723-A.html and https://www1.maine.gov/sos/elections-voting/ranked-choice-voting-frequently-asked-questions.

**Alaska:** AS 15.15.350(d) uses more than half the **active** ballots. Under the code's defined first-round candidate valid votes, blank/overvoted inactive ballots correctly do not enter that denominator. Source: https://www.elections.alaska.gov/petitions-and-ballot-measures/petition-status/petition_id/19akbe/ (statutory text).

**Georgia:** O.C.G.A. §21-2-501(a) requires a majority of votes cast to fill the office, and otherwise a runoff between the two leading candidates. Candidate votes (including lawful write-ins) rather than all physical ballots is a defensible interpretation; confirm the precise official race-level canvass definition when importing. Source: https://law.justia.com/codes/georgia/title-21/chapter-2/article-12/section-21-2-501/.

**Polling error:** `result_margin` remains challenger minus Republican as percentages of **valid candidate votes**, including other candidates/write-ins in the denominator, not the legal ballot-cast denominator. The statute and the preregistered polling-scoring rule estimate different quantities, so they should never be substituted for one another.

## Independent synthetic reproduction (not the project's own regression suite)

Using an original, isolated temp data directory and a synthetic certified Maine first-round report:

- Candidate votes: challenger 48,000, Republican 42,000, other candidate 5,000; candidate total 95,000.
- **Without** the ballots-cast fields: legal majority `unknown`, winner withheld, `first_round.margin=+6.32`, `error_v19=-3.22`; explicitly requests human review.
- **With** 5,000 blank first rankings and `ballots_cast_for_office=100,000`: legal majority `no`, winner pending RCV, with **the same** +6.32 candidate-vote margin and -3.22 v19 error. This is the correct distinction.
- The supplied new M1–M8 tests separately cover reconciliation, missing denominators, a true majority, a safe no-majority case, Alaska and Georgia.

## Remaining gates before publication

1. Obtain a **complete 1.1.3 runnable ZIP**, or the 1.1.2 base archive, and rerun the full manifest plus all regression suites from scratch. A patch alone over 1.1 or 1.1.1 is **not** an equivalent reproducibility test.
2. Rehearse a clean clone plus additive tracker deployment against the actual GitHub repository, verify that the vendored source-checksum logic rejects changed or absent inputs.
3. Verify each of the 35 election-authority domains directly, including delegated results-host links. A domain allowlist is not evidence that the candidate totals were actually read from that page.
4. Require human source sign-off of each imported report, especially Maine's Round 0 counts (not RCV Round 1), blank/overvote/excluded categories, and any official amended canvass. Preserve exact source URLs and retrieval timestamps.
5. Keep tracker **pre-release**, no fabricated election results in the public record, no modification of v19/v20/v20.1 or the H1–H4 registration.

**Disposition:** No additional arithmetic error found in the Maine majority denominator correction. Approve the narrow change *conditionally*; do not label the full results tracker production-ready until the clean-base build and authority/source checks have passed.
