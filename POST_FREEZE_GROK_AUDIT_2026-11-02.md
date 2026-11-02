# Grok final-week polling intake: independent reconciliation — November 2, 2026

**Status: post-freeze data-quality audit only.** The official Polling Lab v19 snapshot was already frozen at 08:08 Eastern on November 2. This memo and `POST_FREEZE_GROK_RECONCILED_2026-11-02.csv` do **not** modify it. Any model rerun using newly verified surveys belongs in a distinct, named **expanded coverage** sensitivity series.

## Scope and results

Grok supplied `2026_midterm_poll_audit.csv` with **20 rows** covering Florida, the final seven-state NYT/Siena wave, Texas late releases and the national generic ballot. This audit reconciled every row to the *actual* frozen v19 `data/senate_polls.csv` or `data/generic_polls.csv`, and added **three Research Co. state releases** mentioned in Grok's prose but absent from its CSV. This yields **23 annotated records**:

- **9 already included in v19:** Florida Siena, St. Pete Polls, ActiVote, Stetson CPOR, InsiderAdvantage, RedBox final wave; national Emerson, ActiVote and Reuters/Ipsos.
- **1 present but intentionally excluded:** Florida Big Data Poll, unresolved conflicts in published figures and documentation.
- **13 missing from v19:** the **seven** November 1 NYT/Siena states (AK, IA, KS, ME, MI, OH, TX); **two** distinct Texas Senate surveys (AtlasIntel and Trafalgar); **one** AtlasIntel national generic-ballot release; and **three** Research Co. state Senate surveys (MI, MN, OH).

The final Iowa and Ohio NYT/Siena surveys were not in the frozen database; earlier Siena waves in those states are **not** duplicates of the final wave. The seven Siena records are separate state samples within a coordinated publisher release, not seven additional independent polling *firms*. Many of the missing releases were documented already in our separate Siena or final-week audits: they must **not** be added to an expanded series twice.

## Corrections that materially matter

1. **RedBox Florida (critical):** Grok's CSV says **Moody 47–Nixon 45, R+2**, released **November 2**, marked post-freeze. The firm's original public release actually says **Moody 48–Nixon 45, R+3**, released **November 1**, fielded **October 30–31**, n=2,898 LV, sponsored by A Fight Worth Having. v19 **already includes** this distinct wave as `FL-NOV01-REDBOX2`. Its after-fieldwork recalled-2024-vote target remains a legitimate methodological flag, but it is not evidence of a newly omitted poll. [Original release](https://afightworthhaving.com/polling/2026/florida) and [methodology](https://afightworthhaving.com/polling/2026/florida/methodology).
2. **Final NYT/Siena:** all seven November 1 state releases were missing despite Grok's vague “likely included” status. Each has a direct [Siena source](https://sri.siena.edu/2026/11/01/nytimes-siena-poll-of-likely-voters-alaska-iowa-kansas-maine-michigan-ohio-and-texas/). A **separate** seven-state sensitivity calculation was already published; do not treat it as a second official freeze.
3. **Big Data Poll Florida:** the v19 record is **present, `include=no`** pending source verification. Grok's claim that it was likely included is incorrect. Multiple trackers give numbers but this does not resolve the source conflict.
4. **AtlasIntel population:** the original pollster release explicitly says **1,678 Texas adults** and **3,566 national adults**, both Oct 28–Nov 1. Grok's `Adults/LV` label should not become a likely-voter source. Its national shares are represented as text ranges, not numeric values: inspect the original PDF before importing an exact topline. [Texas source](https://www.atlasintel.org/poll/usa-texas-2026-11-01); [national source](https://www.atlasintel.org/poll/usa-national-2026-11-01).
5. **Research Co. omitted from Grok CSV:** its official release documents **three** distinct state surveys (MI, MN, OH), 450 likely voters interviewed per state Oct 30–Nov 1. Its headline press-release percentages are among *decided voters*, whereas secondary trackers also publish full-ballot shares. Those are two presentations of **one survey in each state**, not independent waves. The extra records use tracker-reported full-ballot shares as *provisional* and give the pollster's decided-voter results in the note; verify original full crosstabs before final import. [Original release](https://researchco.ca/2026/11/01/midterms-2026-one/).
6. **National Emerson and Ipsos sources:** Grok gave a third-party site for Emerson and a generic Ipsos homepage. Direct releases are available: [Emerson 52–42](https://emersoncollegepolling.com/october-2026-national-poll-democrats-hold-10-point-midterm-advantage/); [Reuters/Ipsos 53–44](https://www.ipsos.com/en-us/democrats-hold-9-point-edge-midterm-congressional-ballot). Reuters/Ipsos studied 1,679 **adults** total; the reported generic-ballot topline is for an LV subset, whose size is not the full sample. Do not conflate denominators.
7. **Florida field dates:** Grok gives Siena's Florida field end as Oct 26, while v19 has an **Oct 25 provisional** field end. This is an unresolved source-date discrepancy; correct from original pollster documents, not by overwriting one uncertain date with another.

## What is verified and what is not

- Comparing records to v19 establishes **database inclusion**. It does not establish that every pollster topline, sponsorship or methodology in Grok's original CSV was verified.
- Primary-source verification supports the NYT/Siena race figures, RedBox Florida 48–45, Stetson Florida 49–45, AtlasIntel's field dates and adult sample populations, and Research Co.'s field dates and decided-voter headlines.
- AtlasIntel's exact candidate percentages (TX 52.2–46.2, national 55.5–41.4) and Trafalgar's exact Texas 47.5–48.1 were corroborated by published trackers; this audit **did not independently extract original Atlas or Trafalgar full PDFs**, so the register retains that qualification.
- Grok's “high-confidence” flags often accompany broad website homepages, not exact original releases. These require promotion only after verifying the corresponding questionnaire, sample, field dates and candidate share.
- Grok's CSV is a **targeted 20-survey audit**, not a comprehensive census of all 2026 polling. Its prose contains more surveys than its CSV.

## Recommended use

Treat the uploaded Grok CSV as a **lead list**, and the accompanying annotated register as a source-reconciliation document. For any additional expanded pre-election sensitivity, deduplicate against **both** the frozen v19 files and earlier `POST_FREEZE_SIENA_SENSITIVITY_2026-11-02.csv` / `POST_FREEZE_LATE_POLL_REGISTER_2026-11-02.csv`. Include polls released before the freeze with clearly documented dates, sample population and provenance, and preserve uncertain results as pending. Use the original frozen snapshot exclusively for primary scoring. Current early-vote party registration and presidential approval can inform turnout-model sensitivity, but neither is a direct candidate-vote adjustment.

**Official snapshot unchanged:** SHA-256 `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`.
