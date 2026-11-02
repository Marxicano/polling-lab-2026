# Polling Lab 2026 — integration of Kimi's independent methods audit

**Date:** November 2, 2026  
**Status:** Third-party post-freeze audit; **not** an update to the official v19 snapshot, v20 pre-registration, or the published v20 simulation.  
**Original Kimi report SHA-256:** `e2eb8376d2c55513fa58263ced591ac184248538131daaa836f045f1a9269f3d`  
**Kimi reproduction script SHA-256:** `3d029c60ef369c56469baadf93e91ac82fb603ef50ad7e648c076c7414f0b6f0`  
**Companion spreadsheet SHA-256:** `2a4c17ca61fc7b310b7aaafd1366da52c377557515e9a17550e7492b71dc4422`

## What was checked

- Successfully executed the reproduction script with Python and NumPy; all assertions passed.
- Inspected the 15-sheet Kimi workbook using the spreadsheet artifact API. The historical error summary, Florida official registration totals, RedBox subgroup values, and formula-driven recall reconstruction agree with the reproduction script, subject to the input/source caveats below.
- Read Kimi's entire methodology report and sampled its saved MHTML research-chat export. MHTML **was not published**: it embeds a personal Kimi chat interface and unrelated chat titles.
- Cross-checked 2024 and 2022 Senate signed-error benchmarks against AAPOR's published report, and the 2025 source-specific retrospective against Silver Bulletin. These are published summaries rather than a new poll-level independent replication.
- Cross-checked the *current* RedBox primary methodology page and the two original RedBox waves represented in the v19 and v20 data.

## Findings relevant to Claude v20

1. **Do not install a universal signed correction.** Kimi reports all-office AAPOR cycle mean signed errors (poll D–R margin minus certified result) of 2016 +3.1, 2018 +0.1, 2020 +4.6, 2022 −0.6, and 2024 +2.7 points. Senate-only 2022 is −1.2 and 2024 is +2.4; those office-specific numbers must not be silently substituted for all-office numbers. Direction varies by cycle and office.
2. **Weak validation remains v20's bottleneck.** Kimi's leave-one-cycle-out error arithmetic reproduces, but five annual aggregate observations do not identify national/regional/state/office variance components, house effects, turnout models, or outcome probabilities. Its recommended hierarchical t-distributed error framework is a *design proposal*, not a calibrated model ready to replace v20 overnight.
3. **Recalled-vote mechanism remains conditional.** Kimi reproduced a 2.2146-point illustrative reconstructed **recalled-2024-vote margin distortion** under simplifying assumptions, not a 2.2146-point current-election polling error. The causal and national vote-margin effects require private microdata and poll-specific methods not supplied by the sources. Kimi's public State Navigate comparison notes some offsetting examples.
4. **Florida administrative baseline is not candidate votes.** Kimi's timestamped November 2 08:09 ET report gives 5,402,229 ballots cast/returned: 2,174,589 registered R, 2,039,578 registered D, 1,049,454 NPA, 138,608 other. These totals are time-stamped and should not be assumed to describe the final electorate or votes for Moody/Nixon.
5. **Sponsor and house effect differ from observed election error.** Political sponsors should be metadata and sensitivity variables, not proof of manipulation, and house effects should not be confused with signed errors against results.
6. **No preregistration modifications.** Four v20 tests H1–H4 were fingerprinted and publicly committed. Do not change rules, directions, minimum samples, or data definitions after the publication as if they were still the pre-registered test; changed analysis must have a new identifier and public timestamp.

## Crucial RedBox version mismatch

**Kimi's subgroup reproduction is for the *October 20–23* RedBox wave** (`FL-020` in v19), released October 25: n=4,823, effective n=1,520, design effect ≈3.17, Moody 49.605% versus Nixon 42.797% (Moody +6.808). It reports self-identified independents Nixon +22.04, already-voted respondents Nixon +15.548, and not-yet-voted respondents Moody +22.770. Their mixture at an already-voted share of 41.657% reproduces the weighted statewide margin. The break-even 59.424% already-voted share is only an algebraic sensitivity with subgroup margins held constant.

**RedBox's separate *October 30–31* wave** (`FL-NOV01-REDBOX2` in v19/v20) has n=2,898, effective n=2,120, design effect ≈1.37 and a separately published Moody +3 statewide margin (other pages/history reported a Moody +2 version). Its party and 2024-recall weighting targets were revised around the release period. The live [methodology URL](https://afightworthhaving.com/polling/2026/florida/methodology) now documents this *newer* survey. It is a mutable URL; current content cannot independently verify the older n=4,823 methodology. V19's frozen original source metadata, Kimi's saved archive and preserved internal v19 audit are the evidence objects for the first wave. Obtain and timestamp original wave-specific methodology/crosstabs archived by date when possible. **Do not combine these waves' sample sizes, subgroups, design effects, or turnout targets.**

## Evidence hierarchy and next implementation tasks

- Preserve official v19 freeze and original v20 pre-registration without modifications.
- Make a distinct, versioned *v20.1 post-freeze methodology review*, not a retrospective rewrite of the November 2 published v20 simulation.
- Add explicit `release_group_id`, `source_retrieval_timestamp`, `source_version`, fieldwork and publication dates, `raw_n`, `effective_n`, `weighting_recipe`, `population`, `recall_use`, and `evidence_status` per poll.
- Before any probability claims, build a contest-level historical dataset; backtest by *rolling election year*, with separate Senate-only and all-office results; estimate correlated uncertainty from historical held-out coverage and proper scores (Brier/CRPS/log score), not five selected cycle means or seven hand-picked errors.
- Trial but do not automatically adopt: zero-mean correlated errors, hierarchical regional/office/state errors, sponsor as a covariate, recalled-vote-stratified scenarios, and RV/LV matched-pair tests. Compare each against simpler historical baselines without using future-election data.
- Treat all historical cross-cycle offsets and Florida early-vote candidate arithmetic as transparent sensitivity tests rather than true 2026 corrections.

## Source documents

- Original Kimi methodology: `reviews/kimi/INDEPENDENT_METHODOLOGY_AUDIT_2026-11-02.md` (byte-identical text)
- Original runnable reproduction (renamed `.py` with unchanged bytes): `reviews/kimi/REPRODUCE_AUDIT_2026-11-02.py`
- Kimi original workbook: `Polling_Lab_2026_audit_tables(1).xlsx` (binary file shared separately, not published through the text-only GitHub connector)
- Historical primary: https://aapor.org/wp-content/uploads/2025/10/AAPOR-Task-Force-on-2024-Pre-Election-Polling_Report.pdf
- Separate 2025 retrospective: https://www.natesilver.net/p/actually-sometimes-polls-underestimate
- Current RedBox final-wave methodology: https://afightworthhaving.com/polling/2026/florida/methodology
- Official Florida reports: https://countyfilesvbm-ev.floridados.gov/VoteByMailEarlyVotingReports/PublicStats

**Limitation:** The audit verifies Kimi's arithmetic on the supplied published inputs and compares source versions. It does not independently re-run AAPOR's restricted poll-level data, validate RedBox's private voter-file turnout scores, or demonstrate causal bias from any particular method.
