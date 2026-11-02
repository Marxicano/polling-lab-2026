# 2026 Polling Lab Scenario Explorer — source/method notes

Created November 2, 2026 **after the official v19 freeze**. This is NOT a pre-registered forecast or a replacement for the official snapshot.

- Frozen baseline: 242-row 2026-11-02 CSV from user-supplied `polling_lab_v19_FROZEN_2026-11-02.zip` (SHA-256 `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`).
- Included data: raw margin and included poll counts for five frozen aggregation methods for 15 tracked Senate races; frozen scenario subsets for matched LV/RV, recalled 2024 vote, and sponsor exclusion. These were read directly from that CSV, not estimated.
- Seven-state omitted Siena batch: Claude's separately published post-freeze sensitivity CSV; one-per-state simple averaging deltas only; not valid to apply Siena toggle to other methods.
- Historical error scenarios: 2022 AAPOR Senate mean signed error -1.2 Democratic and 2024 +2.4 Democratic; scenario offsets are negative of each error. 2025 VA gubernatorial D +5.0 and NJ D +9.7 are illustrative cross-election transfers from project `data/offyear.csv`.
- 1–2 pp recall-bias sensitivity: from State Navigate's *Total Recall Bias* modeled **generic-ballot** effects; not empirically estimated for each state Senate race. User-selected not automatic.
- 2018/2026 approval comparison: Pew Research Center reported 38% first-term approval early Oct 2018, 30% late Sept–early Oct 2026. Does not identify a margin correction.
- Florida turnout mixture: 2026 Oct 20–23 RedBox survey, with fixed subgroup candidate margins. It is independent from statewide averaging and other RedBox waves.
- This model makes no claimed win probabilities, partisan recommendations, prediction intervals, or causal attribution.
- Not automatically refreshed; no outside network. State list is limited to the 15 in frozen snapshot. NE positive margin is an independent candidate, not a Democratic candidate.

Sources: https://github.com/Marxicano/polling-lab-2026 ; https://projects.statenavigate.com/features/total-recall-bias/ ; https://www.pewresearch.org/politics/2026/10/08/with-americans-in-a-sour-mood-democratic-voters-are-more-engaged-in-midterms/
