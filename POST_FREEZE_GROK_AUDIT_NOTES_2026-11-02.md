# Grok's reconciled late-poll CSV — independent source audit (November 2, 2026)

**Research addendum only — no modification to the official v19 freeze.**

## What was checked
Compared `POST_FREEZE_GROK_RECONCILED_2026-11-02.csv` (23 rows, 32 columns) against the original `polling_lab_v19_FROZEN_2026-11-02.zip` polls. The `v19_verified_status` classification matches file membership in all rows with a listed v19 poll ID: **9 included, 1 present but excluded, 13 missing**. The original Grok columns (`v19_Status`, `Pub_Date`, `Margin`) are preserved for provenance and **must not override** the revised audit columns (`v19_verified_status`, `revised_pub_date`, `revised_margin`).

### Two documented RedBox page versions / source discrepancy

An important source problem was observed on November 2, 2026:

1. The *RedBox polling center* (`https://afightworthhaving.com/polling`) and previously indexed Florida pages list the October 30–31, n=2,898 Florida poll as **Moody 48%, Nixon 45%, R+3, released November 1**. This is the version present in the original v19 frozen data.
2. Live detailed pages `https://afightworthhaving.com/polling/2026/florida` and `https://afightworthhaving.com/polling/2026/florida/senate` now list **Moody 47%, Nixon 45%, R+2, released November 2**.

The site's differing publication versions require an **amendment/version log**. A recent web result indexed the same detailed URL with the earlier 48–45 figure, so a revision or caching inconsistency is possible; no specific cause is proven. Earlier audits were too confident in declaring Grok's R+2/NOV2 entry simply wrong. A November 2 version may have been issued after the November 2 8:08 a.m. ET freeze. **Do not retrospectively change the frozen v19 estimate or imply the newer version was available before the cutoff without timed evidence.**

Both versions remain poll estimates. Party registration and respondent-reported early votes are not actual candidate vote counts.

### Remaining limitations
- **Seven NYT/Siena state polls** published November 1 were omitted from v19 but documented in an existing post-freeze Siena sensitivity CSV. Treat all seven as a single firm’s coordinated release, not independent pollsters.
- **Research Co.** Michigan, Minnesota, Ohio rows were missing from Grok's first CSV and correctly appear in this revised one. The **full-ballot shares** rely on secondary trackers; the firm's headline decided-voter percentages must not be counted as separate polls.
- **AtlasIntel:** Texas n=1,678 and national n=3,566 are reported as samples of *adults* at the pollster source. Some aggregators report likely-voter subsets or alternative toplines. The exact shares, sample base and original report need reconciliation before any experimental re-average. The national original Grok columns include non-numeric ranges such as `55.5-56`, so do not parse them directly as numerical observations.
- **Trafalgar:** October 31–November 1 Texas release is missing from v19; verify pollster PDF/questionnaire and any specific campaign sponsorship separately from general historical pollster lean.
- **Big Data Poll Florida:** stored as `include=no` in v19 pending conflicting poll details. It is **not** part of the frozen average.
- **GrayHouse Iowa:** distinct final-week survey already documented in a separate post-freeze source register, but absent from this 23-row attachment; **the list is not exhaustive**.
- **Release timing:** a calendar-date `Pub_Date` does not by itself prove a poll was publicly available before the 8:08 a.m. ET freeze. Exact timing remains unverified for several releases.

### Publication/analysis rules
- Preserve v19’s frozen snapshot CSV, manifest, and freeze record unchanged; Github's publication record remains independent.
- Keep this reconciliation as supplementary source coverage rather than an amendment to the published estimate. Any *expanded-coverage* averages must be versioned and timestamped separately.
- Do not draw a causal conclusion about likely-voter bias, recalled-vote weighting, or Trump approval from the inclusion flags alone.
- Keep source-level conflicts visible, rather than silently selecting figures that favor either political party.
