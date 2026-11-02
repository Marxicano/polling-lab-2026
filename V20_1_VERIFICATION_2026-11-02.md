# Independent v20.1 release verification — November 2, 2026

- Source archive: `polling_lab_v20_1_methodology_review.zip` (SHA-256 `d494d1da92db615e888a8aaf42d21ae0772a69659ce705e21ae024b6e2ac591f`). The original ZIP remains available to the user as an attachment; GitHub hosts the review website and newly added supplemental source files, not the whole archive.
- ZIP archive integrity: complete and valid, no corrupt entries.
- Original v20.1 source SHA-256 manifest: all 84 listed paths passed `sha256sum -c SHA256SUMS_V20_1.txt` locally.
- Original v19 comparison: 78 of 78 files byte-identical to the previously frozen v19 archive.
- Original v20 comparison: 57 corresponding original files checked byte-identical to the previous v20 archive. The review edition contains its own changed root README, not an alteration to the original v20 publication.
- All 13 regression suites passed: nine v19, two v20, two v20.1.
- Independent Chromium render check: 390px mobile and 1280px desktop, no runtime JavaScript errors; review page displayed and 109 table rows rendered.
- Exploratory E1–E3 registry SHA-256 `f0e7978b1fc5c79d4d1e4948a269aae21c57900b01a5edb7957d587c6a767677`, independently verified and publicly registered before this record.
- Git blob fingerprints of published HTML, dashboard JSON, sources, regression tests, and all seven new CSV tables were compared against the original source bytes and matched. Source CSVs use CRLF line endings, preserved in the final GitHub files.
- The immutable official v19 snapshot and original v20 H1–H4 registration were never overwritten or rerun in this repository.

This is a source-integrity and software-consistency check, not a claim that v20's experimental election probabilities have been statistically validated or that any claimed polling bias has been established.
