# Polling Lab 2026 — independent tracker 1.1 audit (ChatGPT)

**Review date:** November 3, 2026. **Status:** Continue as **pre-release**. No real results entered and no files published or changed in the GitHub repository in this review.

## What independently passed

- Original complete archive and patch ZIPs pass their CRC checks.
- All **97 patch files** match their corresponding files in the uploaded complete ZIP byte-for-byte.
- `node results_2026/tracker/tests/run_all_with_tracker.js`: **14/14 earlier suites, 9/9 tracker checks, 22/22 review regressions pass**, rerun on Node v22.16.0, independent of the supplied text logs.
- **57** vendored dependencies independently compared byte-for-byte to the original uploaded releases: three v19, 43 v20 and 11 v20.1; all match. The remaining three dependencies are the separately pinned checksum lists and published site JSON, validated by the program's manifests. The v19 snapshot and H1–H4 preregistration public SHA-256 anchors are pinned.
- No official returns appear in the input logs; the 1.1 release is clearly marked *pre-release*.
- The old failures (missing candidate, duplicate rows, unvalidated untracked overrides, round-one recount, party/caucus bookkeeping, missing vendored inputs) have targeted regression tests and those checks now pass.
- The current GitHub repo has neither `results_2026/tracker/README.md` nor `docs/results/index.html` as of this review; no tracker was published.

## New reproducible defects not covered by the 22 regressions

### B7 — Critical: winner-selection logic assumes only the two named polling candidates can win

**Code:** `results_2026/tracker/lib/results_lib.js`, `compare()`, especially `decide()` and the Georgia majority/RCV cases (approximately lines 272–276). All rows can be valid, sum to 100%, and come from an allowed authority domain, but the logic chooses the sign of the two candidates' margin rather than the actual winner among all candidates.

**Alaska synthetic case:** First round Democrat 40%, Republican 35%, independent third candidate 25%. Certified RCV final: D 20%, R 25%, independent 55%. The tracker declares **R**, despite the independent winning the majority. This could falsely assign a Senate seat to the wrong party.

**Georgia synthetic case:** Certified November first round: Democrat 20%, Republican 25%, independent 55%. The tracker says **“runoff pending”**, even though the independent has won a majority and no runoff is needed. The same structural flaw exists wherever a third candidate could win.

**Required change:** Determine an *official winner* from **all candidates in the certified deciding round**, not from the sign of the two original poll candidates' margin. Validate the victor's ballot party and the correct majority/RCV/runoff rules. Keep two-candidate **polling error** calculation separate from actual certified **winner** calculation. Include first-round third-party majorities, certified RCV final third-party majorities, and Georgia runoff pairing in new regression tests. Do not modify the frozen polling data.

**External authority cross-check:** Alaska's Division of Elections states general elections use ranked-choice voting with up to four candidates. Maine's Secretary of State confirms federal general elections use RCV when the contest qualifies. Georgia's official site says the December 1 runoff occurs only when nobody wins a general-election majority.

### A9 — Important policy discrepancy: a later-round recount does not suspend an earlier first-round score

**Synthetic Alaska case:** Certified first round (D 40/R 35/independent 25), later certified final round, then `rcv_final` recount. The tracker correctly withholds the race winner, but continues labeling the first round `comparable=certified`, retaining its v19 polling error and score.

The **code's** behavior is defensible *if* the rule is to suspend **only the disputed round**, because the first-round canvass could remain final. However, the **user's release summary** says a recount suspends “that race's score and winner”; the 1.1 conventions instead say it suspends comparisons, errors and winner **“for that round.”** Make a deliberate, published choice before going live:

1. **Race-level freeze:** Every active recount suspends all scores and winner for the race until resolved (the attached adversarial check currently expects this and fails), **or**
2. **Round-specific freeze:** Keep the independently certified first-round polling score but clearly label the result as under a final-round recount, separate from winner/control, and update the release summary and relevant tests.

This is a *rules clarification*, not necessarily a code defect if option 2 is intended.

## Source provenance and operational cautions

- `sourceAllowed()` enforces an HTTPS **host allowlist**; it does **not** fetch the cited page or verify that the reported candidate votes actually appear there. A hand-entered fake complete result citing an election authority's homepage can pass structural validation. This is an unavoidable gap in a manually populated tracker unless a source-evidence/second-review process is required. For publication, retain page-level URLs, captured totals and a human reviewer signoff for every imported report.
- The 35 domains in `official_sources.csv` have **not been independently verified one-by-one** during this audit. Authority pages were verified for Alaska, Georgia and Maine's RCV guidance; complete 35-state domain review is still necessary.
- The bundled 1.1 full project runs and an automated simulated clean checkout passes. An **actual fresh public GitHub clone** was not possible in this runtime because `github.com` DNS resolution failed; GitHub connector readback confirms the tracker has not yet been published. A real clone-and-patch rehearsal remains a release gate.
- Hash chains are not tamper-proof. Anchor log heads in separately dated Git commits as the author proposes, and apply the same practice to the registered-scoring record.

## Measurement conventions approval

**Approve in principle, subject to B7 and the A9 policy clarification.** Separating party affiliation from caucus control, requiring verified separate result hosts, preserving the older 1.0 conventions, and providing a prospective Jan 15, 2027 fallback are reasonable operational rules. The January 15 fallback should be labelled an **administrative cutoff**, *not a statistical result*, and must still honor the H1–H4 minimum-data and signed-error rules. The 1.1 operational convention revision must remain distinct from the original H1–H4 preregistration; do not alter the historical source JSON, hashes or prediction files.

## Reproduction

Place the companion `TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js` anywhere, then run:

```bash
node TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js /path/to/polling-lab-project-root
```

**Actual result on uploaded 1.1 source:** 3 of 3 new adversarial checks **FAIL** (two confirmed winner-selection defects; one round-versus-race recount rule to decide). All data used by those checks are artificial and written only in temporary directories.

**Recommendation:** Return to Claude for a small versioned 1.1.1 patch. Have Kimi independently review the same tests. Keep the tracker pre-release and do not publish scores until winner selection is fixed, recount-scope semantics are approved, and domain/clean-checkout verification is completed.
