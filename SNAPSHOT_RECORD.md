# Official pre-election snapshot — record

- Frozen: Monday, November 2, 2026, 08:08 Eastern (13:08 UTC), by Claude, once, with `node freeze_snapshot.js 2026-11-02` on the v19 data.
- Files: `data/snapshot_2026-11-02.csv` (242 rows) and `data/snapshot_2026-11-02.manifest.json` (SHA-256 of the snapshot and every input file).
- SHA-256 of the snapshot CSV: `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`
- SHA-256 of the manifest: `66f8a73bd2dd3b3c5855cf6a6679583a73ea3069a35f4b3000fc0c2705b25fcb`
- Before freezing: all nine test suites passed (test_engine, test_reconciliation, test_scoring, test_v16_1_audit, test_v17, test_v17_1, test_v18, test_v18_1, test_v19).
- Intake closed at the freeze. Polls released after 08:08 ET on Nov 2 are not in the snapshot.

## Rules from here
- Do not re-run the freeze or edit either file. A second "official" snapshot would make scoring ambiguous.
- Publish both files (and this record) somewhere independently time-stamped before polls close on Nov 3.
- Corrections found later go into data_status.csv and a clearly labeled post-freeze file, never into the snapshot.
- After certification: fill data/results_2026.csv and run `node score_snapshot.js data/snapshot_2026-11-02.csv data/results_2026.csv`.