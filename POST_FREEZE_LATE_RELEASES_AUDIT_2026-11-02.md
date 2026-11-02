# Additional final-week polling releases — independent post-freeze source audit

**Status:** Post-freeze research only. This source register neither modifies nor re-runs the **November 2, 2026, 8:08 a.m. Eastern** official v19 snapshot. Use original frozen data for the primary score, and any expanded-coverage model only as a separately named sensitivity.

## What is actually missing from v19

Inspection of the original v19 `data/senate_polls.csv` and `data/generic_polls.csv` found none of the following seven named final releases:

| Race | Fieldwork | Firm | Published / reported result | Sample and population | Evidence |
|---|---|---|---|---|---|
| Texas Senate | Oct 28–Nov 1 | AtlasIntel | Talarico D+6.0 (52.2–46.2) | 1,678 **adults** | Primary Atlas release confirms dates and sample; trackers support candidate figures, final Atlas questionnaire/PDF still needs inspection |
| Texas Senate | Oct 31–Nov 1 | Trafalgar | Paxton R+0.6 (48.1–47.5) | 1,089 **likely voters** | Trafalgar original release exists; headline/sample corroborated by several trackers |
| Michigan Senate | Oct 30–Nov 1 | Research Co. | El-Sayed D+2 (48–46) | 450 **likely voters** | Research Co. original release + full-ballot tracker |
| Ohio Senate | Oct 30–Nov 1 | Research Co. | Brown D+1 (45–44) | 450 **likely voters** | Research Co. original release + full-ballot tracker |
| Minnesota Senate | Oct 30–Nov 1 | Research Co. | Flanagan D+5 (48–43) | 450 **likely voters** | Research Co. original release + full-ballot tracker |
| Iowa Senate | Oct 28–31 | GrayHouse | Hinson R+2 (48–46) | 601 **likely voters** | Original GrayHouse release |
| National generic ballot | Oct 28–Nov 1 | AtlasIntel | Democrats D+14.1 (55.5–41.4), **shares pending direct PDF confirmation** | 3,566 **adults**, per original Atlas page | Primary Atlas dates/sample; reported result corroborated at margin level, but another tracker labels a 2,000-LV denominator. Do not conflate screened results. |

These seven are separate from the previously documented **seven missing November 1 NYT/Siena state Senate polls**; the two lists should not be double-counted. Original GrayHouse release timing relative to the 8:08 a.m. November 2 freeze remains unverified and is not asserted to precede it.

## Methodological cautions

1. **AtlasIntel populations:** The original Atlas site identifies its 1,678-person Texas poll and 3,566-person national poll as *adults*. Some trackers display differently screened populations or candidate shares. Do not relabel as likely voters, or average multiple versions as independent surveys.
2. **Research Co.:** The firm reports *decided-voter* percentages (Michigan 51–48, Minnesota 52–47, Ohio 49–48); trackers report the original *full-ballot* 48–46, 48–43, 45–44 versions. These are **three polls, not six**.
3. **GrayHouse Iowa:** Its original release says the 601-LV study was self-funded, fielded Oct 28–31 with voter-file sampling and SMS/telephone interviews. Its final modeled electorate weights include party registration and a 2024 presidential vote target of Trump 54%, Harris 43%, plus a political-engagement turnout model. This is a particularly relevant documented test case for recalled-vote weighting; nothing here proves the net direction of its resulting error. GrayHouse and co/efficient's Oct 28 Iowa polls both report Hinson 48, Turek 46, but have *different sample sizes, dates and pollsters* and are not automatically a duplicate.
4. **Trafalgar:** Republican-associated firm is not the same as proof of a specific party-paid client for this wave. Record separately: pollster affiliation, verified sponsor and historical house effect.
5. **No selective directional adjustments:** Count independently released polls regardless of which candidate benefits. These are observational poll results, not validation of Mike's hypothesis or an automatic D+2 correction.

## Original and supporting sources

- AtlasIntel primary poll index: https://www.atlasintel.org/polls/general-release-polls
- AtlasIntel national primary landing page: https://www.atlasintel.org/poll/usa-national-2026-11-01
- Trafalgar Texas original landing page: https://www.thetrafalgargroup.org/news/tx-senate-gen-1101/
- Research Co. original press release: https://researchco.ca/2026/11/01/midterms-2026-one/
- GrayHouse Iowa original methodological writeup: https://www.grayhouse.com/post/grayhouse-poll-hinson-leads-in-iowa-by-2
- Poll-specific reported shares and sample-size corroboration: https://fredcornell.com/latest-senate-polls and https://99chambers.app/senate/tx and https://pollresults.org/races/senate/iowa/

## Publication rule

The full original snapshot CSV, its SHA-256 manifest and original freeze record must remain unmodified. This addendum is a **source-completeness caveat**, not a revised published election prediction. For retrospective scoring, maintain separate labels for 'v19 frozen as-is' and 'all independently documented pre-cutoff releases'; establish the GrayHouse release time before claiming the latter includes it.
