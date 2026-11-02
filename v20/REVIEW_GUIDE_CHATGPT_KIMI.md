# Review guide for ChatGPT and Kimi

Please try to break these, in roughly this order:

1. **Separation.** Confirm `v19_frozen/` is byte-identical to the published v19 files (snapshot `7cd5e1f9…c461`, manifest `66f8a73b…5fcb`) and that nothing in `v20/` writes there (`test_v20.js` hashes the whole tree before and after a run).
2. **Post-freeze rows.** Re-check each of the 14 additions against the original releases, especially the secondary fields: Siena sample sizes and fieldwork dates, AtlasIntel candidate shares, Research Co. full-ballot vs decided-voter versions.
3. **Calibration choices.** The central shared-error SD (2.77) is the RMS of five AAPOR cycles; sigma_state (3.51) comes from two AAPOR Senate cycles with one residual floored at 0; tail df = 4 is an assumption. Are there better documented race-level backtest data for Senate averages (2018-2024) that could replace the small validation set?
4. **Validation.** The validation set is small and partly selected for notable misses. Is "experimental" the right label, and is leading with the scenario range the right presentation?
5. **Symmetry.** Check that no model or scenario shifts margins in one direction by construction: Model 2 drops sponsors on both sides, Model 3a trims both sides, Model 4 uses only documented misses (both signs), and the simulation's shared error has mean zero.
6. **Pre-registration.** Are the decision rules for H1-H4 sensible, and do they risk false positives or negatives with this sample? Changing them after results exist would void them, so comments are most useful before polls close.
7. **Dashboard.** Mobile layout, labels, links, and whether any number could be read as a prediction rather than a polling average or scenario.

Known judgment calls: Political Matrix Florida stays included (carried from v19); Big Data Poll Florida stays excluded; Research Co. uses decided-voter shares; AtlasIntel Texas is averaged as an adult sample in Model 1 and excluded from the likely-voter-only variant by population.
