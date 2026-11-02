# Pre-registration: likely-voter screens and recalled-2024-vote weighting

Machine-readable version: `v20/preregistration_mike.json`, SHA-256 `15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af`. Publish this hash before polls close on Nov 3; any later change to the file changes the hash.

Hypothesis (from Mike from PA, Oct 28 2026: pollsters apply likely-voter screens and recalled-2024-vote weighting that make results too Republican). Sign convention: signed error = poll (or average) margin minus certified result margin, challenger (D or I) minus Republican, in points; negative means the poll was too Republican.

Bootstrap: 10000 replicates, seed 20261103, 90% intervals, resampling pollster (cluster) for H1 and H2; state for H3 and H4.

## H1_lv_screen
- Question: Among Senate surveys that published both likely-voter (LV) and registered-voter (RV) results, was the LV version less accurate and more Republican than the RV version?
- Data: senate_lv_rv_pairs.csv rows whose state has a certified result
- Primary metric: mean over pairs of |error_LV| - |error_RV|
- Secondary metric: mean over pairs of error_LV - error_RV
- Supports the hypothesis if: primary > 0 with the 90% interval above 0, and secondary < 0
- Contradicts it if: primary < 0 with the 90% interval below 0
- Otherwise: inconclusive
- Minimum data: at least 10 pairs from at least 4 states

## H2_recalled_vote
- Question: Were Senate polls from pollsters verified to weight on recalled 2024 vote more Republican-skewed than polls from pollsters verified not to?
- Data: included Senate polls with fieldwork ending on or after 2026-10-01, pollster tags from pollster_methods.csv (verified 'yes' vs verified 'no' only)
- Primary metric: pollster-level mean signed error, recall group minus non-recall group (each pollster weighted equally)
- Secondary metric: same comparison of mean absolute error
- Supports the hypothesis if: primary < 0 with the 90% interval below 0, and the recall group's mean absolute error is larger
- Contradicts it if: primary > 0 with the 90% interval above 0
- Otherwise: inconclusive
- Minimum data: at least 3 pollsters in each group

## H3_average_without_recall
- Question: Would the simple 30-day average have been more accurate without pollsters verified to weight on recalled 2024 vote?
- Data: v20 simple averages with and without verified recall-weighting pollsters, competitive states with results
- Primary metric: mean absolute error (without) minus mean absolute error (full)
- Supports the hypothesis if: primary <= -0.5 points and the full average's mean signed error < 0
- Contradicts it if: primary >= +0.5 points
- Otherwise: inconclusive
- Minimum data: at least 8 states

## H4_direction
- Question: Across competitive states, were the frozen v19 simple averages too Republican overall?
- Data: v19 frozen snapshot, raw simple averages
- Primary metric: mean signed error across states; count of states with negative error
- Supports the hypothesis if: mean signed error < 0 with the 90% state-bootstrap interval below 0
- Contradicts it if: mean signed error > 0 with the interval above 0
- Otherwise: inconclusive
- Caveat: Direction alone cannot identify the mechanism; H1-H3 address mechanism

## Not tested here
- Causation: a pattern by method tag is observational; pollster methods differ in many ways at once
- Respondent-level reweighting experiments (need microdata)
- Late events after fieldwork, such as the Nov 1 Michigan endorsement

Scoring: `node v20/score_v20.js data/results_2026.csv` after certification. The code was tested on constructed results in both directions (`v20/tests/test_v20.js`).
