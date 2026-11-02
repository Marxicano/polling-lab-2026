# 2026 Senate Polling Lab — results and scoring plan
**Prepared November 2, 2026, before election results.** This plan is an additive, prospective results-recording guide. It does **not** update the frozen v19 snapshot, the post-freeze v20 estimates, v20.1 methodology, or any previously registered hypotheses.

## Non-negotiable separation
- **Original v19 freeze:** `data/snapshot_2026-11-02.csv`, SHA-256 `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`. This is the primary frozen evaluation.
- **Expanded v20:** 458 included surveys, separately labeled **post-freeze comparison**, not a replacement for v19.
- **Explorer:** illustrative and published historical-error scenario outputs, including documented near-tie sensitivity; not additional observations or a calibrated forecast.
- **Pre-registered H1–H4:** `v20/preregistration_mike.json`, with the separate, publicly published SHA-256 `15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af`. Do not edit its tests, thresholds, resampling rules, or inclusion conditions based on the outcome.
- **v20.1 exploratory work:** E1–E3 and Kimi's methodological notes are not interchangeable with the registered H1–H4 tests. Label exploratory findings separately.

## Data gathering sequence
1. **November 3 onward — preliminary count:** collect election-authority-reported vote counts, report timestamps, precinct/ballot coverage when supplied, and URLs. Label all such counts **unofficial**; update new results files only.
2. **During subsequent updates:** keep a revision log, preserve previous pulls and note why numbers changed. Do not present partial-reporting leads as final wins.
3. **After each applicable state's certification:** capture the certified returns (or state-approved official canvass), the named candidates, vote totals, and any relevant final round. Link the authority and its certification date. Only then run the original registered hypothesis tests.
4. **Publish two visibly distinct scorecards:** original frozen v19 versus certified results (primary); post-freeze v20 versus certified results (secondary). Report both missed poll sources and any fixed-precision rendering issues without silently replacing a version.

## Fifteen included competitive states
AK, FL, GA, IA, KS, ME, MI, MN, MS, NC, NE, NH, OH, SC, TX. These are the original research coverage, not necessarily every competitive Senate race or every US state.

## Recommended new results schema
For each candidate/round/status, retain:
`state,office,round,candidate,ballot_party,votes,total_ballots,reported_pct,reporting_status,report_timestamp_utc,certification_date,authority_name,source_url,notes`.

Derived race fields:
`state,round,challenger_name,challenger_affiliation,republican_name,challenger_pct,republican_pct,result_margin,other_candidate_pct,status,source_url`.

Rules:
- Use **challenger minus Republican** for candidate-margin scoring, exactly matching the lab's sign convention. For Nebraska, Dan Osborn's status is **independent**, never automatically Democratic.
- **Alaska ranked-choice voting:** retain first-choice and final-round counts separately. Report which round each comparison uses, and never silently compare an RCV first-choice poll to the certified final-round margin as though they were the same quantity.
- Do not treat registration-based early-vote counts as candidate votes. Do not infer votes from partial precinct counts or news projections.
- Blank/unknown is better than fabricated; include source/time coverage with every provisional return.

## Scoring only when comparable certified returns exist
For each eligible race and method:
- `poll_margin = challenger_poll_pct - republican_poll_pct` (already in the frozen file)
- `result_margin = challenger_certified_pct - republican_certified_pct`
- `signed_error = poll_margin - result_margin` (**negative = too Republican**; positive = too challenger/Democratic or independent)
- `absolute_error = abs(signed_error)`
- Show mean signed error, mean absolute error, number of comparable races, winner accuracy, and separately whether the frozen Senate seat/accounting predictions were right. Do not retroactively change the research universe or pre-registered comparator.

**H1:** Compare same-survey LV and RV pairs for accuracy and direction. Preserve the originally registered minimum 10 pairs from 4 states, the pollster-cluster bootstrap, and the published decision rules.

**H2:** Compare only *verified* recall-vote-weighting and *verified* non-recall pollsters, with at least 3 pollsters per group; leave unknown methods unknown, and use the registered group/accuracy criteria.

**H3:** Compare mean absolute error with versus without the verified recall-weighting group across at least 8 eligible states. Preserve the original 0.5-point criterion and sign condition.

**H4:** Evaluate the frozen v19 raw-simple mean signed error across competitive states, with the registered 90% state bootstrap and the direction rules.

The full machine-readable H1–H4 definitions, 10,000 bootstrap replicates, seed `20261103`, interval 0.90, and clustering rules are in the registered JSON: **use the source definitions, not this short prose as substitutes.**

## Audit disclosures to show alongside later scores
- Original-source review is incomplete; Claude's adversarial self-audit reports only 28 of 458 included v20 poll records read against the pollster's own original release.
- Mississippi's v19/v20 R+7.3 baseline falls back to stale polls; its published figure is retained for scoring but must carry a conspicuous low-freshness warning.
- Pollster sponsor flags and independently documented firm alignment are different variables; unknown recalled-vote methods can limit the pre-registered tests.
- v20 probabilities are **experimental, not calibrated**, and historical-miss presets mix different kinds of elections. Never use a winning election result as proof of probability calibration.

## Deliverables
- Unofficial results log with exact timestamps and source authority links (no scores presented as final).
- Certified-results table, with election round/contest rules documented.
- v19 frozen primary scorecard; v20 post-freeze secondary scorecard.
- H1–H4 registered-test report, explicitly recording **supports / contradicts / inconclusive** and eligibility failures.
- Separate exploratory v20.1 assessments and source-data correction ledger.
- Plain-language public postmortem explaining successes, misses and how the original methods performed.

No election results had been entered into this plan on November 2, 2026.
