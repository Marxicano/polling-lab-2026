# Explorer 1.0.2.1 — external-review mobile hotfix (November 2, 2026)

Source: Explorer 1.0.2 from Claude. Its full source and test report are archived unchanged under `explorer/history/1.0.2/`; v1.0.1 is archived under `explorer/history/1.0.1/`.

Independent audit: all 14 suites passed unmodified, all 15 checksums from Claude's 1.0.2 manifest passed, its 16 patch files matched the full ZIP byte-for-byte. Independent comparisons confirm the 2025 official 56D/43R/1I vs integer recomputation 57D/42R/1I are **separate** and clearly disclosed. Sensitive ranges are conventions, not calibrated probabilities. Across nine available baselines and all 1601 slider positions, independently enumerated possible control categories matched the displayed categories.

Fix: At width 320px the long cohort dropdown widened the Polls page. Added CSS `select{max-width:100%;min-width:0}` to `explorer/explorer_template.html`, rebuilt `docs/explorer/index.html`, added a regression assertion in `explorer/test_explorer.js`, and updated displayed version to 1.0.2.1. Browser tested 320, 390 and 1280 widths with 0 JavaScript errors and no page-wide horizontal overflow, verifying Mississippi +7.35 as 56/43/1, the 2024 -2.7 scenario as 51/49/0, and 458 included poll cards.

**Not changed:** 78-file v19 archive, 137-file v20 entries, 163-file v20.1 entries, v20 published scenarios, original data, poll sources, baseline assumptions, probability estimates, and preregistered tests.
