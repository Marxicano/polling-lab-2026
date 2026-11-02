# Polling Lab interactive app — usability-only update (November 2, 2026)

Changes to `docs/app/index.html`:

- Added expandable explanations for likely voters (LV), registered voters (RV), margins and all methodological options.
- Exposed the existing `per_pollster` average (latest qualifying survey from each firm). No new statistical calculation.
- Added the "In current 30-day average" poll filter and status labels. When a state has fewer than three recent surveys, the model uses its three most recent.
- Included poll sponsor disclosures in the poll explorer.
- Clarified which polls enter the main average versus remain in the older included archive.

Verification: interactive Chromium tests at 320px, 390px, 1280px, no JS errors or overflow; all nine method options; Florida remains Moody R+6.0, and the current-average filter shows 19 Florida polls, matching the model. Window counts matched for all 15 states.

**Unchanged:** original v19/v20 source files, data JSON, historical snapshots, experimental model probabilities, preregistered hypotheses, and source polling records. This is a presentation-only revision, not an updated election forecast.
