# Post-freeze addendum (Claude) — November 2, 2026

Separate from the official snapshot. Nothing here changes `snapshot_2026-11-02.csv`, its manifest, or the v19 project.

## 1. Integrity check of ChatGPT's publication packet
- `snapshot_2026-11-02.csv` in the packet is byte-identical to the file frozen at 08:08 ET; SHA-256 `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461` matches the hash posted by the user.
- `snapshot_2026-11-02.manifest.json` is byte-identical to the frozen manifest (SHA-256 `66f8a73bd2dd3b3c5855cf6a6679583a73ea3069a35f4b3000fc0c2705b25fcb`); all 41 input hashes it lists match the v19 files.
- `SNAPSHOT_RECORD.md` in the packet is identical to the frozen record. The freeze was not re-run.

## 2. Confirmed omission: final NYT/Siena batch (released Nov 1)
ChatGPT's post-freeze audit is correct. Siena posted its final seven-state Senate polls on November 1 (sri.siena.edu, "NYTimes/Siena Poll of Likely Voters – Alaska, Iowa, Kansas, Maine, Michigan, Ohio, and Texas"), and they were covered that evening, before the 08:08 ET Nov 2 freeze. The final intake missed them because it relied on PollCheck lists that had not yet added them and did not check Siena's own site. This is a process failure in the intake, not a data dispute.

Published results (likely voters; samples as reported): Alaska 48-46 (610), Iowa 48-47 (705), Kansas 49-44 (736), Maine 51-45 (714), Michigan 53-42 (1,011), Ohio 49-44 (717), Texas 50-43 (1,215).

Sensitivity (computed in a scratch copy at the snapshot's own as-of date, Nov 2, raw simple average; release date used as a fieldwork-end proxy): see `POST_FREEZE_SIENA_SENSITIVITY_2026-11-02.csv`. Averages move by -0.1 to +0.5 points (largest: Michigan D+3.5 to D+4.0). No race changes leader, Iowa stays R+0.1, the seat count stays 53-47, and control still flips at a 3-point uniform shift. The omission does not change any frozen conclusion; it will be scored separately as "all polls available before the cutoff."

## 3. Late event not captured by any poll
Siena's Michigan poll finished before Democrat Haley Stevens endorsed Republican Mike Rogers on Sunday, Nov 1 (reported by CBS News per news coverage). No public poll measures it. When Michigan is scored, a miss there may reflect this event as well as polling error.

## 4. Documentation issues to fix in the next version (not in the frozen files)
- `data/data_status.csv` first rows are irregular (an extra trailing cell), as ChatGPT found.
- README.md and SNAPSHOT_PROTOCOL.md contain older sections written before the freeze; SNAPSHOT_RECORD.md governs.
- Intake procedure: add each major pollster's own release page (Siena, Marist, Emerson, Fox, CNN/SSRS, YouGov) to the final-intake checklist, not only aggregator lists.

## 5. Research note
ChatGPT summarized State Navigate's "Total Recall Bias" paper (recalled-vote weighting estimated to move polls about 1-2 points toward Republicans in the authors' modeling). Claude has not verified the paper. It is a hypothesis about mechanism, not a correction; the scoring after certification, including each pollster's likely- vs registered-voter versions and recalled-vote tags, is the test.
