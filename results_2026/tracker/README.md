# 2026 Senate results tracker (`results_2026/tracker/`) — version 1.1.4, pre-release

**Status: not production-ready.** Version 1.1 fixed the release blockers in ChatGPT's first tracker review; 1.1.1 fixes the two winner-selection defects and settles the recount scope raised in its review of 1.1; 1.1.2 requires exactly two finalists in a final ranked-choice round; 1.1.3 separates each state's legal majority denominator from the polling-error denominator (ChatGPT's review of 1.1.2); 1.1.4 accepts an official Maine final round when the Round 0 denominator is missing (Kimi's case). 1.1.4 has not been re-audited yet. Do not enter real returns or publish scores until ChatGPT and Kimi have rerun the tests.

It records official returns for the 15 races the Polling Lab tracked, compares them with the frozen v19 snapshot (primary) and the post-freeze v20 estimates (secondary), tracks the 20 untracked 2026 contests, and runs the pre-registered H1–H4 tests once after certification. It implements ChatGPT's `results_2026/SCORING_PLAN_2026-11-02.md`.

## Runs from a clean checkout
The tracker carries byte-identical copies of the 60 published v19, v20 and v20.1 files it needs in `vendor/`, listed in `vendor/DEPENDENCIES.json`. On every load it checks: the pinned manifest; the pinned published checksum lists (`SHA256SUMS_V20.txt`, `SHA256SUMS_V20_1.txt`, v19 `SHA256SUMS.txt`); every vendored file against both; the public anchors (v19 snapshot `7cd5e1f9…c461`, pre-registration `15da8d6c…d1af`); that no unlisted file sits in `vendor/`; and that any copy of the same published file elsewhere in the checkout is identical. Any failure stops the tracker. It therefore needs nothing else from the repository and never edits the originals.

## What it never touches
v19, v20 and v20.1 estimates, source archives, the H1–H4 pre-registration and the explorer. A test confirms nothing outside `results_2026/tracker/` and `docs/results/` changes when it runs.

## Data
| File | Purpose |
|---|---|
| `data/races_2026.csv` | The 15 tracked races, candidates, ranked-choice and runoff rules |
| `data/untracked_races_2026.csv` | The 20 untracked 2026 contests and their current holders |
| `data/official_sources.csv` | 35 election authorities: confirmed authority domains, and separate results hosts awaiting verification |
| `data/caucus_alignment.csv` | King and Sanders (independents who caucus with Democrats); Osborn's caucus unconfirmed |
| `data/candidate_returns.csv` | Official returns, one complete report at a time (hash-chained) |
| `data/untracked_results.csv` | Certified results for untracked contests (hash-chained) |
| `data/domain_verifications.csv` | Proof that an authority's own page links to a separate results host (hash-chained) |
| `data/scoring_conventions.json` | Measurement rules, version 1.1 (written before results; v1.0 kept in `data/archive/`) |
| `data/TRACKER_STATIC.json` | Pins the static files above; a change needs a new tracker version |
| `data/registered_scoring_record.json` | Written once, when H1–H4 are first run; never overwritten |

## Statuses
| Latest report | Shown | Error | Winner |
|---|---|---|---|
| none | estimates | no | no |
| unofficial, below 100% | counts, share and unit | no | no |
| unofficial, 100% of ballots or precincts | counts and margin | provisional only | no |
| recount | counts | no (suspended) | no (suspended) |
| certified, recount_certified, amended_certified | everything | scored | yes |

Unofficial reports are refused after certification or a recount; a second "certified" must be `amended_certified` or `recount_certified`.

**Winners** come from all candidates in the certified deciding round (plurality; Georgia's November majority or runoff; Alaska's and Maine's first-round majority or final ranked-choice round, which must list exactly two continuing candidates), never from the sign of the two-candidate polling margin, which remains the scored quantity. An aggregate row of other candidates (`OTH`) never wins.

**Two denominators.** The polling error always uses candidate votes (registered; unchanged). The legal first-round majority uses each state's own denominator: in Maine, all ballots cast for the office including blank and overvoted first rankings; in Alaska, active ballots; in Georgia, votes cast for the office. A Maine first-round winner needs the ballots-cast counts; without them the first-round winner is withheld for review, but an official final ranked-choice round is accepted (the law sends a race to rounds only when no one had a majority of all ballots) and decides the winner with a flag. Recorded counts that contradict an official final round are refused: stop and escalate.

**Recount scope follows the ballots.** Ranked-choice rounds are tabulations of the same ballots, so in Alaska and Maine a recount in any round suspends the whole race. Georgia's runoff is a separate election, so a runoff recount withholds only the winner; the certified November score stands.

## Seats
Shown two ways: party affiliation (Democratic / Republican / independent) and caucus alignment. Untracked contests count as assumptions until certified, and chamber control is not computed until all 35 contests are confirmed. The frozen v19 53 D / 47 R figure is caucus-equivalent and labeled as such.

## Integrity, honestly stated
The logs are hash-chained: edits and deletions are detected, and every stored report is re-validated on each load. A complete rewrite of a log with recomputed hashes is not detectable by the chain alone, so anchor the chain: run `node results_2026/tracker/print_chain_heads.js` after each data entry and publish the output in a separate, dated commit.

## Commands
```
node results_2026/tracker/append_returns.js rows.csv --dry-run        # then without --dry-run
node results_2026/tracker/append_untracked.js rows.csv --dry-run
node results_2026/tracker/append_domain_verification.js rows.csv --dry-run
node results_2026/tracker/build_dashboard.js
node results_2026/tracker/print_chain_heads.js
node results_2026/tracker/record_registered_scoring.js                # once, after the gate opens
node results_2026/tracker/tests/run_tracker_tests.js                  # tracker suites only (use in a fresh clone)
node results_2026/tracker/tests/run_all_with_tracker.js               # plus every earlier suite, if present
```

## Upgrading a checkout that has tracker 1.0
Delete `results_2026/tracker/data/noncompetitive_overrides.csv` (1.1 refuses to run while that unvalidated file exists), plus the 1.0 files `SHA256SUMS_DOCS_RESULTS.txt` and `TEST_RESULTS_RESULTS_TRACKER.txt`, then copy in the 1.1 patch. No results had been entered in 1.0, so nothing needs migrating.
