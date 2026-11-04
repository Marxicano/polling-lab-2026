# Polling Lab 2026 — ChatGPT independent review of results tracker 1.1.2

**November 3, 2026 (pre-release); synthetic returns only. No original polling estimate or registration was changed.**

## Reproduction and release status

- Applied the original full tracker 1.1 ZIP, then the 1.1.1 patch, then the uploaded 1.1.2 patch into an isolated directory.
- All original suites passed (14/14), tracker tests (9/9), original blocker regressions (22/22), winner/recount checks (13/13), new final-round checks (7/7), reconstructed final-round checks (4/4), and the adapted original three edge cases (3/3).
- **Original independent four-case script recovered and run unchanged**: 4/4 passed (AK and ME three-candidate final rejected; AK and ME two-candidate final accepted). Note its valid-two-finalist examples have an inconsistent elimination order, which it was never designed to check. Transfer-by-transfer validity still requires human verification.
- ZIP CRC valid. 1.1.2 patch: all **19** manifest entries match before and after SHA-256 fingerprints after applying the patches in order. Frozen v19 and pre-registration copies are unchanged. This is not a real GitHub-clone deployment test.
- **Do not publish / enter real results yet.** A remaining data-contract issue below can cause a wrong Maine first-round winner.

## New reproducible risk: Maine Round 0 denominator (high priority before importing Maine)

**Source:** Maine Revised Statutes 21-A §723-A(2) and the Maine Secretary of State's RCV FAQ say the first-round majority threshold is **more than 50% of ballots cast for the office, including blank/overvoted first-choice positions**. Separately, the Maine Secretary of State's RCV glossary distinguishes election-night Round 0 from the recount/tabulation's Round 1, where blank first rankings can transfer to later preferences.

Sources:
- https://legislature.maine.gov/legis/statutes/21-A/title21-Asec723-A.html
- https://www.maine.gov/sos/elections-voting/ranked-choice-voting-frequently-asked-questions
- https://www.maine.gov/sos/elections-voting/resources-for-ranked-choice-voting

**Current tracker behavior:** `validateReport()` requires the sum of candidate votes (plus a single OTH aggregate described as other candidates and write-ins) to equal `total_votes`. `officialWinner()` determines whether first-place votes exceed half of that same `total_votes`, and `compare()` accepts the result as an outright winner in Maine. `total_votes` has no dedicated count of blank or overvoted first rankings, and the data-entry guide tells operators to include every candidate plus write-ins; it does not explicitly account for blank/overvoted ballots in the threshold denominator. The scoring margin and the legal majority threshold may therefore require different denominators.

**Concrete synthetic reproduction:** 100,000 ballots cast, with 48,000 Democratic first-choice votes, 42,000 Republican, 5,000 independent, and 5,000 **blank first choices**. Maine threshold: 48,000/100,000 = 48%, so no first-round majority. When only the named candidate totals are entered into the tracker (95,000), the report passes validation and the tracker declares the Democrat an outright winner (48,000/95,000 = 50.53%) and refuses a two-candidate final RCV result. This is a data-model vulnerability, not a real 2026 election claim.

Run the attached `TRACKER_1_1_2_MAINE_BLANK_BALLOT_EDGE.js` from the root of an extracted complete project:
```
node /path/to/TRACKER_1_1_2_MAINE_BLANK_BALLOT_EDGE.js
```

**Recommended correction:** Preserve the frozen and pre-registered polling data. For RCV first-round official returns, separately track **candidate valid votes** and the **statutory first-choice majority denominator**, including blank, invalid and overvote first-choice ballots when the authority reports them. Require explicit provenance and reconciliation; do not silently treat blanks as `OTH` candidates. Apply the legal threshold to its proper denominator, while calculating the pre-registered polling error using the stated scoring denominator, clearly documented. If the source does not provide sufficient counts to verify the threshold, withhold the winner and flag human review; do not infer an outright majority. Add a synthetic regression for this exact 48/42/5/5 case and one for an unambiguous first-round majority. Audit the analogous Alaska denominator against its own authority's rules.

**About the user-raised Maine near-50% case:** Do not simply bypass the majority guard because an authority publishes an RCV tabulation. First reconcile whether the official first-choice count is Round 0 rather than RCV Round 1; count blank/overvote first choices in the correct statutory denominator; and verify any amended canvass or official explanation. An unresolved discrepancy remains a stop-and-escalate case. This is a prospective implementation detail, not an amendment to H1-H4.

## Remaining publication gates

1. Fix/explicitly validate Maine Round 0 majority denominator and human-reviewed comparison basis.
2. Rehearse patch deployment and tests against a real clean checkout of `Marxicano/polling-lab-2026`.
3. Independently check official results authorities and permitted hosts for all 35 contests; per-report human verification of exact numeric figures remains essential.
4. Keep the results tracker pre-release and keep the immutable pre-election polling series and H1-H4 untouched.

**What is approved:** The narrow 1.1.2 exactly-two-finalists validator, previous Georgia/AK/ME winner fixes, and the current recount-scope rule have passed independently. This is a conditional approval of code fixes, **not** a production sign-off for real results ingestion.
