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
