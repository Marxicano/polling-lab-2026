# Changelog

## v20.1 — Nov 2, 2026 (post-freeze methodology review; v20 not replaced)
Unchanged and verified by tests: v19 snapshot and all v19 files; all 58 published v20 files (SHA256SUMS_V20.txt), including the H1-H4 pre-registration, the v20 scorer and the v20 dashboard (docs/index.html).

Added
- `reviews/kimi/`: Kimi's audit, reproduction script and workbook, ChatGPT's integration notes, provenance note.
- `v20_1/engine_v201.js`, `v20_1/run_v201.js`: review layer on top of the unchanged v20 run.
  - `v201_poll_metadata`, `v201_metadata_summary`: data contract with explicit nulls and reasons for all 461 rows.
  - `v201_neff_sensitivity`: what the silent effective-n default does.
  - `v201_redbox_waves`: the two RedBox Florida surveys kept separate, with evidence and checks.
  - `v201_calibration_review`: inputs by estimator; v20 high and midterm-only settings relabeled.
  - `v201_rolling_origin` (E1): no-leakage cycle backtest with log score and CRPS.
  - `v201_correlation_sensitivity`: regional-share diagnostic with state variances fixed.
  - `v201_recall_scenarios` (E2): recall-stratified hypothetical, gated on documented recall use.
  - `v201_fl_official`: Florida Nov 2 08:09 ET registration counts (context only).
  - `v201_assessment`: all 15 recommendations mapped to code.
- `v20_1/exploratory_registry_v201.json` (E1-E3), `v20_1/score_v201.js`.
- `docs/v20-1/`: separate review page linked from nowhere inside v20 (v20's page is unchanged).
- Tests: `v20_1/tests/test_v201.js` (13 checks), `test_v201_site.js`, `run_all_v201.js` (13 suites).
- `KIMI_ASSESSMENT_V20_1.md`, `README_V20_1.md`, `SHA256SUMS_V20_1.txt`.

Corrections (labels and metadata only; no published number changed)
- v20 "high" and "midterm-only" uncertainty settings relabeled as cross-source stress/diagnostic settings.
- v20 "leave-one-cycle-out" relabeled a cross-validation diagnostic (it used later cycles).
- "Nov wave" RedBox label corrected to "Oct 30-31 wave (released Nov 1)"; wave ids and retrieval times recorded.
- Effective-n assumption made explicit for every poll.
