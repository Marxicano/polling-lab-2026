# Interactive Polling Lab: review corrections — November 2, 2026

This is a **post-freeze interface and illustrative-slider correction**, not a new polling forecast or revision of v19/v20 model source.

## Source-version labeling
- Original, separately frozen v19 input: **445** included Senate surveys.
- Expanded post-freeze v20: **458** included surveys, adding **13** after the frozen v19 cutoff.
- The interactive app uses the published v20 site JSON and v20 polls; its prior phrases “frozen 458” and generic “snapshot” were inaccurate.
- The app now labels the v20 analysis correctly and shows the separate original v19 margin beside each race and in the methods panel.

## Independent seat math
- Original experimental slider pooled independent wins with Democrats under “D/I-aligned seats”, an unsupported caucus assumption.
- The app now reports **Democratic, Republican, and independent seats separately**, including Dan Osborn in Nebraska.
- The slider implements v20's `seatsFor` near-tie rule (absolute margin under 0.05 retains incumbent seat). Incumbents were transcribed from the published v20 states table.
- Independently compared the corrected seat arithmetic to all **13 original v20 scenario rows** (including the no-shift baseline), which matched.
- Slider remains symmetric at **−8 to +8 percentage points**, and published historical shifts are identified separately from the user-controlled hypothetical.

## Source evidence and wave disclosure
- New, compact derived file `docs/app/data/evidence_v201.json` has one provenance-status record per **461** poll records.
- Its classifications reproduce the **v20.1 metadata contract**: reported source evidence, availability of effective n, pollster-level recalled-vote method, and distinct Florida RedBox waves.
- This derived table is **not** an independent verification of original release PDFs, and it does not replace the underlying research records.
- Polls with no recorded fieldwork end are explicitly identified as using a listing date where displayed.
- Original RedBox waves are labeled October 20–23 and October 30–31 separately.

## Verification
- Browser checks with local data mocked from the original ZIP: 320px, 390px and 1280px widths, no JavaScript exceptions or horizontal overflow.
- Scenario checks at zero, +1.0, +1.2, +7.35 and −3.1 points matched published party/independent seat totals. Source dataset checksum and v19/v20 engine fingerprints are displayed in the app.
- No original v19 or v20 dataset, preregistration, v20.1 scoring method, or experimental probability has been altered.
- This patch does **not** establish the statistical validity of the experimental v20 probabilities.

For historical reproducibility, GitHub commits preserve the earlier app version and this subsequent correction separately.
