# Polling Lab 2026 Election-Eve Model: Independent Scientific Audit

**Audit date:** 2026-11-02  
**Scope:** Methodology for a separate, experimental election-eve model. The published v19 estimates are frozen and are not modified here.  
**Companion tables:** `Polling_Lab_2026_audit_tables.xlsx`  
**Reproduction calculations:** `Polling_Lab_2026_reproduction.txt`

## Executive determination

1. **Do not apply a uniform partisan correction.** AAPOR’s consistent archive shows large Democratic-overstatement errors in the 2016, 2020, and 2024 presidential environments, but near-zero and oppositely signed midterm aggregates in 2018 and 2022. Silver Bulletin’s different database finds a large Republican-direction error in the small 2025 off-year set. These are not a stable party-specific bias process.
2. **Past errors are more defensible for calibrating uncertainty than for shifting the 2026 mean.** A five-cycle aggregate stress test shows that transporting the previous presidential-cycle error is beneficial in the two presidential transitions examined but harmful in both midterms. This is not enough evidence to estimate a 2026 directional adjustment.
3. **State Navigate’s recall mechanism is plausible and partially supported by public panel transitions.** Its national 1–2-point horse-race adjustment is not independently reproducible from public microdata. The public October Verasight transitions can reproduce an illustrative **2.215-point recalled-margin component**, but that is arithmetic transport under simplifying assumptions, not validation of a national causal effect.
4. **A Republican-direction effect is possible in some polls, not all polls.** The pathway requires recall error to enter sampling, weighting, turnout modeling, or vote-choice modeling, and requires current vote preference to differ between consistent and inconsistent recallers. Recall inconsistency by itself does not mechanically change a horse-race estimate.
5. **Florida’s administrative early-vote data measure party registration, not candidate votes.** The official 2026-11-02 08:09 AM snapshot records 5,402,229 returned mail ballots or in-person early ballots: 40.254% Republican, 37.754% Democratic, 19.426% NPA, and 2.566% Other by registration. These are neither final electorate shares nor Moody/Nixon votes.
6. **RedBox’s published subgroup arithmetic is internally consistent.** Its overall Moody +6.808 result is an exact weighted mixture of its already-voted and not-yet-voted estimates to displayed precision. Its 4,823 interviews have effective n = 1,520; design effect = 3.173. The already-voted break-even share is 59.424%, conditional on holding both subgroup margins fixed—a sensitivity calculation, not a forecast.
7. **Use a hierarchical, correlated, heavy-tailed error model.** Draw national, regional, office, state, contest, and late-movement errors jointly. Estimate and calibrate them with rolling-origin contest-level backtests. Do not simulate independent state errors or treat hundreds of clustered polls as hundreds of independent election-level observations.

## 1. Evidence rules and estimands

### 1.1 Labels used throughout

- **Observed administrative fact:** an official ballot, turnout, registration, or certified-result record.
- **Observed survey estimate:** a published poll result or panel response. It is observed as a survey output, not as ground truth about the electorate.
- **Published aggregate:** a number printed by a source but not recomputed from underlying poll-level records.
- **Reproduced arithmetic:** a calculation repeated from public inputs.
- **Modeled estimate:** an output requiring assumptions about turnout, transportability, approval, loyalty, or weights.
- **Speculation / hypothesis:** a causal explanation or future-direction claim that has not been identified by the design.
- **Not independently verifiable:** required microdata, private cells, code dependencies, or public denominators are unavailable.

### 1.2 Signed error

For poll or matchup \(i\) in contest \(c\), using Democratic-minus-Republican two-party margins:

\[
e_i=(D_i-R_i)_{\text{poll}}-(D_c-R_c)_{\text{certified}}.
\]

Positive \(e_i\) means the poll overstated Democrats; negative means it overstated Republicans. A correction that removes estimated historical error \(\widehat e\) is:

\[
m_i^{\text{corrected}}=m_i^{\text{poll}}-\widehat e.
\]

Thus subtracting 2 points is a Republican-direction adjustment to the polled D–R margin. The report avoids the ambiguous phrase “D+2 correction.”

Keep these metrics distinct:

\[
\overline e=\frac1N\sum_i e_i,\qquad MAE=\frac1N\sum_i|e_i|,\qquad RMSE=\sqrt{\frac1N\sum_i e_i^2}.
\]

Correct-winner rate, median error, poll-level averages, and contest-level averages answer different questions. A prolific pollster can dominate an unweighted poll-level mean. AAPOR’s reposting adjustment addresses duplicate releases, but poll clustering by contest, firm, and cycle remains.

### 1.3 Source normalization

AAPOR’s updated archive generally uses a final-14-day window and certified outcomes. Silver Bulletin generally uses a final-21-day window and a different database. Silver’s “bias toward Republicans” is converted to negative AAPOR-style signed error only in the normalized table; the original wording and comparability group are retained. No AAPOR–Silver pooled average is calculated.

## 2. Historical signed errors, 2018–2025

### 2.1 Consistent AAPOR evidence

| Year | Contest set | Timing | Records | Signed error, pp | Absolute error, pp |
|---|---|---:|---:|---:|---:|
| 2018 | All included midterm contests | Midterm | not printed | +0.1 | not located |
| 2020 | All included contests | Presidential | not printed | +4.6 | 5.3 |
| 2020 | National presidential | Presidential | not printed | +3.7 | 4.1 |
| 2020 | State presidential | Presidential | 375 | +4.0 | 4.8 |
| 2020 | Senate | Presidential | not printed | not located | 6.0 |
| 2022 | All included midterm contests | Midterm | not printed | −0.6 | not located |
| 2022 | Senate | Midterm | 150 | −1.2 | 4.8 |
| 2024 | All contests | Presidential | 611 | +2.7 | 3.3 |
| 2024 | National presidential | Presidential | 60 | +2.5 | 2.6 |
| 2024 | State presidential | Presidential | 291 | +2.6 | 3.0 |
| 2024 | Senate | Presidential | 197 | +2.4 | 3.3 |
| 2024 | Governor | Presidential | 27 | +3.8 | 5.0 |
| 2024 | House | Presidential | 28 | +4.9 | 7.0 |

**Source:** [AAPOR 2024 task-force report](https://aapor.org/wp-content/uploads/2025/10/AAPOR-Task-Force-on-2024-Pre-Election-Polling_Report.pdf), especially Sections 2.1–2.2 and Appendices H–I. These are published aggregates, not independently recomputed poll-level estimates.

The older AAPOR 2020 report gives a legacy 2018 Senate-plus-governor estimate of +0.1 signed and 4.6 absolute, and a 2020 Senate-plus-governor estimate of +6.0 signed and 6.7 absolute. Those combined contest sets must not be relabeled “Senate-only.” A fully comparable 2018 Senate-only signed estimate was not located. Source: [AAPOR 2020 report](https://aapor.org/wp-content/uploads/2022/11/AAPOR-Task-Force-on-2020-Pre-Election-Polling_Report-FNL.pdf).

**Version distinction:** the older 2020 report printed +4.3 signed and 5.1 absolute for state presidential polls; the updated consistent archive prints +4.0 and 4.8. Use the updated values for cross-year comparisons and preserve the older values only as a versioned alternative.

### 2.2 Off-year and special elections in 2025

Silver Bulletin’s January 2026 retrospective covers approximately 40 qualifying polls, generally from the final three weeks:

| 2025 contest set | Signed error in common D–R notation | Average absolute error |
|---|---:|---:|
| Qualifying governor and House specials | −6.1 pp | 7.1 pp |
| New Jersey governor | −9.0 pp | 9.0 pp |
| Virginia governor | not transcribed | 5.9 pp |
| Two House special polls | +8.4 pp | not printed |

Source: [Silver Bulletin, 2026-01-14](https://www.natesilver.net/p/actually-sometimes-polls-underestimate). The negative overall sign denotes polls too Republican; the two House specials are an opposite-direction counterexample. New York City’s multiparty mayoral race is not forced into this two-party metric. State Navigate and YouGov each averaged 2.4-point error across only two polls per firm—far too little for a stable firm ranking.

These 2025 numbers are **not appended to AAPOR’s series as if they were the same estimator**. Early analyses using incomplete returns and later final-result retrospectives are also separate evidence objects.

### 2.3 What can transfer to 2026?

**Defensible uses**

- Estimate heavy-tailed error scales by office and election type.
- Choose correlation structures and test whether national errors dominate state errors.
- Evaluate likely-voter and house-effect rules with historical information freezes.
- Show that reported sampling MOE is not a complete forecast interval.

**Not defensible without new validation**

- Assume the 2016–2024 presidential sign persists in a midterm without Trump on the ballot.
- Treat 2025’s small off-year set as a precise estimate of 2026 error.
- Infer a candidate-specific 2026 adjustment from another state, candidate, or turnout environment.
- Fit on 2016–2024 and then advertise the same cycles as independent validation.

Pollsters, modes, weighting practices, candidates, campaign salience, and turnout all change. A cycle-level mean is a noisy realization of a shared error process, not a fixed property of a party.

## 3. Independent audit of State Navigate’s “Total Recall Bias”

Primary source: [State Navigate, Total Recall Bias](https://projects.statenavigate.com/features/total-recall-bias/).

### 3.1 What is publicly observed

State Navigate reports 28 polls since mid-September, 14 recontact surveys, and 3,741 respondents answering both waves. Its samples are concentrated in Pennsylvania, Virginia, West Virginia, and Iowa—not a national probability sample.

- Pennsylvania: 7,198 first-wave respondents re-texted; 36% answered. Across nine district follow-ups, changed answers accounted for an average 32% of total recall-composition change; most change came from a different respondent mix.
- Virginia: 3,083 people texted, 932 matched responses, weighted effective n = 447.
- West Virginia: 472 and 421 matched recontacts.
- Iowa: 164 matched recontacts, including only 71 Trump recallers; appropriately restricted to pooled change figures.

These are **recontact estimates conditional on initial response and subsequent response**. Panel conditioning, attrition, targeted follow-up, and geographic selection remain possible. A voter file can validate turnout; it cannot reveal the secret-ballot candidate choice.

The Verasight “profile” is an earlier survey response, collected after the 2024 election or at panel entry. It is generally closer in time to the vote than a 2026 recall answer, but it is not administrative validation of candidate choice.

### 3.2 Public transition evidence

Morris’s October 13–19 Verasight poll has n = 2,028 adults. Public row denominators are 754 Trump-profile respondents, 809 Harris-profile respondents, 121 other-candidate profiles, and 344 nonvoter profiles. Weighted transitions include:

- Trump profile: 6.4% changed; 3.2% now say Harris, 1.0% another candidate, 0.4% voted but not for president, 1.5% did not vote, and 0.4% do not remember. Components can differ by rounding.
- Harris profile: 4.1% changed; 1.4% now say Trump.

The raw cross-switch counts are only 22 Trump-to-Harris and 11 Harris-to-Trump. Unweighted rates and simple Wilson 95% intervals are:

| Transition | Raw rate | Illustrative Wilson 95% interval |
|---|---:|---:|
| Trump profile → Harris | 22/754 = 2.918% | 1.935%–4.378% |
| Harris profile → Trump | 11/809 = 1.360% | 0.761%–2.418% |

Source: [Morris / Strength In Numbers / Verasight](https://www.gelliottmorris.com/p/2026-10-22-trump-voters-rewriting-2024-vote). These intervals are unweighted simple-random-sample approximations, not design-adjusted intervals and not confidence intervals for national polling bias.

Jain’s pooled February report describes 12,180 registered voters from August 2025–February 2026. Among Trump-profile voters who disapproved of Trump, 13% reportedly claimed Harris and 12% claimed not to have voted; among approving Trump voters, 98% reportedly recalled Trump. Among Harris-profile voters approving of Trump, 18% reportedly claimed Trump, versus 0.4% among disapprovers. Full subgroup denominators and microdata are not public. “Preference reconciliation” is a plausible interpretation, not a causally identified mechanism. Source: [Jain / The Argument](https://www.theargumentmag.com/p/the-trump-voters-telling-pollsters).

### 3.3 Arithmetic reconstruction of the recall-margin component

Let \(T\) and \(H\) be true 2024 Trump and Harris shares in a chosen target population. Let \(p_{T\to H}\) be the fraction of true Trump voters now claiming Harris, and similarly for other destinations. A switch to the opposite major candidate moves the D–R recalled margin twice; movement to another candidate, nonvoting, or an unclassified answer moves it once. Holding other profile groups aside:

\[
\Delta r \simeq T\left(2p_{T\to H}+p_{T\to O}+p_{T\to N}+p_{T\to U}\right)
-H\left(2p_{H\to T}+p_{H\to O}+p_{H\to N}+p_{H\to U}\right).
\]

For an illustrative two-party-normalized national reconstruction, the FEC shares 49.80% Trump and 48.32% Harris imply \(T=0.507542\), \(H=0.492458\). Applying Morris’s public weighted rates:

\[
\begin{aligned}
\text{cross-switch component}
&=200\left(T\cdot0.032-H\cdot0.014\right)=1.8694\text{ pp},\\
\text{one-category component}
&=100\left[T(0.010+0.004+0.015+0.004)-H(0.041-0.014)\right]\\
&=0.3453\text{ pp},\\
\Delta r&\simeq2.2146\text{ pp}.
\end{aligned}
\]

This reproduces the approximate magnitude of State Navigate’s national recall-margin claim. It **does not** reproduce Nuttycombe III’s district model or prove a horse-race effect. It assumes national transportability, uses rounded weighted transitions, normalizes to major-party 2024 voters, and omits separate other-candidate/nonvoter contributions. FEC source: [official 2024 presidential results](https://www.fec.gov/documents/5644/2024presgeresults.pdf).

Using only the raw cross-switch counts gives a partial component of 1.623 points. Mechanically propagating independent Wilson bounds gives −0.418 to +3.695 points; that range is an illustration of small-count uncertainty, not a valid national confidence interval.

### 3.4 From recall error to horse-race error

There is no universal one-to-one conversion. If a poll weights on recalled vote, its current margin can be written as a weighted sum over recall groups \(g\):

\[
\widehat m=\sum_g \widehat w_g\widehat m_g.
\]

Misclassification changes both the weights and which current voters inhabit each group. The effect depends on current candidate preferences among inconsistent recallers, the target recalled-vote distribution, treatment of nonvoters and third-party voters, and interactions with other weights. A poll that does not use recall in sampling, screening, weighting, or vote modeling has no mechanical horse-race shift merely because respondents’ recall answers changed.

State Navigate’s worked example moves a generic ballot from D+10.4 to D+9.3: **a 1.1-point Republican-direction modeled adjustment**. Its reported ranges are approximately 1.0–1.1 points when “did not vote” is a separate target and 1.7–2.2 points when only reported voters are raked. These remain model-based estimates.

### 3.5 What cannot be independently verified

- Jain’s pooled January–October file reportedly contains 11,530 registered voters and detailed age/education/race/approval cells. State Navigate explicitly says those cells were privately shared and unpublished.
- Nuttycombe III uses those private cells, a separate district approval model, marginal demographic multipliers, and fallback rules for cells below 20. Public materials are insufficient to regenerate its district outputs and uncertainty.
- Age, education, and race factors are multiplied without fully crossed cells. Interactions are therefore assumed rather than estimated.
- The nonwhite Trump factor is derived by recorded vote only while the base layer already incorporates approval. This creates a plausible double-counting/transportability concern, not a proven numerical error.
- The February-to-October approval slope is small and estimated across panel waves; it must not be repurposed as a direct approval-to-vote transition.
- State Navigate’s own wording is inconsistent: one takeaway calls the error “in favor of Democrats,” while the mechanism and worked example move the margin toward Republicans and the conclusion discusses undershooting Democrats. Treat that bullet as an editorial sign inconsistency.

### 3.6 Counterevidence

State Navigate’s Pennsylvania voter-file analysis reports that 4–9% of likely-voter samples were recorded 2024 nonvoters. Among 408 recorded nonvoters, weighted 57% claimed a 2024 vote; raw counts included 117 claiming Harris, 133 Trump, 13 third party, and 140 admitting nonvoting. The estimated net recall-margin effect was approximately +0.1 point—close to offsetting. Raw counts should not be divided to reproduce a weighted 57%.

Its Virginia 2025 electorate reconstruction depends on exit-poll loyalty assumptions. Alternative reported loyalty inputs move the inferred 2024 Harris margin from roughly +9.4 to +11.2/+11.7. That is inferred composition, not certified administrative history.

**Audit conclusion:** a real response-inconsistency phenomenon is supported; a poll-specific Republican-direction bias is plausible; a universal national 1–2-point 2026 adjustment is not independently established.

## 4. Could 2024 methods move some 2026 polls Republican?

### 4.1 Differential nonresponse

Yes. If Republicans or Republican-leaning low-propensity voters are less likely to respond, demographic weights can fail when respondents within demographic cells differ politically from nonrespondents. Pew reports that political weighting improved its 2020 and 2024 postelection estimates by about 1–2 points per candidate, or roughly 2–3 points on the margin, in its own experiments. That is evidence for Pew’s design, not a transferable 2026 correction. Pew also warns that future efficacy can change and that past-vote weighting does not eliminate error. Sources: [Pew 2026](https://www.pewresearch.org/wp-content/uploads/sites/20/2026/09/PM_2026.9.16_party-weighting_report.pdf) and [Pew 2025](https://www.pewresearch.org/decoded/2025/07/23/why-and-how-were-weighting-surveys-for-past-presidential-vote/).

### 4.2 Recalled-vote weighting

Yes, conditionally. If disaffected 2024 Trump voters stop acknowledging that vote and those still claiming Trump are more Republican in 2026, raking the remaining group to the certified Trump share can over-weight a more loyal subgroup. The direction can reverse when the other party’s voters disown their prior vote more, when false turnout claims offset the margin, or when the recall target represents a different electorate.

### 4.3 Likely-voter screens

Yes, in either direction. A screen can remove low-propensity Republicans who would have voted, include irregular voters who will not, or import recalled-vote errors into turnout scores. AAPOR 2024 found multivariate turnout models and registration-based screens somewhat more accurate on average than simple self-report, and continuous turnout probabilities somewhat better than dichotomous classifications. The differences were modest and confounded with firm practices; they do not identify a universally best screen.

AAPOR 2020 found no evidence that the national error was caused by polls having too few Election Day voters or too many early voters. It also found that validated turnout did not show Trump supporters and Biden supporters turning out at materially different rates after saying they would. That does not imply turnout modeling is irrelevant in 2026; it rejects a simple retrospective explanation.

### 4.4 Counterexamples to a permanent Republican-direction adjustment

- AAPOR midterm aggregates: +0.1 in 2018 and −0.6 in 2022.
- AAPOR 2022 Senate: −1.2.
- Silver 2025 qualifying off-year polls: −6.1 in common notation.
- Silver’s two 2025 House special polls: +8.4, showing within-year heterogeneity.
- State Navigate’s Pennsylvania “phantom voter” analysis: approximately offsetting recall-margin effect.
- Pew: political weighting can help now but is not guaranteed to help in every environment.

## 5. Florida early voting and Moody–Angie Nixon

### 5.1 Official administrative snapshot

Florida’s official county-compilation page reports the following at **2026-11-02 08:09 AM ET**. “Voted early” below means early in person; outstanding mail ballots are excluded from ballots cast.

| Ballot category | Republican | Democratic | NPA | Other | Total |
|---|---:|---:|---:|---:|---:|
| Voted vote-by-mail | 678,709 | 832,610 | 382,282 | 47,774 | 1,941,375 |
| Voted early in person | 1,495,880 | 1,206,968 | 667,172 | 90,834 | 3,460,854 |
| **Combined cast/returned** | **2,174,589** | **2,039,578** | **1,049,454** | **138,608** | **5,402,229** |
| **Combined registration share** | **40.254%** | **37.754%** | **19.426%** | **2.566%** | **100%** |

The Republican-minus-Democratic registration gap is 135,011 ballots, or 2.499 points of the combined total. Separately, 515,059 provided mail ballots were not yet returned in this snapshot. Source: [Florida Department of State official reports](https://countyfilesvbm-ev.floridados.gov/VoteByMailEarlyVotingReports/PublicStats). County reports are cumulative through the prior day and can have different compilation times; do not blend snapshots from different trackers or timestamps.

**Interpretation boundary:** these are administrative counts by party registration. They do not reveal votes for Moody, Nixon, or any other candidate, and they are not the final electorate.

### 5.2 RedBox modeled electorate

RedBox’s final likely-electorate targets include 50.0% Republican, 28.9% Democratic, and 18.4% no party affiliation. Its current-early-vote registration comparison would differ by approximately +9.75 points Republican and −8.85 points Democratic, but this is **not an apples-to-apples validation**: RedBox models the final electorate, whereas the official table describes ballots already cast at an earlier timestamp. Election Day turnout and subsequent mail returns can change composition. Source: [RedBox methodology](https://afightworthhaving.com/polling/2026/florida/methodology).

RedBox also uses recalled/validated 2024 vote anchors in its weighting recipes. This makes recall and turnout assumptions relevant audit dimensions, but does not establish the size or direction of any error.

### 5.3 Published survey estimates and effective precision

| Subgroup | Raw n | Effective n | Design effect | Moody | Nixon | Moody margin | Approx. margin 95% sampling MOE |
|---|---:|---:|---:|---:|---:|---:|---:|
| Overall | 4,823 | 1,520.0 | 3.173 | 49.605% | 42.797% | +6.808 | ±4.82 pp |
| Already voted | 2,025 | 632.7 | 3.201 | 39.774% | 55.322% | −15.548 | ±7.50 pp |
| Not yet voted | 2,798 | 887.3 | 3.153 | 56.625% | 33.854% | +22.770 | ±6.08 pp |
| Self-identified independents | 1,547 | 463.5 | 3.338 | 30.812% | 52.852% | −22.040 | ±8.08 pp |

Source: [RedBox crosstabs](https://afightworthhaving.com/polling/2026/florida/crosstabs.pdf). These are weighted survey estimates, not counted ballots.

For respondent weights \(w_i\):

\[
n_{\text{eff}}=\frac{(\sum_i w_i)^2}{\sum_i w_i^2},\qquad deff=\frac{n}{n_{\text{eff}}}.
\]

For candidate shares \(p_D,p_R\), margin \(d=p_D-p_R\), an effective-n multinomial approximation is:

\[
SE(d)\approx\sqrt{\frac{p_D+p_R-d^2}{n_{\text{eff}}}}.
\]

This matches RedBox’s approximate overall ±4.8-point candidate-gap MOE. It excludes coverage, nonresponse, turnout-target, model-selection, recall, and late-movement uncertainty. A single-share MOE and a candidate-margin MOE must not be interchanged.

### 5.4 Exact mixture and sensitivity

Let \(s\) be the weighted already-voted share. Holding the two published subgroup margins fixed:

\[
M(s)=s(-15.548196)+(1-s)(22.770369)
=22.770369-38.318565s.
\]

At RedBox’s \(s=0.41657011\), \(M=6.808000\) to displayed precision. The break-even is:

\[
s^*=\frac{22.770369}{38.318565}=0.59423856\approx59.424\%.
\]

This calculation does **not** say the actual already-voted share will be 59.424%, nor that subgroup preferences would remain fixed if turnout composition changed. It must remain outside polling averages and candidate-vote inference.

## 6. House effects, sponsorship, effective samples, and uncertainty

### 6.1 House effect is not election bias

For poll \(p\) in contest \(c\) at time \(t\), define a leave-firm-out polling benchmark \(\overline y_{c,t,-f}\):

\[
h_f\approx\text{average}\left(y_p-\overline y_{c,t,-f}\right),
\qquad
b_f\approx\text{average}\left(y_p-M_c^{\text{certified}}\right).
\]

The first is a house effect; the second is signed election error. A Republican house effect can coexist with Democratic election bias when the certified result is even more Republican. Estimate \(h_f\) with partial pooling, inverse-variance weights, time decay, and contest/time fixed effects. Do not hard-code a permanent sponsor-party correction.

### 6.2 Partisan sponsorship

Sponsorship is a disclosure and modeling covariate, not proof of manipulation. AAPOR found Republican-affiliated firms slightly more accurate in 2024, but the pattern did not replicate in 2022 and may reflect Republican house effects aligning with that year’s Democratic-overstatement error. Include sponsor affiliation and transparency indicators in preregistered models; do not exclude or boost polls solely because of sponsorship.

RedBox Florida discloses sponsorship by A Fight Worth Having, a super PAC, and conduct by its in-house RedBox unit. That fact belongs in the metadata and conflict-of-interest assessment; it is not evidence that its arithmetic is wrong.

### 6.3 Why reported MOE is insufficient

AAPOR 2024 reports certified results outside the poll’s reported MOE for 34% of all included matchups, 29% of state presidential, 33% of Senate, and 48% of national presidential matchups. These rates are not a pure calibration test of a forecast distribution, but they demonstrate why a sampling MOE cannot serve as the total election-eve uncertainty.

For aggregation, use:

\[
\operatorname{Var}_{\text{total},p}
=v_{\text{sampling}}(n_{\text{eff},p})
+v_{\text{house},p}
+v_{\text{turnout target},p}
+v_{\text{nonresponse/coverage},p}
+v_{\text{late movement},p}.
\]

Some components are latent and partially correlated; do not pretend they are all independently measured. Fit them through hierarchical errors and validate total predictive coverage. If only raw n is available, effective n is unknown. Do not silently set \(n_{\text{eff}}=n\).

### 6.4 AAPOR replication limitation and internal RMSE discrepancy

The [public AAPOR repository](https://github.com/umisrcps/aapor_preelection_2024) was inspected on 2026-11-02. It contains scripts but no public poll-level/historical data files. The main analysis script calls `load("../DataAccess/primarydataset.rdata")`, and other external files are also absent. Therefore this audit verifies published tables and formulas, not a full poll-level rerun.

AAPOR Appendix H.2 and Appendix I.1 also disagree on several contest-level RMSE values—for example, national presidential 2.8 versus 3.2, governor 9.2 versus 7.2, and House 11.4 versus 9.0. Those disputed cells are excluded from calibration. Signed and absolute errors used here agree across the cited locations.

## 7. Correlated state-error model

### 7.1 Poll aggregation layer

For poll \(p\) measuring contest \(c\):

\[
y_p=m_c+h_{f[p]}+\beta^\top x_p+\epsilon_p,
\]

where \(x_p\) can include population (RV/LV), mode, and preregistered design features; \(h_f\) is a partially pooled house effect; and \(\epsilon_p\) has sampling variance based on effective n plus poll-level overdispersion. Deduplicate tracking waves and alternate releases before averaging. Cap firm influence within a contest so frequent releases do not create artificial precision.

### 7.2 Election-eve outcome layer

For contest \(c\), let \(\widehat m_c\) be the information-frozen polling/model estimate. Define residual outcome error:

\[
E_c=M_c^{\text{certified}}-\widehat m_c
=B_y+R_{r[c],y}+O_{o[c],y}+S_{s[c],y}+C_c+L_c.
\]

- \(B_y\): shared national/cycle error.
- \(R_{r[c],y}\): regional error.
- \(O_{o[c],y}\): office-type error.
- \(S_{s[c],y}\): state-level error shared by contests in the state.
- \(C_c\): contest-specific error.
- \(L_c\): late movement not observed in the frozen data.

Use Student-t innovations for shared and contest components to allow occasional large errors. A baseline mean of zero is more defensible than a party-direction shift; historical errors inform the scales and dependence. If a nonzero historical mean is tested, shrink it heavily and select it only through historical out-of-sample performance.

For two contests \(c,d\), the covariance before independent contest/late terms is:

\[
\operatorname{Cov}(E_c,E_d)=
\sigma_B^2+
\mathbf1(r_c=r_d)\sigma_R^2+
\mathbf1(o_c=o_d)\sigma_O^2+
\mathbf1(s_c=s_d)\sigma_S^2.
\]

This covariance—not independent state draws—drives joint Senate/House control probabilities. If multiple contests share the same pollsters or turnout assumptions, add a preregistered shared-method component rather than assuming those vulnerabilities vanish.

### 7.3 Recall sensitivity layer

Keep recall adjustments outside the baseline mean unless they pass historical validation. For poll \(p\), a scenario can be parameterized as:

\[
a_p=\kappa_p q_p b_{\text{recall},p},
\]

where \(q_p\) encodes whether and how recall enters the estimate, \(\kappa_p\in[0,1]\) is a scenario transport factor, and \(b_{\text{recall},p}\) is a public-input recall-margin component. Do not assign the same \(a_p\) to polls with no recall use, polls with validated profile designs, and polls raking only reported voters. Publish baseline and scenario outputs separately; never average scenario outputs into v19 or call them observed errors.

### 7.4 Trump approval

Approval may enter a preregistered model only with historically estimated transition coefficients and uncertainty. It must not be translated directly into candidate votes. The recall panels’ association between approval and changed recall is not a validated approval-to-vote function.

## 8. Backtesting and calibration

### 8.1 Numerical aggregate stress test actually run

Using AAPOR’s updated all-contest cycle signed errors for 2016 (+3.1), 2018 (+0.1), 2020 (+4.6), 2022 (−0.6), and 2024 (+2.7), the audit computed residuals after alternative mean corrections. These are **cycle-aggregate diagnostics**, not poll-level MAE/RMSE.

| Rule | Target cycles | Cycle MAE, pp | Cycle RMSE, pp |
|---|---|---:|---:|
| Zero mean adjustment | 2016/2018/2020/2022/2024 | 2.220 | 2.772 |
| Fixed subtract 2 pp | same five | 1.780 | 1.941 |
| Leave-one-cycle-out mean, λ=1 | same five | 2.230 | 2.426 |
| Leave-one-cycle-out mean, λ=0.5 | same five | 2.205 | 2.397 |
| Previous presidential error transported | 2018/2020/2022/2024 | 2.900 | 3.237 |
| Zero adjustment, midterms only | 2018/2022 | 0.350 | 0.430 |
| Previous presidential error, midterms | 2018/2022 | 4.100 | 4.245 |
| Zero adjustment, presidentials only | 2020/2024 | 3.650 | 3.772 |
| Previous presidential error, presidentials | 2020/2024 | 1.700 | 1.712 |

The fixed 2-point subtraction looks better in this tiny pooled five-cycle sample, but it is an in-sample aggregate comparison and performs poorly in both midterms: residuals become −1.9 in 2018 and −2.6 in 2022. It is therefore **not** a validated 2026 rule. Leave-one-cycle-out uses other cycles including future ones for cross-validation diagnostics; it is not an operational real-time forecast. The MAE-optimal shrinkage in a grid is λ=0.05, while the RMSE-optimal value is λ=0.72. That disagreement is evidence of instability, not a license to tune to the preferred answer.

As a separate source-specific stress observation, applying a 2-point subtraction to Silver’s 2025 aggregate signed error of −6.1 would leave −8.1, worse in absolute terms. This is not merged with AAPOR’s backtest.

### 8.2 Required full backtest design

1. **Freeze information by historical election eve.** Store ingestion timestamps and use only polls, voter-file histories, registration, and fundamentals available then.
2. **Rolling-origin evaluation.** Train on earlier cycles, test on the next cycle. Suggested test origins: 2016, 2018, 2020, 2022, 2024; keep 2025 as a separately labeled off-year/special evaluation.
3. **No leakage.** Never use current-cycle certified results, validated current turnout, postelection recall, or pollster ratings updated after the test election as predictors.
4. **Evaluate at multiple units.** Report poll/matchup errors, contest-average errors, and state/control forecasts separately. Cluster uncertainty by cycle, contest/state, and pollster.
5. **Compare preregistered baselines.** Zero-mean independent; zero-mean correlated; historical-mean transported; shrunk historical mean; house-effect-only; and any recall sensitivity that has legitimate historical inputs.
6. **Score distributions, not only point estimates.** Signed error, MAE, RMSE, 50/80/95% coverage, interval width, PIT histograms, CRPS or log score, and Brier score for chamber/control outcomes.
7. **Select on training only.** Choose variance scales, tail degrees of freedom, shrinkage, and pollster caps without viewing the held-out result. Report all preregistered variants, including failures.
8. **Respect effective degrees of freedom.** Thousands of polls do not create thousands of independent national election errors. A handful of cycles cannot support a complex directional correction with many interactions.

### 8.3 Simpler likely-voter-screen backtests

Where the same underlying poll has both RV and LV releases, compare them directly to reduce firm confounding. Where respondent microdata and voter files exist, preregister:

- **S0:** registered-voter baseline.
- **S1:** already voted plus a simple self-report threshold.
- **S2:** continuous self-reported turnout propensity, threshold chosen only in training cycles.
- **S3:** voter-file past-turnout model using only pre-election history.
- **S4:** the fuller production model.

After each election, validate turnout against updated voter files and score candidate margins against certified results. Validated turnout evaluates who voted; it does not validate for whom they voted. Evaluate screen calibration, candidate-margin error, n_eff, design effect, and subgroup coverage. RedBox’s 2026 screen cannot be historically validated without earlier comparable RedBox microdata; its 2026 result is a future preregistered test, not retrospective evidence.

## 9. Concrete implementation guidance for Claude and ChatGPT

### 9.1 Required data contract

Each poll record must include:

`poll_id`, `release_group_id`, `pollster_id`, `sponsor_id`, `sponsor_affiliation`, `contest_id`, `state`, `office`, `region`, `field_start`, `field_end`, `ingested_at`, `population`, `dem_pct`, `rep_pct`, `raw_n`, `effective_n`, `moe_value`, `moe_type`, `mode`, `frame`, `weight_variables`, `lv_method`, `recall_use`, `recall_target_population`, `recall_target_margin`, `validated_turnout_use`, `source_url`, and `evidence_status`.

Use explicit nulls plus reason codes for unknown values. Never infer effective n from raw n without labeling an assumption. Never mix candidate-margin MOE with single-share MOE.

### 9.2 Non-negotiable implementation rules

1. Keep v19 read-only; write all experiments to a new versioned branch.
2. Compute signed error as poll D–R minus certified D–R and show the sign convention in every export.
3. Preserve source, field window, contest set, and observation unit in every historical row.
4. Do not pool AAPOR and Silver estimates into one average.
5. Do not apply a uniform 2-point or other fixed party adjustment.
6. Use effective n and design effect for sampling variance; mark missing n_eff.
7. Deduplicate alternate releases and cap repeated-firm influence.
8. Model house effects separately from election bias and sponsorship.
9. Treat sponsorship as metadata/covariate, never as automatic proof of error or manipulation.
10. Treat voter-file turnout validation as turnout-only; never as secret-ballot candidate validation.
11. Gate recall scenarios on documented `recall_use`; no recall mechanism means no mechanical recall adjustment.
12. Keep State Navigate’s private-cell outputs labeled “not independently verifiable.”
13. Do not use Trump approval as a direct vote translation.
14. Never convert Florida party-registration ballots into Moody/Nixon votes.
15. Never treat current early voters as the final electorate or blend different official timestamps.
16. Draw national, region, office, state, contest, and late errors jointly; no independent-state shortcut.
17. Use rolling-origin backtests and historical information freezes; no random poll-level train/test split.
18. Publish interval coverage and proper scores alongside MAE/RMSE and seat/control probabilities.
19. Separate baseline estimates, modeled scenarios, historical analogies, and speculation in output labels.
20. Log source retrieval time, code version, input hashes, model configuration, and random seed.

### 9.3 Validation assertions

- `effective_n <= raw_n` whenever both are supplied.
- `abs((dem_pct - rep_pct) - reported_margin) <= rounding_tolerance`.
- `abs(RedBox_mixture - 6.808) <= 0.00001` using the public precision inputs.
- `abs(RedBox_break_even - 0.59423856) <= 1e-6`.
- `combined_cast = voted_vbm + voted_early`; outstanding mail is excluded.
- No feature timestamp may exceed the historical forecast freeze.
- No scenario table may enter the production polling average without an explicit validated promotion decision.
- Independent-state simulation should be implemented only as a rejected baseline for comparison, not the production generator.

### 9.4 Simulation sequence

For each draw: sample a heavy-tailed national error; sample regional and office components; sample state components; add contest and late-movement components; apply the resulting joint error vector to all contests; map margins to winners/seats; aggregate control outcomes. Store enough draws to inspect joint tails and covariance. Calibrate component scales by out-of-sample coverage and CRPS/log score, not by whether the resulting chamber probabilities look intuitively reasonable.

## 10. Verification register

| Item | Status |
|---|---|
| AAPOR published signed/absolute tables | Verified as published aggregates |
| AAPOR poll-level replication | **Not possible from current public repository; required data absent** |
| AAPOR contest-level RMSE | **Internal appendix discrepancies; excluded from calibration** |
| Fully comparable 2018 Senate-only signed error | **Not located** |
| Silver 2025 estimates | Verified as source-specific published aggregates |
| State Navigate public sample sizes and public rates | Verified from article text |
| State Navigate private Jain cells and full Nuttycombe III rerun | **Not independently verifiable** |
| Morris October public weighted transitions and raw cross-switch counts | Verified; design-adjusted uncertainty unavailable |
| 2.215-point recall-margin reconstruction | Reproduced arithmetic under explicit simplifying assumptions |
| 1–2-point national horse-race effect | **Modeled claim; not independently validated** |
| State Navigate directional wording | **Internally inconsistent; flagged** |
| Florida official counts at stated timestamp | Verified administrative snapshot |
| Florida early votes by candidate | **Not observed; prohibited inference** |
| RedBox weighted candidate/subgroup arithmetic | Recomputed from published crosstabs |
| RedBox final turnout model accuracy | **Unknown until certified outcome and validated turnout** |
| v19 estimates | Untouched and not re-estimated |

## 11. Reproducibility notes

The companion workbook contains source-normalized historical rows, backtest residuals and scoring, public recall inputs and intervals, the recall arithmetic reconstruction, Florida official counts and shares, RedBox subgroup calculations, the full turnout sensitivity curve, source URLs, implementation rules, and verification flags. Formula cells expose derived quantities. The reproduction text file contains executable Python for the numerical checks using only the public inputs printed in this report.

No original Kimi CSV exports were created in the earlier chat audit. If Polling Lab imported those chat tables, their provenance should read **“CSV transcriptions of the Kimi audit tables”**, not “original Kimi CSV exports.” The present workbook is a new deliverable generated for this audit.
