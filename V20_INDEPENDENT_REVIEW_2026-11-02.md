# Independent review of Polling Lab v20 (November 2, 2026)

**Status:** Independent post-v19-freeze audit; not a modification of v19, v20 source files, or the original hypothesis pre-registration. All observations were made before the November 3 election. Do not replace or backdate the official November 2 v19 snapshot.

## 1. Reproducibility checks passed

- The uploaded `polling_lab_v20_election_eve.zip` extracted successfully. ZIP integrity and root `SHA256SUMS_V20.txt` checks passed.
- The `v19_frozen/` directory matches **all 78 files** in the original v19 freeze ZIP byte-for-byte, including the CSV snapshot and source manifest.
- The four-tests pre-registration `v20/preregistration_mike.json` has SHA-256 `15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af`. A public commit was created independently for that fingerprint, then the exact JSON was published.
- `node v20/tests/run_all.js` passed the nine original v19 suites and two new v20 suites on this extracted copy.
- The unmodified `docs/index.html` rendered on 390px and 1260px browser widths with no page errors; 15 state-race rows displayed. The GitHub-stored HTML and data JSON match their original Git blob hashes.

**Interpretation:** These checks support code/file consistency and reproducibility. They do not establish that 2026 uncertainty estimates are calibrated or that all poll sources are authentic.

## 2. High-priority modeling limitations

1. **Experimental probabilities are not calibrated.** The central model's shared cycle error SD (2.77 percentage points) is the RMS of only five AAPOR all-office mean signed errors (2016–2024); those are not a direct random sample of 2026 Senate-race aggregate forecasting errors. The state-error SD (3.51) comes from two Senate-poll cycles and an assumed normal transformation from MAE to RMSE, subtracting the sampling error of a typical poll. These approximations do not identify actual race-average error covariance or pollster-dependent effects. Treat displayed win/control probabilities as experimental model output, not validated forecasts.
2. **Midterm-only input count is misdescribed.** `METHODS_V20.md` and `v20/engine_v20.js` describe this setting as using *AAPOR 2018, AAPOR 2022, and Senate 2022*. However, `v20/data/calibration_errors.csv` tags only `aapor_2018` (+0.1) and `aapor_2022` (-0.6) with `sys_midterm`; the separate `aapor_senate_2022` (-1.2) is not tagged. This gives the displayed SD of sqrt((0.1² + 0.6²)/2) = 0.430, from **two values, not three**. Treat the 94% midterm-only model setting as under-supported. Note that adding the Senate 2022 number as an independent third cycle would also double-count the 2022 election and would not fix calibration.
3. **Some validation citations do not support the dated race.** `v20/data/calibration_errors.csv` uses the same Newsweek URL (an article titled 'Map Shows Republican Chances of Losing Senate Two Weeks Before Midterms') for `race_me_2020`, `race_ia_2024`, and `race_oh_2024`. The cited page does not establish all those race-level 2020/2024 average-versus-result figures. Those three figures need race- and year-specific archived polling averages and certified results, with identical margin definitions, before they count as independently sourced validation observations.
4. **Coverage evidence is weak.** Only 4 of seven selected notable misses fall in the purported central 80% interval, and five of seven in its 95% interval; leave-one-cycle-out on five cycles covers three/five at 80%. These are very small, partly selected samples. Current simulation probabilities must not be promoted as statistically validated because unit tests passed.
5. **Source coverage remains incomplete.** Field dates and sample sizes for Siena, candidate shares for AtlasIntel, and some Research Co. toplines rely on secondary sources, as acknowledged by Claude. Research Co. uses decided-voter shares (51–48 etc.) while some trackers list full-ballot shares (48–46 etc.): record the version and population explicitly; do not treat both as separate fieldwork waves. AtlasIntel adults must not silently be relabeled likely voters.
6. **H1–H4 are exploratory hypotheses even after pre-registration.** H1 and H2 use 90% intervals, and there are four tests with no familywise error control. H1 pairs cluster by pollster but can share state errors; H2 compares pollster method groups observationally across uneven state mixes; H3 has a fixed 0.5-point threshold without uncertainty interval. Preserve the hash and published decision rules, then report effect sizes, intervals and multiplicity caveats before interpreting the decisions. H4's direction alone cannot attribute an error to screening or recalled-vote weighting.
7. **Historical shifts are sensitivity tests, not justified universal corrections.** AAPOR signed errors refer to different cycles, offices, populations and methods; comparing approval levels or early party-registration ballots with earlier elections does not imply a numerical 2026 Senate adjustment. The model correctly does not apply an automatic shift for Trump approval.

## 3. Independent external cross-check

The AAPOR 2024 task force reported aggregate signed polling errors of +3.1 (2016), +0.1 (2018), +4.6 (2020), -0.6 (2022), and +2.7 (2024) in Democratic-minus-Republican terms, consistent with the five central input signs in v20. It emphasizes that polls are measurements, not forecasts. Source: https://aapor.org/announcements/2024-pre-election-polling-report/ and https://aapor.org/polling-accuracy/ .

## 4. Publication and next steps

- Publicly fingerprint the original pre-registration before voting concludes; already completed on November 2. GitHub commit timestamps establish publication time, not initial creation time.
- Keep the `v19_frozen/` baseline, official v19 snapshot and its manifest unchanged. The v20 HTML and JSON are labeled post-freeze.
- Host `docs/` on Pages as a separate experimental research dashboard. The complete v20 engine, test suite and data remain in the supplied ZIP and are **not yet all in the GitHub repository**; the hosted dashboard by itself is not a full independently executable model.
- For a future v20.1, correct the midterm input description and validation URLs only as a new, explicitly timestamped revision. Do **not** silently change the publicly timestamped v20 pre-registration rules.
- When certified results arrive, score the original v19 frozen snapshot, v20 observational averages, and H1–H4 as separate exercises, report bootstrap/correlation assumptions, and make discrepancies public.
