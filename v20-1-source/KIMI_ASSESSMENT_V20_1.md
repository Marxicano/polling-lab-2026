# Kimi's audit assessed against v20's actual code (v20.1)

Scope: Kimi's independent methodology audit and ChatGPT's integration notes (`reviews/kimi/`, hashes verified: report `e2eb8376…f3d`, script `3d029c60…0f6`, workbook `2a4c17ca…422`). Kimi's reproduction script was re-run here; all its assertions pass.

Nothing published is replaced. The v19 snapshot (`7cd5e1f9…c461`), every published v20 file (`SHA256SUMS_V20.txt`) and the H1-H4 pre-registration (`15da8d6c…d1af`) are byte-identical, and tests enforce it. v20's displayed probabilities are unchanged (central Democratic control 80.4%, experimental).

## 1. Already implemented in v20
| Kimi recommendation | Where in v20 |
|---|---|
| No universal or fixed partisan correction; zero-mean baseline | `engine_v20.js` `v20_mc`: the shared error is mean zero (tested: simulated mean shift about 0) |
| Directional changes only as labeled scenarios | `v20_error_scenarios` uses only documented misses, both signs (tested); `v20_recall_split`, `v20_no_partisan` are labeled sensitivities and never feed Model 1 (tested) |
| House effects distinct from election bias | `v20_house_table` is labeled relative to other pollsters; bias is scored only after certification (H2) |
| Sponsorship as metadata, not automatic exclusion | Model 1 keeps sponsored polls; Model 2 drops them only as a labeled sensitivity |
| Approval never converted into votes; Florida registration is not candidate votes | `context_variables.csv` rows are labeled context only (tested on the site) |
| Seeds, input hashes, code fingerprint | Fixed seeds, `SHA256SUMS_V20.txt`, engine hash on the site |
| Preserve v19 and the pre-registration | Separate folders; hash tests |

## 2. Needed correction (done in v20.1 as labels, metadata and new diagnostics; no published number changes)
1. **Estimators were mixed in two v20 settings.** v20's "high" shared-error setting (3.93) appends the RealClearPolitics 2025 governor mean (-7.35) to AAPOR's all-office series, and the "midterm-only" setting (0.43) mixes AAPOR all-office 2018/2022 with Senate-only 2022. Kimi's rule is not to pool estimators. v20.1 relabels both as cross-source stress/diagnostic settings (numbers unchanged) and lists every input by comparability group (`v201_calibration_review`). Silver Bulletin's 2025 figure (-6.1) is added only as a separate stress scenario.
2. **v20's "leave-one-cycle-out" check leaked future data.** It estimated the error scale from later cycles too, so it was a cross-validation diagnostic, not a backtest. v20.1 adds a true rolling-origin backtest (`v201_rolling_origin`, exploratory E1): each test cycle uses only earlier cycles, scored by residual, t(4) coverage, log score and CRPS. It reproduces Kimi's aggregate table exactly (zero-mean MAE 2.220, RMSE 2.772; previous-presidential transport 2.900 / 3.237).
3. **Effective n was assumed silently.** The frozen v19 engine (reused unchanged by v20) uses raw n when no effective n is published, and 600 when n is missing. Only 11 of 458 included polls publish an effective n. v20.1 marks every poll's `neff_status` and shows the sensitivity: assuming a design effect of 1.5 widens the average per-poll gap margin of error from 5.9-7.3 to 7.2-9.0 points by state, and moves the recency-weighted average by at most 0.1. The simple average and the simulation do not use per-poll n, so the displayed figures do not move.
4. **RedBox wave labels and provenance.** The two poll rows were already distinct: FL-020 (Oct 20-23, n 4,823, effective 1,520, design effect 3.17, Moody +6.8) and FL-NOV01-REDBOX2 (Oct 30-31, n 2,898, effective 2,120, design effect 1.37, Moody +3). But `recall_targets.csv` called the second wave the "Nov wave," and the weighting-target table had no wave id or retrieval time. `v201_redbox_waves` now records each wave's targets with the evidence behind them. Wave-1 targets rest on Claude's Oct 29 read and Kimi's transcription time-stamped Oct 29 09:17. Wave-2 targets rest on ChatGPT's Nov 1 read. The live methodology URL now documents wave 2, so wave-1 methodology can't be re-verified there. One open conflict: Kimi's Nov 2 report calls the party targets (R 50.0 / D 28.9 / NPA 18.4) "final," yet those values match the Oct 29 wave-1 transcription and ChatGPT reported the targets were revised Oct 31. This is unresolved without an archived copy. Wave-1 arithmetic reproduces Kimi: mixture 6.808, already-voted break-even 0.59424.
5. **Data contract.** v20.1 adds, for all 461 rows: release group, raw and effective n with status, recalled-vote use, weighting recipe, sponsor affiliation, evidence status, source version and retrieval time, with explicit nulls and reason codes. Retrieval times were not recorded before v20, so 443 rows say so.
6. **Provenance wording.** Kimi says its earlier tables were chat tables, not original exports. The folder name `original_kimi_exports` is kept unchanged inside frozen v19 and published v20. `reviews/kimi/PROVENANCE_NOTE_V20_1.md` states they are CSV transcriptions of the Kimi chat tables.

## 3. Trialed as diagnostics, not adopted (displayed probabilities unchanged)
- **Hierarchical correlation (regional share).** Holding each state's total uncertainty at v20's value and moving 25% or 50% of the state error into a shared Census-region component, Democratic control goes 80.2% to 80.0% to 78.5%. The seat range stays 48-56, and per-state chances stay put. The probabilities are not very sensitive to this assumption, and the share cannot be estimated from available data.
- **Mean rules (rolling origin, 4 folds).** Over all folds a half-shrunk running mean scores slightly better than zero mean (CRPS 1.48 vs 1.63), driven by presidential years. On the two midterm folds, zero mean is clearly best (CRPS 0.76 vs 1.09 shrunk, 1.86 running mean, 2.67 previous-presidential). With four folds, this supports keeping the zero-mean baseline for a midterm and nothing more.
- **Recall-weighting scenario (E2, hypothetical).** This moves only polls from pollsters documented to weight on recalled 2024 vote, toward the challenger, by kappa × b (b = 1.0 from State Navigate's modeled claim, or 2.2 from Kimi's recall-margin reconstruction; neither validated as a horse-race error). Only 32 of 187 window polls qualify. Even at full transport (2.2 points) state averages move 0.3 on average and at most 0.7, and only Iowa changes leader (seats 54-46 instead of 53-47).

## 4. Cannot be validated with available data
- Regional, office, state, contest and late-movement error scales: need a contest-level historical dataset of election-eve averages and certified results with information freezes (not in the repository; AAPOR's public repository lacks its poll-level data, per Kimi).
- Calibrated chamber-control probabilities: five cycle-level points cannot calibrate them; v20's probabilities stay labeled experimental.
- A 1-2 point national horse-race effect of recalled-vote weighting: needs respondent microdata and State Navigate's private cells.
- RedBox's turnout model, and wave-1 methodology from the live URL.
- Likely-voter screen backtests (Kimi's S0-S4): need respondent-level data and validated turnout.
- Design effects for the 446 polls that do not publish an effective n.

## 5. Pre-registration
H1-H4 and `score_v20.js` are unchanged. New analyses are registered separately as exploratory E1-E3 (`v20_1/exploratory_registry_v201.json`, SHA-256 `f0e7978b1fc5c79d4d1e4948a269aae21c57900b01a5edb7957d587c6a767677`). `score_v201.js` runs the unchanged v20 scorer first and reports E2/E3 separately.
