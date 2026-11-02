# v20 methods, calibration and validation

All margins are challenger minus Republican, in points (challenger = Democrat, except Nebraska's independent Dan Osborn). "Signed error" = poll or average minus result; positive means polls overstated the challenger/Democrats. As-of date: Nov 2, 2026.

## Models (each changes one assumption)
| Model | Calc | Rule |
|---|---|---|
| 1. Published-poll averages | `v20_published` | The five v19 methods (simple, per-pollster, likely-voter-only, recency-weighted, house-adjusted), unchanged code, on v20 data. Simple = mean of included polls with fieldwork ending in the last 30 days (three most recent if fewer). |
| 2. No partisan sponsors | `v20_no_partisan` | Model 1 simple after dropping every poll with a partisan or campaign sponsor flag, either side. Mississippi has no unflagged polls, so it shows no estimate. |
| 3a. Symmetric trim | `v20_trimmed` | Drop the three most Republican- and three most Democratic-leaning pollsters by house effect (co/efficient, Stetson, Quantus; St. Pete Polls, Impact Research, Concord). |
| 3b. House-effect table | `v20_house_table` | Lean relative to other pollsters in the same states, with recalled-vote and party-weighting tags. Relative, not accuracy. |
| 3c. Recalled-vote split | `v20_recall_split` | Simple averages without verified recalled-vote-weighting pollsters, and using only verified non-recall or only recall pollsters. |
| 4. Historical error scenarios | `v20_error_scenarios` | Each documented miss in `calibration_errors.csv` applied uniformly. No shift appears that is not in that file. |
| 5. Turnout sensitivity | `v20_turnout` | Likely-voter-only averages, registered-voter versions of same-survey pairs, screen-shift scenarios, national screen shift. |

## Uncertainty framework (`v20_calibration`, `v20_mc`)
For simulation k and competitive state s:

  margin(s,k) = Model-1 simple(s) + e_sys(k) + e_state(s,k) + e_avg(s,k)

- e_sys: one shared error per simulation, Student-t with 4 degrees of freedom rescaled to SD sigma_sys, **mean zero**. It makes misses move together across states.
- e_state: independent normal, SD sigma_state.
- e_avg: independent normal, SD = standard error of that state's window polls (minimum 0.5).
- Winner: challenger if margin > 0. Seats add to the non-competitive base from v19 (`seat_math`). Democratic control = 51+ Democrats; Republicans keep control at 50+ because the vice president breaks ties; otherwise "no majority without Osborn."
- 20,000 simulations per setting, seeds 20261102-20261105. Reproducible (tested).

| Parameter | Value | Derivation |
|---|---|---|
| sigma_sys (central) | 2.77 | RMS of AAPOR all-office signed errors 2016, 2018, 2020, 2022, 2024 (3.1, 0.1, 4.6, -0.6, 2.7) |
| sigma_sys (high) | 3.93 | Same plus the 2025 off-year mean miss (-7.35) |
| sigma_sys (midterm-only) | 0.43 | AAPOR 2018, 2022 and Senate 2022 only; three numbers, almost certainly overconfident; shown for transparency, excluded from the headline range |
| sigma_state | 3.51 | AAPOR Senate polls 2022 and 2024: RMSE = MAE x sqrt(pi/2), minus each cycle's mean squared and a typical 2026 poll's sampling variance (median SD 3.28); 2024's residual is negative and floored at 0 |
| tail df | 4 | Assumption: heavy tails for the shared error |

Checks (tests): the shared error has mean about 0; the simulated correlation between two states (0.385) matches the model's implied value (0.379); probabilities sum to 1; narrower settings concentrate probability on the median outcome.

### Validation (`v20_validation`)
- **Coverage on documented misses** (7: NJ 2025 -9.7, VA 2025 -5.0, NJ 2021 +5.0, Maine Senate 2020 +12.4, Iowa 2024 presidential +8.5, Ohio 2024 presidential +3.5, 2024 generic ballot +3.5): 4 of 7 inside the central 80% interval (-5.6 to +5.6), 5 of 7 inside the 95% interval (-8.9 to +8.9).
- **Leave-one-cycle-out** on the five AAPOR cycles: 3 of 5 inside 80%, 4 of 5 inside 95% (2020 falls outside both).
- Some validation cases were recorded because they were notable misses, which biases coverage downward; the sample is also tiny. Either way the settings are **not validated**, so every probability is labeled experimental and the dashboard leads with the historical-scenario range.

## Results as of Nov 2
| Setting | Shared SD | P(D control) | P(R control) | P(no majority w/o Osborn) | D seats 5th-50th-95th |
|---|---|---|---|---|---|
| Central | 2.77 | 80% | 18% | 2% | 48 - 53 - 56 |
| High | 3.93 | 75% | 23% | 2% | 47 - 53 - 56 |
| Central, normal tails | 2.77 | 78% | 21% | 2% | 48 - 53 - 56 |
| Midterm-only (overconfident) | 0.43 | 94% | 4% | 2% | 50 - 53 - 55 |

Historical scenarios (Model 4), Democratic seats: 2025 off-year pattern (-7.35) 56 (+Osborn); AAPOR Senate 2022 (-1.2) 54 (+Osborn); 2022 (-0.6) 54; no error 53; 2018 (+0.1) 53; Senate 2024 (+2.4) 52; 2024 (+2.7) 51; 2016 (+3.1) 49; 2024 generic (+3.5) 48; 2020 (+4.6) 47; NJ 2021 (+5.0) 47.

Race table (raw margins): frozen v19 → Model 1 → no partisan / trimmed / without recall-weighted; experimental chance the challenger leads (central) and 80% range:

| State | v19 frozen | Model 1 | No partisan | Trim | No recall-wtd | Chance | 80% range |
|---|---|---|---|---|---|---|---|
| IA | R+0.2 | R+0.3 | R+0.3 | D+0.1 | R+0.5 | 47% | R+6.0 to D+5.3 |
| NE (I) | R+0.9 | R+0.9 | R+2.1 | R+1.7 | R+1.2 | 42% | R+6.6 to I+4.8 |
| SC | R+1.2 | R+1.2 | R+2.7 | R+1.6 | R+1.2 | 39% | R+7.0 to D+4.6 |
| AK | D+2.5 | D+2.4 | D+2.4 | D+2.4 | D+2.4 | 71% | R+3.1 to D+8.0 |
| OH | D+2.6 | D+2.7 | D+2.7 | D+2.9 | D+2.3 | 73% | R+2.9 to D+8.2 |
| KS | D+2.7 | D+2.9 | D+3.1 | D+2.9 | D+3.7 | 75% | R+2.9 to D+8.6 |
| TX | D+3.0 | D+3.1 | D+2.9 | D+3.3 | D+2.9 | 76% | R+2.5 to D+8.7 |
| ME | D+3.1 | D+3.3 | D+3.3 | D+3.3 | D+3.2 | 78% | R+2.3 to D+9.0 |
| MI | D+3.5 | D+3.9 | D+3.8 | D+4.1 | D+4.0 | 81% | R+1.8 to D+9.5 |
| MN | D+5.2 | D+5.2 | D+5.1 | D+5.2 | D+5.2 | 88% | R+0.5 to D+10.8 |
| FL | R+6.0 | R+6.0 | R+6.4 | R+5.9 | R+6.0 | 9% | R+11.6 to R+0.3 |
| MS | R+7.3 | R+7.3 | none | R+6.0 | R+7.3 | 8% | R+14.2 to R+0.5 |
| NH | D+7.4 | D+7.4 | D+7.4 | D+7.4 | D+7.4 | 95% | D+1.8 to D+13.0 |
| GA | D+9.4 | D+9.4 | D+9.4 | D+9.8 | D+9.4 | 98% | D+3.5 to D+15.4 |
| NC | D+10.4 | D+10.4 | D+10.8 | D+10.5 | D+10.8 | 99% | D+4.8 to D+16.1 |

Generic ballot: D+8.6 across 37 releases (frozen v19: D+8.5).

## Methodology panel (descriptive, relative to other polls)
- Same-survey screen shift: likely voters R+1.0 more Republican than registered voters across 33 pairs; R+2.3 in 11 October pairs; R+0.3 in October without Marist.
- Pollsters verified to weight on recalled 2024 vote lean +0.3 (slightly more Democratic) relative to verified non-recall pollsters in Senate polls (11 pollsters); +0.2 in the generic ballot (6). Setting recall-weighting pollsters aside changes state averages by +0.01 on average.
- GrayHouse's Iowa recall target (Trump 54, Harris 43 = R+11) is 2.2 points less Republican than the 2024 result (R+13.2).
- None of this shows which polls are right; the pre-registered tests do that after certification.

## Limitations
Post-freeze intake covers named late releases and PollCheck lists checked Nov 2, not every poll. Siena fieldwork dates and sample sizes, AtlasIntel candidate shares and Research Co. full-ballot shares rest on secondary sources (flagged per row). Research Co. rows use the decided-voter shares from its release. AtlasIntel Texas is an adult sample. Method tags are pollster-level and many pollsters are untagged. The Nov 1 Michigan endorsement is not measured by any poll. The simulation assumes one shared national error; regional or demographic correlation beyond that is not modeled.
