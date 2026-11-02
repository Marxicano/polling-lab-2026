# Polling Lab 2026

An independent, reproducible research project tracking **2026 U.S. Senate polls and the national generic ballot**. It compares published polling averages, voter-screen assumptions, and illustrative error scenarios. This repository preserves the pre-election measurements for later evaluation.

> **Data freeze:** November 2, 2026, 8:08:33 a.m. Eastern, as recorded in the freeze data. The original snapshot was published to this GitHub repository on November 2 and has not been recomputed. GitHub's commit timestamp independently establishes the publication of the files, not their originally claimed creation time.

## Original frozen evidence (do not edit)

- [Snapshot CSV](data/snapshot_2026-11-02.csv) — 242 rows spanning Senate averages, generic ballot and separate scenarios
- [Original SHA-256 input manifest](data/snapshot_2026-11-02.manifest.json)
- [Freeze record](SNAPSHOT_RECORD.md)

**Original snapshot SHA-256:** `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461`

These published files were independently matched byte-for-byte to the supplied frozen originals.

## What the snapshot does—and does not—show

- Polling averages summarize the included releases with the documented methods. They are **not election results or outcome probabilities**.
- The scenario outputs (including uniform polling-error shifts and turnout sensitivity) are **hypothetical calculations**, not additional polling observations.
- Early-vote party-registration totals **do not identify candidate votes**.
- Individual polls can have partisan sponsors, nonresponse error, population/field-date uncertainty and correlated methodological error. Passing regression tests establishes software consistency, **not completeness or polling accuracy**.
- There is **no automatic live poll or election-result feed** in this repository.

## Post-freeze review

- [Independent post-freeze audit](POST_FREEZE_INDEPENDENT_AUDIT_2026-11-02.md) — contains source and methodological limitations, including seven late NYT/Siena polls found missing from the frozen intake.
- [Publication notes](PUBLICATION_README.md).

These notes are explicitly separate from the frozen snapshot. Later omissions and corrections must not be silently incorporated into it. A future revised data series, if produced, must have a new name, its own provenance and a separate evaluation.

## Research questions

The project is designed to evaluate whether likely-voter screening, recalled-2024-vote weighting, partisan nonresponse and timing of polls affected 2026 measurement errors. **No universal correction toward either political party is assumed.**

After election results are certified, the frozen estimates can be scored against the results while preserving the original inputs, assumptions, and timestamped publication history.

**Status:** Research data publication. The full interactive dashboard/source ZIP and live election-night results are not yet hosted on this repository.
