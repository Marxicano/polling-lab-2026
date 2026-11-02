# v20 data sources (post-freeze additions)

All 461 Senate rows: 448 carried unchanged from frozen v19 (`release_cohort = v19_frozen_input`), 13 added after the freeze (`v20_post_freeze`). "Read by Claude" means the figure was read on the pollster's own page or PDF on Nov 2.

| Race | Pollster | Fieldwork | Sample | Result | Read by Claude on the original | Secondary |
|---|---|---|---|---|---|---|
| AK, IA, KS, ME, MI, OH, TX | NYT/Siena | released Nov 1 | 610, 705, 736, 714, 1,011, 717, 1,215 LV | Peltola 48-46; Turek 48-47; Hamilton 49-44; Jackson 51-45; El-Sayed 53-42; Brown 49-44; Talarico 50-43 | Shares, design effects (1.29-1.47), margins of error: sri.siena.edu Nov 1 release | Sample sizes (NYT via Daily Kos); fieldwork dates not loaded |
| TX | AtlasIntel | Oct 28-Nov 1 | 1,678 adults | Talarico 52.2-46.2 | Dates, sample, adult population (AtlasIntel index) | Candidate shares (trackers via ChatGPT); PDF not machine-readable here |
| TX | Trafalgar | Oct 31-Nov 1 | 1,089 LV | Paxton 48.1-47.5, Brown 2.4, undecided 2.0 | All (report PDF; response rate 4.5%) | |
| MI, MN, OH | Research Co. | Oct 30-Nov 1 | 450 LV each | Decided voters: El-Sayed 51-48; Flanagan 52-47; Brown 49-48 | All, plus method: online, weighted only to census age and gender; posted 2026-11-02 03:10 UTC | Full-ballot versions 48-46, 48-43, 45-44 (trackers) |
| IA | GrayHouse | Oct 28-31 | 601 LV | Hinson 48-46 (initial ballot) | All, plus method: voter-file sample, SMS/phone, weighted to party registration and 2024 vote (Trump 54, Harris 43); posted 2026-11-02 06:54 UTC, before the freeze | |
| National | AtlasIntel | Oct 28-Nov 1 | 3,566 adults | D 55.5-41.4 | Dates, sample, adult population | Shares (trackers via ChatGPT) |

Notes
- The Siena batch and GrayHouse were public before the 08:08 ET freeze and missed by the v19 intake; Research Co. was posted 03:10 UTC Nov 2 (10:10 pm ET Nov 1), also before it. Trafalgar's page image is time-stamped 9:38 pm Nov 1. All are post-freeze for this project because they were not in v19.
- Nebraska: PollCheck's Nebraska list (checked Nov 2) had nothing beyond v19.
- Big Data Poll Florida (Oct 26-30) remains excluded pending reconciliation of versions and sample, as in v19.

Other v20 tables
- `calibration_errors.csv`: AAPOR task force cycle errors and Senate poll errors, Silver Bulletin midterm errors, RealClearPolitics off-year governor averages vs results, race-level misses from 270toWin averages, the lab's 2024 generic backtest. Each row has a source URL and its role (sigma estimation, scenario or validation).
- `context_variables.csv`: Trump approval (Silver Bulletin 37.3/59.9, net -22.6; Economist -27; NYT -23; all Oct 30, via Wikipedia's table); early ballots (UF Election Lab: 48.5 million nationwide, Texas 6.86 million, Florida 4.41 million, Georgia 2.60 million, as reported in late October); Florida early ballots by registration (R 40.4%, D 38.6%, other 21.1%); expert note on early-vs-Election-Day patterns; the Nov 1 Michigan endorsement. Context only.
- `recall_targets.csv`: GrayHouse Iowa target vs the certified 2024 result; RedBox Florida (October wave weighted to the certified result; November wave target set after fieldwork).
