# Polling Lab 2026 — v20.1 (post-freeze methodology review)

v20.1 integrates Kimi's independent audit without replacing anything. Read `KIMI_ASSESSMENT_V20_1.md` first.

| Layer | Folder | Status |
|---|---|---|
| Official pre-election snapshot | `v19_frozen/` | frozen Nov 2, 08:08 ET; verified by hash |
| Election-eve analysis and H1-H4 pre-registration | `v20/`, `docs/index.html` | published; byte-identical (`SHA256SUMS_V20.txt`) |
| Methodology review | `v20_1/`, `docs/v20-1/`, `reviews/kimi/` | new |

Run
```
node v20_1/tests/run_all_v201.js     # 13 suites: 9 v19, 2 v20, 2 v20.1
node v20_1/build_site_v201.js        # writes docs/v20-1/ only
node v20_1/run_v201.js v201_rolling_origin
node v20_1/score_v201.js data/results_2026.csv   # after certification: H1-H4 (unchanged) + exploratory E2/E3
```
GitHub Pages: commit `docs/v20-1/` alongside the existing `docs/`; the review page appears at `/v20-1/` and links back to the v20 dashboard.
