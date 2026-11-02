# Polling Lab 2026 audit — public-input reproduction calculations
# Python 3.12; requires numpy and pandas. Save as reproduce_audit.py to execute.
# All inputs are transcribed from the original sources listed in the report.
# This reproduces arithmetic diagnostics, not poll-level AAPOR estimates or Nuttycombe III.

import numpy as np
import pandas as pd

np.set_printoptions(suppress=True)
pd.set_option('display.max_columns', 50)

print('\n1. AAPOR cycle-aggregate signed-error stress test')
cycles = pd.DataFrame({
    'year': [2016, 2018, 2020, 2022, 2024],
    'timing': ['Presidential', 'Midterm', 'Presidential', 'Midterm', 'Presidential'],
    # D-R poll margin minus certified D-R margin, percentage points.
    'error': [3.1, 0.1, 4.6, -0.6, 2.7],
})

rows = []
for _, row in cycles.iterrows():
    year, error = int(row.year), float(row.error)
    other = cycles.loc[cycles.year != year, 'error']
    predictions = {
        'Zero mean adjustment': 0.0,
        'Fixed subtract 2pp from D-R poll margin': 2.0,
        'Leave-one-cycle-out mean (lambda=1)': other.mean(),
        'Leave-one-cycle-out shrunk mean (lambda=0.5)': 0.5 * other.mean(),
    }
    for rule, prediction in predictions.items():
        residual = error - prediction
        rows.append([rule, '2016/2018/2020/2022/2024', year, row.timing,
                     error, prediction, residual, abs(residual), residual**2])
    previous = {2018: 2016, 2020: 2016, 2022: 2020, 2024: 2020}.get(year)
    if previous is not None:
        prediction = float(cycles.loc[cycles.year == previous, 'error'].iloc[0])
        residual = error - prediction
        rows.append(['Previous presidential error transported',
                     '2018/2020/2022/2024', year, row.timing,
                     error, prediction, residual, abs(residual), residual**2])

long = pd.DataFrame(rows, columns=[
    'rule', 'target_set', 'year', 'timing', 'error', 'prediction',
    'residual', 'abs_residual', 'squared_residual'
])
summary = long.groupby(['rule', 'target_set']).agg(
    n_cycles=('year', 'count'),
    MAE_cycle_pp=('abs_residual', 'mean'),
    RMSE_cycle_pp=('squared_residual', lambda x: np.sqrt(x.mean())),
    max_abs_residual_pp=('abs_residual', 'max'),
).reset_index()

subset_rows = []
transport = long[long.rule == 'Previous presidential error transported']
for timing in ['Midterm', 'Presidential']:
    transported = transport[transport.timing == timing]
    years = transported.year.tolist()
    zero = cycles[cycles.year.isin(years)]
    for rule, residuals in [
        ('Zero mean adjustment', zero.error.to_numpy()),
        ('Previous presidential error transported', transported.residual.to_numpy()),
    ]:
        subset_rows.append({
            'rule': rule,
            'target_set': timing + ' cycles in transport test',
            'n_cycles': len(residuals),
            'MAE_cycle_pp': np.mean(np.abs(residuals)),
            'RMSE_cycle_pp': np.sqrt(np.mean(residuals**2)),
            'max_abs_residual_pp': np.max(np.abs(residuals)),
        })
summary = pd.concat([summary, pd.DataFrame(subset_rows)], ignore_index=True)
print(summary.round(6).to_string(index=False))

# This grid is a five-cycle diagnostic, not a validated tuning procedure.
grid = []
for lam in np.linspace(0, 1, 101):
    residuals = []
    for _, row in cycles.iterrows():
        historical_mean = cycles.loc[cycles.year != row.year, 'error'].mean()
        residuals.append(row.error - lam * historical_mean)
    grid.append([lam, np.mean(np.abs(residuals)), np.sqrt(np.mean(np.square(residuals)))])
grid = pd.DataFrame(grid, columns=['lambda', 'MAE', 'RMSE'])
print('\nMAE-minimizing lambda (diagnostic only):')
print(grid.loc[grid.MAE.idxmin()].round(6).to_string())
print('\nRMSE-minimizing lambda (diagnostic only):')
print(grid.loc[grid.RMSE.idxmin()].round(6).to_string())

print('\n2. Morris/Verasight public-input recall arithmetic')
# FEC 2024 official shares; normalized to Trump+Harris for this illustration.
T = 49.80 / (49.80 + 48.32)
H = 1 - T
p_T_H = 0.032
p_H_T = 0.014
# Trump one-point destinations: other, no presidential vote, nonvote, do not remember.
p_T_one = 0.010 + 0.004 + 0.015 + 0.004
# Harris total changed minus cross-switch to Trump; all treated as one-point moves.
p_H_one = 0.041 - 0.014
cross_component = 200 * (T * p_T_H - H * p_H_T)
one_category_component = 100 * (T * p_T_one - H * p_H_one)
recall_margin_component = cross_component + one_category_component
print({'T': T, 'H': H,
       'cross_component_pp': cross_component,
       'one_category_component_pp': one_category_component,
       'total_recall_margin_component_pp': recall_margin_component})

# Wilson interval for a binomial proportion, simple-random-sample approximation only.
def wilson_interval(count, n, z=1.959963984540054):
    p = count / n
    denominator = 1 + z*z/n
    center = (p + z*z/(2*n)) / denominator
    half = z * np.sqrt(p*(1-p)/n + z*z/(4*n*n)) / denominator
    return center - half, center + half

raw_T_H = 22 / 754
raw_H_T = 11 / 809
interval_T_H = wilson_interval(22, 754)
interval_H_T = wilson_interval(11, 809)
raw_partial_component = 200 * (T * raw_T_H - H * raw_H_T)
# Independent, unweighted, SRS-only propagation; NOT a national-bias CI.
illustrative_low = 200 * (T * interval_T_H[0] - H * interval_H_T[1])
illustrative_high = 200 * (T * interval_T_H[1] - H * interval_H_T[0])
print({'raw_T_to_H_pct': 100*raw_T_H,
       'Wilson95_T_to_H_pct': tuple(100*x for x in interval_T_H),
       'raw_H_to_T_pct': 100*raw_H_T,
       'Wilson95_H_to_T_pct': tuple(100*x for x in interval_H_T),
       'raw_cross_switch_partial_component_pp': raw_partial_component,
       'illustrative_low_pp_NOT_A_VALID_NATIONAL_CI': illustrative_low,
       'illustrative_high_pp_NOT_A_VALID_NATIONAL_CI': illustrative_high})

print('\n3. Florida official snapshot, compiled 2026-11-02 08:09 AM ET')
florida = {
    'Voted vote-by-mail': {
        'Republican': 678709, 'Democratic': 832610, 'Other': 47774, 'NPA': 382282},
    'Voted early in person': {
        'Republican': 1495880, 'Democratic': 1206968, 'Other': 90834, 'NPA': 667172},
    'Vote-by-mail provided, not returned': {
        'Republican': 172402, 'Democratic': 202539, 'Other': 15610, 'NPA': 124508},
}
fl = pd.DataFrame(florida).T
fl['Total'] = fl.sum(axis=1)
cast = fl.loc[['Voted vote-by-mail', 'Voted early in person']].sum()
shares = 100 * cast / cast['Total']
print(fl.to_string())
print('\nCombined cast/returned counts:')
print(cast.to_string())
print('\nCombined registration shares (%), NOT candidate votes:')
print(shares.round(6).to_string())
print('R-minus-D registration gap (pp):', shares['Republican'] - shares['Democratic'])
assert cast['Total'] == 5402229
assert cast['Republican'] == 2174589
assert cast['Democratic'] == 2039578
assert cast['NPA'] == 1049454
assert cast['Other'] == 138608

print('\n4. RedBox subgroups, effective sample, and margin uncertainty')
# Candidate shares are percentages among all respondents, not two-party normalized.
redbox = pd.DataFrame([
    ['Overall', 4823, 1520.0, 49.605104, 42.797104],
    ['Already voted', 2025, 632.7, 39.773682, 55.321878],
    ['Not yet voted', 2798, 887.3, 56.624759, 33.854390],
    ['Independents', 1547, 463.5, 30.812181, 52.852100],
], columns=['subgroup', 'raw_n', 'effective_n', 'Moody_pct', 'Nixon_pct'])
redbox['design_effect'] = redbox.raw_n / redbox.effective_n
redbox['Moody_margin_pp'] = redbox.Moody_pct - redbox.Nixon_pct
p_R = redbox.Moody_pct / 100
p_D = redbox.Nixon_pct / 100
d_D_minus_R = p_D - p_R
redbox['margin_SE_pp'] = 100 * np.sqrt(
    (p_D + p_R - d_D_minus_R**2) / redbox.effective_n)
redbox['margin_MOE95_pp'] = 1.96 * redbox.margin_SE_pp
print(redbox.round(6).to_string(index=False))
assert (redbox.effective_n <= redbox.raw_n).all()

print('\n5. RedBox early-vote mixture and sensitivity')
already_share = 0.41657011
already_margin = 39.773682 - 55.321878
not_yet_margin = 56.624759 - 33.854390
mixed = already_share * already_margin + (1-already_share) * not_yet_margin
slope = already_margin - not_yet_margin
break_even = not_yet_margin / (not_yet_margin - already_margin)
print({'already_margin_Moody_pp': already_margin,
       'not_yet_margin_Moody_pp': not_yet_margin,
       'mixture_Moody_pp': mixed,
       'slope_pp_per_unit_share': slope,
       'break_even_already_share': break_even,
       'break_even_pct': 100*break_even})
assert abs(mixed - 6.808) < 0.000001
assert abs(break_even - 0.5942385629524487) < 1e-12

s_values = sorted(set([0, .1, .2, .3, .4, already_share, .5,
                       break_even, .6, .7, .8, .9, 1.0]))
sensitivity = pd.DataFrame({'already_voted_share': s_values})
sensitivity['Moody_margin_pp'] = (
    not_yet_margin + (already_margin-not_yet_margin)*sensitivity.already_voted_share)
print(sensitivity.round(6).to_string(index=False))

print('\nAll assertions passed. Scenario arithmetic is not a turnout or candidate-vote forecast.')
