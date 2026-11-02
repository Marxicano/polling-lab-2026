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
