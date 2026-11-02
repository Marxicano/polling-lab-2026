## Open the interactive Polling Lab app

**[LAUNCH THE POLLING DASHBOARD — RACES, CHARTS & 458 SURVEYS](https://marxicano.github.io/polling-lab-2026/app/)**

The interactive app lets you select any of 15 Senate races, compare polling-average methods, search individual survey results and original sources, and try illustrative margin scenarios. **This is the actual public app.** The older v20 research tables and methodology files remain below as a separate, unchanged historical record. Data frozen as of November 2, 2026; not live election results. No new forecasts or calibrations were added.

---

# Polling Lab 2026

An independent, reproducible research project tracking **2026 U.S. Senate polls and the national generic ballot**. It compares published polling averages, voter-screen assumptions, and illustrative error scenarios. This repository preserves the pre-election measurements for later evaluation.

> **Data freeze:** November 2, 2026, 8:08:33 a.m. Eastern, as recorded in the freeze data. The original snapshot was published to this GitHub repository on November 2 and has not been recomputed. GitHub's commit timestamp independently establishes the publication of the files, not their originally claimed creation time.

## Original frozen evidence (do not edit)

- [Snapshot CSV](data/snapshot_2026-11-02.csv) — 242 rows spanning Senate averages, generic ballot and separate scenarios
- [Original SHA-256 input manifest](data/snapshot_2026-11-02.manifest.json)
- [Freeze record](SNAPSHOT_RECORD.md)

**Original snapshot SHA-256:** `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`

These published files were independently matched byte-for-byte to the supplied frozen originals.

## What the snapshot does—and does not—show

- Polling averages summarize the included releases with the documented methods. They are **not election results or outcome probabilities**.
- The scenario outputs (including uniform polling-error shifts and turnout sensitivity) are **hypothetical calculations**, not additional polling observations.
- Early-vote party-registration totals **do not identify candidate votes**.
- Individual polls can have partisan sponsors, nonresponse error, population/field-date uncertainty and correlated methodological error. Passing regression tests establishes software consistency, **not completeness or polling accuracy**.
- There is **no automatic live poll or election-result feed** in this repository.

## Post-freeze review

- [Independent post-freeze audit](POST_FREEZE_INDEPENDENT_AUDIT_2026-11-02.md) — contains source and methodological limitations, including seven late NYT/Siena polls found missing from the frozen intake.
- [Publication notes](PUBLICATION_README.md).

These notes are explicitly separate from the frozen snapshot. Later omissions and corrections must not be silently incorporated into it. A future revised data series, if produced, must have a new name, its own provenance and a separate evaluation.

## Research questions

The project is designed to evaluate whether likely-voter screening, recalled-2024-vote weighting, partisan nonresponse and timing of polls affected 2026 measurement errors. **No universal correction toward either political party is assumed.**

After election results are certified, the frozen estimates can be scored against the results while preserving the original inputs, assumptions, and timestamped publication history.

**Status:** Research data publication. The full interactive dashboard/source ZIP and live election-night results are not yet hosted on this repository.

### November 2 post-freeze sensitivity (not part of the frozen model)

- [Claude's independent addendum](POST_FREEZE_ADDENDUM_CLAUDE_2026-11-02.md) — documents the seven NYT/Siena surveys published before the freeze but missed by the intake, along with source and process limitations.
- [Siena sensitivity comparison CSV](POST_FREEZE_SIENA_SENSITIVITY_2026-11-02.csv) — separately recomputed simple averages with those seven surveys. **This is not a new official freeze and must not overwrite the snapshot.**

Siena's [November 1 original release](https://sri.siena.edu/2026/11/01/nytimes-siena-poll-of-likely-voters-alaska-iowa-kansas-maine-michigan-ohio-and-texas/) and [reporting on Haley Stevens' November 1 Michigan endorsement](https://apnews.com/article/d7053bbd0ed2fd70756896c6e4b66a27) provide additional source context. The impact of the endorsement on voting is not measured by the Siena poll and should not be inferred as a causal effect.

### Final-week poll coverage audit — Nov 2 (additional post-freeze research)

- [Additional late-release source audit](POST_FREEZE_LATE_RELEASES_AUDIT_2026-11-02.md): documents AtlasIntel, Trafalgar, Research Co. and GrayHouse releases absent from v19.
- [Machine-readable source register](POST_FREEZE_LATE_POLL_REGISTER_2026-11-02.csv): seven distinct observations across six Senate polls and one national generic-ballot release, with sample populations, evidence and limitations.

**These are independent post-freeze notes only.** No changes have been made to the frozen Nov 2 snapshot, its original checksum manifest or official seat arithmetic. Some candidate toplines and exact release timing still require direct source verification.

## Experimental methodology scenario explorer (November 2)

- [Scenario explorer source and standalone HTML](scenario-explorer.html) — a self-contained mobile-friendly tool with 15 frozen state polling margins, six baseline comparison methods (including sponsor-exclusion), independently labeled historical polling-error presets, a 7-state post-freeze Siena sensitivity toggle, and a separate RedBox Florida early-vote arithmetic exercise.
- [Scope and sources](SCENARIO_EXPLORER_NOTES.md).

**This tool was created after the official freeze and does not update the frozen 242-row snapshot.** Its shifts are hypothetical sensitivity assumptions, not empirically calibrated 2026 election-win probabilities or a claim that a particular political party is being underestimated. The HTML can be downloaded and opened offline, but public web hosting via GitHub Pages has not been configured.

### Grok intake reconciliation (November 2, post-freeze)

- [Independent Grok intake audit](POST_FREEZE_GROK_AUDIT_2026-11-02.md) — corrects RedBox Florida's publication date and result, identifies poll omissions, and separates source-verified observations from pending claims.
- [Annotated 23-row Grok source register](POST_FREEZE_GROK_RECONCILED_2026-11-02.csv) — 20 original rows plus three Research Co. surveys mentioned in prose but missing from the CSV.

**Do not import this CSV wholesale into the frozen model.** It includes already-counted polls, an excluded Florida poll, and unfinished source verification. The original snapshot, its manifest and the November 2 freeze record are unchanged.

### RedBox Florida version discrepancy — November 2 source check

- [Follow-up RedBox source-conflict audit](POST_FREEZE_GROK_AUDIT_NOTES_2026-11-02.md) — records the **48–45 / Nov 1** figure in the frozen v19 snapshot and RedBox's polling-center/indexed reports **versus the 47–45 / Nov 2** figure on its current detailed Florida pages. Neither file is silently replaced; the timing and cause of the apparent publication change are not established.
- [Original reconciled Grok CSV](POST_FREEZE_GROK_RECONCILED_2026-11-02.csv) — preserved byte-for-byte as uploaded, including its original Grok columns and revised-audit columns. For coverage classification use `v19_verified_status`, not `v19_Status`.

This is **post-freeze source documentation**, not a revised prediction. All original frozen data remain unchanged.

## v20 election-eve analysis — post-freeze research

**v19 remains the immutable official November 2, 8:08 ET snapshot.** The separate v20 source ZIP was independently checked against all 78 v19 files, and all 11 regression-test suites passed. v20 introduces unvalidated experimental simulation and scenario ranges; do not treat its model probabilities as calibrated forecasts.

- [v20 mobile dashboard source (`docs/index.html`)](docs/index.html) — self-contained HTML, also works offline; becomes a normal website after enabling GitHub Pages from `main /docs`.
- [Dashboard data JSON](docs/data/site_v20.json) — original file, Git blob verified.
- [Pre-registration SHA-256 public record](V20_PREREGISTRATION_SHA256_2026-11-02.md) and [exact registered JSON](v20/preregistration_mike.json) — four tests H1–H4; retain original fingerprint.
- [Claude's v20 methods](v20/METHODS_V20.md) and [source coverage](v20/DATA_SOURCES_V20.md).
- [Independent November 2 v20 review](V20_INDEPENDENT_REVIEW_2026-11-02.md) — important warnings about the empirical calibration, an incorrect midterm-input-count description and missing/mismatched historical-validation source links.
- [GitHub Pages setup](v20/GITHUB_PAGES.md).

The main dashboard and public files are **not** a live-updating election feed, and the full v20 engine, tests and poll database are still only in the separately supplied ZIP. v20 documentation may need further, separately versioned revisions after review; do not revise the official v19 freeze or the registered v20 hypothesis rules.

## Kimi independent scientific audit — November 2 (post-freeze)

- [Original Kimi methodology audit](reviews/kimi/INDEPENDENT_METHODOLOGY_AUDIT_2026-11-02.md) — full report, unchanged.
- [Kimi's reproducible calculation script](reviews/kimi/REPRODUCE_AUDIT_2026-11-02.py) — original source text, runnable with NumPy and pandas.
- [Independent integration/reconciliation notes](reviews/kimi/KIMI_INTEGRATION_NOTES_2026-11-02.md) — scope of verification, two distinct RedBox waves, historical source cautions and prospective statistical tests.

These are independent third-party post-freeze analyses. They **do not replace** the immutable v19 snapshot or change v20's pre-registered H1–H4 rules. The companion Kimi workbook was reviewed separately; its original `.xlsx` bytes are not hosted in this repository. Kimi's archived MHTML chat was deliberately not published because it includes unrelated chat-interface information.

## NYT/Siena 2026 weighting-method sensitivity (separate research)

- [November 2 old-versus-new NYT/Siena weighting note](POST_FREEZE_NYT_SIENA_WEIGHTING_2026-11-02.md) — same-sample, seven-state methodological counterfactual from Nate Cohn's election-eve article. The older weights yielded Democratic margins averaging 3.43 points higher, but **that is not an observed error and does not establish any direction of bias**. These observations were not added as distinct polls and the frozen v19 baseline remains unchanged.

## v20.1 methodology review

- [v20.1 review dashboard](docs/v20-1/index.html)
- [Review data](docs/v20-1/data/site_v201.json)
- [Kimi assessment](v20-1-source/KIMI_ASSESSMENT_V20_1.md)
- [v20.1 changelog](v20-1-source/CHANGELOG_V20_1.md)
- [Original E1–E3 registry](v20_1/exploratory_registry_v201.json)
- [E1–E3 registration SHA-256](V20_1_EXPLORATORY_E1_E3_REGISTRATION_2026-11-02.md)

This post-freeze analysis is separate from the original v19 snapshot and v20 dashboard. Its experimental simulations are not calibrated forecasts.
