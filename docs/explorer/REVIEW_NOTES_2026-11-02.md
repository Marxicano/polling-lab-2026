# Claude Senate explorer — independent pre-publication check (Nov 2, 2026)

This is an **alternate self-contained presentation** at [docs/explorer/index.html](index.html), not an update to the official v19 or experimental v20 polling engines.

**Original Google Drive source:** `index.html` (Drive file ID `165bA8Q7yKF78_ZvLNGmK5zyYaWZX0ZM0`), SHA-256 `20e553d5abc9b96dbc7b6312efd66f4509a318eda83cb58e9f3dcc721748f5f5`.

**Published, minimally corrected page:** SHA-256 `a876a1d07458b6ad3a18354f9529437fa54616224829a851d4ae02b1dff01fad`. Changed the hypothetical-shift slider step from 0.1 to 0.01 and updated the version label to 1.0.1. Why: for the documented +7.35 shift, HTML snapped a 0.1-step slider to +7.4, producing 57 D / 42 R / 1 independent instead of the published v20 scenario's 56 D / 43 R / 1 independent.

**Independent checks performed:** Original embedded v20 data matched the original November 2 v20 archive: all 15 races, ten comparison margins per race where available, poll counts, and all 13 historical scenario rows. All 461 poll IDs were unique; all 461 poll rows matched their source CSV records on displayed core poll fields and inclusion metadata. Chromium rendered at 320px, 390px and 1280px without pagewide horizontal overflow or uncaught JS errors. After the step fix, **all 12 named historical-miss scenario buttons reproduced the published v20 Democrat/Republican/independent seat totals exactly**. The remaining scenario is the unshifted baseline.

**Limits:** Claude's accompanying `polling_lab_explorer_1_0.zip` was not accessible in the connected Google Drive search. Therefore the 14 tests Claude reported in that ZIP **were not independently run** here. Instead, checks above are independent and limited to the retrieved HTML, original v20 release and browser controls. This validation is not calibrated probability validation or certification of completeness of the underlying polling dataset.

Original v19 freeze, original v20 dashboard, v20.1 review, and the existing interactive `/app/` files were not modified.

## Update after original Explorer 1.0 ZIP was supplied (November 2)

The complete original archive `polling_lab_explorer_1_0.zip` was subsequently uploaded directly and independently tested. Its SHA-256 is `09ed82fc976c4a2d6554a750d1bc031bf8faf2812156ca864e74a76865ac2323`; ZIP integrity test passed, and all 7 original explorer manifest entries matched their original hashes.

**Independently executed:** `node explorer/run_all_explorer.js` — **all 14 regression suites passed** (9 v19, 2 v20, 2 v20.1, 1 explorer). Separately compared all 78 original frozen v19 files, all 137 corresponding v20 files, and all 163 corresponding v20.1 files in this archive with the earlier original ZIPs: all matched byte for byte.

The test runner's original checks, however, did not catch the browser slider quantization bug; the original template used `step="0.1"` although `+7.35` must be representable. The deployed HTML had already been corrected to `step="0.01"`. The published source template now matches that corrected HTML; `explorer/test_explorer.js` now asserts slider precision and checks that all scenario values fit its step. The amended source and additional check **still pass all 14 suites**. The original uploaded ZIP and its manifest were preserved unchanged. `SHA256SUMS_EXPLORER_1_0_1.txt` documents the amended source files and published corrected app.

Source: [builder](../../explorer/build_explorer.js), [template](../../explorer/explorer_template.html), [tests](../../explorer/test_explorer.js), [14-suite runner](../../explorer/run_all_explorer.js), [Explorer source notes](../../README_EXPLORER.md), [v1.0.1 checksum manifest](../../SHA256SUMS_EXPLORER_1_0_1.txt).

## Update: Claude Explorer 1.0.2 and mobile-only 1.0.2.1 review

Claude's full `polling_lab_explorer_1_0_2_full.zip` and `polling_lab_explorer_1_0_2_patch.zip` were provided and independently inspected. The ZIP CRC check, all 15 original Explorer 1.0.2 source SHA-256 entries, all six archived 1.0.1 hashes and a byte-for-byte comparison of the 16 patch files against the full ZIP passed. Running `node explorer/run_all_explorer.js` from the uploaded full project produced **14/14 passing suites**.

**Methodology and scenario findings:** At the +7.35 2025 off-year shift, exact hundredth-point integer arithmetic yields Mississippi D+0.05 and 57D/42R/1I, whereas the published v20 scenario totals are 56D/43R/1I because its floating-point edge treated MS as a tie. Explorer 1.0.2 preserves that official v20 total **as an explicit historical published artifact** while disclosing the 56–57D near-tie sensitivity range. At the 2024-style error, it preserves the official 51D/49R/0I and shows a 49–53D sensitivity range. These are not statistically calibrated confidence intervals or probabilities.

Independent pure-logic enumeration across **nine available baselines x all 1,601 one-hundredth-point slider positions** matched the Explorer's reported possible Senate-control categories; sensitive races remain counted by Democrat, Republican and independent status. The seat ranges are *per-party marginal bounds*: their endpoints must not be combined as if all maxima or all minima occurred simultaneously.

**Browser checks and mobile-only hotfix:** Chromium rendered via locally loaded self-contained HTML at widths 320, 390 and 1280. Scenario controls returned 56D/43R/1I at +7.35 and 51D/49R/0I at -2.7 with no uncaught JavaScript errors. A 320px horizontal overflow was found on the Polls page because the long cohort dropdown exceeded viewport width. The 1.0.2.1 publication adds `select{max-width:100%;min-width:0}`, rebuilds the page and adds a CSS regression assertion. Repeat checks found **zero page-wide horizontal overflow** at all three widths. All 14 test suites still pass.

The original Claude 1.0.2 files are preserved under [explorer/history/1.0.2](../../explorer/history/1.0.2/), and the 1.0.1 files under [explorer/history/1.0.1](../../explorer/history/1.0.1/). The live page is [Explorer 1.0.2.1](index.html). See [its manifest](../../SHA256SUMS_EXPLORER_1_0_2_1.txt), [amended source](../../explorer/explorer_template.html) and [regression tests](../../explorer/test_explorer.js). This review does **not** establish that all external poll sources are correct or that v20's probability estimates are calibrated. Frozen v19, v20, v20.1 inputs, model data and pre-registrations were not modified.
