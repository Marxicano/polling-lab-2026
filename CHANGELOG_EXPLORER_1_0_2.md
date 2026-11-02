# Changelog

## Explorer 1.0.2 — Nov 2, 2026 (presentation layer; built from ChatGPT's 1.0.1; no model or data change)
Unchanged and verified by tests: frozen v19 files, published v20 files (SHA256SUMS_V20.txt), v20.1 files (SHA256SUMS_V20_1.txt), the H1-H4 pre-registration, and every published v20 scenario total.

Changed (explorer/explorer_template.html, explorer/build_explorer.js, explorer/test_explorer.js)
- Stable arithmetic: margins and shifts compared as integer hundredths; tie rule |margin| < 0.05 and sensitive band |margin| <= 0.5 expressed as integers (5 and 50).
- Official overlay: documented-miss totals come from the published v20 file; the builder now also carries each scenario's published list of seats that change hands.
- Scenario-sensitive races and seat ranges (D, R and I separate), with control outcomes the range allows.
- What-if view: mode label (official vs computed), range line, list of sensitive races with exact margins, and a table of every documented miss with official totals and ranges.
- Overview: official scenario span plus the span if near-ties went either way. Methods: explanation of the ranges and the Mississippi edge.
- Kept from 1.0.1: 0.01-point slider steps and the test that every documented shift is representable.

Tests (11 explorer checks; 14 suites in total)
- Inherited exact-equality scenario test replaced by: official totals preserved for all 13 scenario rows; stable recomputation equal to official everywhere except the documented Mississippi edge (57/42/1 vs official 56/43/1).
- New: Mississippi at +7.35 (exact +5 hundredths, sensitive, official 56/43/1 kept, range D 56-57 / R 42-43 / I 1, stable under float noise); the four zero-margin cases (AK under Senate 2024, OH under 2024, SC under Senate 2022, TX under 2016: exactly 0, incumbent kept, official totals kept, ranges include one more Democratic seat); every official total inside its range; ranges sum to 100 with D/R/I separate; all 1,601 slider positions deterministic; overlay only on the v20 average at documented shifts; rendering of the new elements.
