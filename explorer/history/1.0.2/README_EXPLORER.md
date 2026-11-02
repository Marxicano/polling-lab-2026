# Polling Lab 2026 — Senate explorer 1.0

A mobile-first interactive page over the published v20 election-eve analysis. It recomputes nothing statistical: margins and poll counts come from the v20 run, probabilities and scenarios from the published `docs/data/site_v20.json` and `docs/v20-1/data/site_v201.json`, and frozen values from the v19 snapshot.

Where it goes: `docs/explorer/index.html` → `https://marxicano.github.io/polling-lab-2026/explorer/`. It sits beside ChatGPT's `/app/`, the v20 dashboard and `/v20-1/` and changes none of them. One self-contained file, no external scripts, works offline.

What it adds over the existing app
- Honest labels: v20 post-freeze data (458 polls) clearly distinguished from the frozen v19 snapshot (445 polls), with the frozen value shown in every race.
- Seats as Democrats / Republicans / independent; Osborn is never folded into the Democratic total.
- What-if slider symmetric from -8 to +8 with every documented past miss marked and one tap to apply; any of nine baselines (v20 average, frozen v19, per-pollster, likely voters only, weighted, house-adjusted, and three labeled sensitivities).
- Poll explorer for all 461 rows with filters for state, inclusion, frozen vs post-freeze, evidence level, and partisan sponsor; badges for "read from original release", effective n, sponsor, RedBox wave, exclusion reason, and "counts in current average."
- Race pages with every method, the experimental chance and 80% range, the polls in the current average, and state notes (Alaska ranked choice, Nebraska independent, Florida RedBox waves, Mississippi sponsors, Michigan endorsement, Texas adult sample).
- Version stamp: frozen snapshot hash, v20 engine hash and poll-file hash in the footer.

Rebuild and test
```
node explorer/build_explorer.js
node explorer/run_all_explorer.js      # 14 suites: 9 v19, 2 v20, 2 v20.1, 1 explorer
```

Explorer 1.0.1 (reviewed 2026-11-02): The historical scenario slider uses 0.01-point steps; 1.0 used 0.1-point steps and could round the documented +7.35 shift, altering the visible seat result. The template and regression tests now guard against this. The frozen input hashes and published model values remain untouched.

Explorer 1.0.2 (2026-11-02, built from ChatGPT's 1.0.1 source): adds a ±0.5-point scenario-sensitive category and seat ranges.
- Official v20 scenario totals are shown unchanged whenever the baseline is the v20 average and the slider sits on a documented miss; elsewhere the count is labeled "computed with the v20 tie rule."
- Each race within ±0.5 points after the shift is listed; the range lets each one go either way, with Democratic, Republican and independent seats kept separate. The range is not a calibrated probability, a margin of error or a confidence interval.
- All comparisons use whole hundredths of a point (integers), so floating-point rounding cannot move a race across the tie rule (|margin| < 0.05 stays with the incumbent).
- Documented edge: under the 2025 off-year miss (+7.35) Mississippi lands at exactly D+0.05 on its rounded average (D+0.02 unrounded). The published v20 total treated it as a tie (56 D / 43 R / 1 I) because of floating-point arithmetic; exact arithmetic on the rounded average gives 57 D / 42 R / 1 I. The official 56 is kept and the race is flagged, range D 56-57.
- `explorer/history/1.0.1/` keeps ChatGPT's 1.0.1 files byte-for-byte with their checksum file.
