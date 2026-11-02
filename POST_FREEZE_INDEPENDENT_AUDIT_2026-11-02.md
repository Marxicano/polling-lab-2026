# Independent post-freeze audit and research addendum — November 2, 2026

**Separate from the official freeze. Do not merge into or replace the frozen CSV, manifest, project source, or November 2 averages.**

## A. Integrity audit of v19 source ZIP

- User-supplied source: `polling_lab_v19_FROZEN_2026-11-02.zip`.
- Snapshot claimed timestamp: 2026-11-02T13:08:33.045Z (08:08:33 Eastern), *as recorded in the file; this is not independent confirmation of wall-clock time*.
- Snapshot: 242 rows, SHA-256 `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`.
- Manifest SHA-256: `66f8a73bd2dd3b3c5855cf6a6679583a73ea3069a35f4b3000fc0c2705b25fcb`.
- Independently computed: 41/41 manifest input checksums matched actual ZIP entries; 77/77 SHA256SUMS hashes verified; all nine JavaScript test suites passed; ZIP integrity verified. Freeze was NOT rerun.
- This establishes internal integrity, not historical accuracy of all data or an independent creation timestamp. Independent publication with a public commit timestamp is still necessary.
- Frozen raw simple Senate arithmetic: 53 Democratic / 47 Republican seats; national generic ballot D+8.5, n=36; no probability forecast is implied. This is an *engine output*, not a warranted prediction of the certified results.

## B. High-priority pre-cutoff omission (found after freeze)

The NYT/Siena Research Institute published a seven-state likely-voter Senate batch dated **November 1, 2026**, according to its official site: https://sri.siena.edu/2026/11/01/nytimes-siena-poll-of-likely-voters-alaska-iowa-kansas-maine-michigan-ohio-and-texas/ .

| State | D candidate share | R candidate share | Published D−R margin |
|---|---:|---:|---:|
| Alaska | 48 | 46 | D+2 |
| Iowa | 48 | 47 | D+1 |
| Kansas | 49 | 44 | D+5 |
| Maine | 51 | 45 | D+6 |
| Michigan | 53 | 42 | D+11 |
| Ohio | 49 | 44 | D+5 |
| Texas | 50 | 43 | D+7 |

No matching *final* wave appears in the frozen `data/senate_polls.csv`, which has older Siena records but lacks the published results above. These seven polls appear to have been available before the stated 08:08 Eastern Nov 2 cutoff; the article is dated November 1, though the exact publication hour was not independently established. They are NOT retroactively inserted. Any recalculation must be a separate, later timestamped version clearly labeled as post-freeze coverage sensitivity, with no replacement of v19's original freeze. They are all from one pollster's coordinated batch and cannot be treated as seven independent organizations.

## C. Total Recall Bias — research evidence, not a verified polling correction

Original paper: Chaz Nuttycombe and Michael Foley, State Navigate, *Total Recall Bias*, https://projects.statenavigate.com/features/total-recall-bias/ (consulted Nov 2, 2026).

- Paper draws on the author's recontacts and Verasight panel research. Their October Verasight analysis reports that approximately 6.4% of originally recorded Trump voters and 4.1% of originally recorded Harris voters changed their retrospective 2024 vote answer. This is **a change in recalled answer, not evidence that historical ballots changed**.
- Their modeled effect from weighting on retrospectively recalled presidential vote is approximately 1.0–1.1 points under weights with an explicit 'did not vote' category and 1.7–2.2 points under other vote-only weighting schemes. These are research estimates and vary across pollsters; they have not been replicated for the 2026 Senate polls in this archive.
- The paper says the changing-recall rate is relatively stable across 2026 rather than sharply rising with Trump's approval decline. Different populations, turnout models, nonresponse, and questionnaires may bias surveys in either direction.
- An illustrative *uniform D+2 points* polling-map adjustment is a **scenario**, not another polling observation, a proven bias adjustment, or an election outcome projection with validated uncertainty. Do NOT add these hypothetical margins to the main average, and do NOT present them as independent survey data.
- Method validation requires actual pollster-level 2024 recall targets and sample compositions, the same respondents reweighted under alternatives, and post-election comparison to certified results and validated turnout.

## D. Remaining documentation issues

- `README.md` and `SNAPSHOT_PROTOCOL.md` retain some **historical sections saying the freeze has not happened**. `SNAPSHOT_RECORD.md` and the actual frozen files govern the v19 status. Do not edit those old sections inside the frozen project; add an external explanatory note if publishing.
- `data/data_status.csv` has an irregular first row: a trailing unlabeled header cell and a `senate_polls` row with an extraneous fifth value. This does not invalidate the snapshot hash or tests, but should be fixed only in a future version.
- The freeze includes 445 of 448 Senate poll rows and states 406 included rows have fieldwork ends. It expressly documents incomplete North Carolina rechecking and an incomplete intake after 08:08 ET November 2.

## E. Guardrails for post-election research

1. Preserve the raw official v19 snapshot and its manifest; publish those alongside the original full ZIP with a third-party timestamp.
2. Maintain an external, append-only change/omission log; clearly state when each finding was discovered.
3. Separately compare v19 (as frozen), an annotated 'all polls available before cutoff' dataset, and prospective hypothetical recall-bias corrections. Use different labels and do not backdate any model run.
4. Use certified election results to score the frozen method outputs; quantify errors by signed margin, absolute error, race, screen type, and sponsor/method. Do not assume an observed discrepancy proves one particular cause.
