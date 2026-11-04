# Deployment checklist — tracker 1.1.4 (pre-release rehearsal; no real returns)

Use a scratch branch. Nothing here publishes results or touches v19, v20, v20.1 or H1-H4.

## A. Fresh GitHub checkout
1. `git clone https://github.com/Marxicano/polling-lab-2026.git && cd polling-lab-2026 && git checkout -b tracker-1.1.4-rehearsal`
2. Node 18 or later (`node -v`; the suites were run on v22).
3. Immutable inputs, before copying anything:
   `sha256sum data/snapshot_2026-11-02.csv v20/preregistration_mike.json`
   must print `7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461` and `15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af`. Stop if not.
4. If a tracker 1.0 exists, delete `results_2026/tracker/data/noncompetitive_overrides.csv` (1.1+ refuses to run while it exists). Keep ChatGPT's `results_2026/SCORING_PLAN_2026-11-02.md` untouched.
5. From the complete ZIP copy only `results_2026/tracker/` and `docs/results/` into the checkout. Do not copy `v19_frozen/`, `v20/`, `v20_1/`, `docs/data/` or `explorer/`: the tracker runs on its own 60 vendored copies.
6. `node results_2026/tracker/tests/run_tracker_tests.js` → must end `TRACKER SUITES PASSED (1.1.4)`. Expected: tracker 9/9; review checks 22/22, 13/13, 7/7, 8/8, 6/6; ChatGPT's and Kimi's independent scripts pass.
7. Cross-check against the repository's own copies:
   `node -e "const v=require('./results_2026/tracker/lib/deps.js').verifyDependencies();console.log(v.ok, v.files.length, JSON.stringify(v.repo_checks.filter(c=>c.status!=='absent')))"`
   must print `true 60` and only `match` entries (expected at least: data/snapshot_2026-11-02.csv, v20/preregistration_mike.json, docs/data/site_v20.json, v20_1/score_v201.js). Any `mismatch` stops the tracker by design: investigate the repository copy; never edit `vendor/`.
8. Tamper rehearsal on a throwaway copy: append a byte to `results_2026/tracker/vendor/v20/run_v20.js`, run `node results_2026/tracker/build_dashboard.js` → must fail with "Dependency verification failed". Discard the copy.
9. `node results_2026/tracker/build_dashboard.js`; open `docs/results/index.html`: "Pre-release for review", 15 races "No official results yet", control "not computed", registered tests "Not recorded".
10. `node results_2026/tracker/print_chain_heads.js` → commit its output alone in a dated commit (anchors the empty logs).
11. `git status` must show changes only under `results_2026/tracker/` and `docs/results/`. Commit to the rehearsal branch; do not merge or publish Pages until section B and the reviewers' sign-off are complete.

## B. The 35 election authorities (before any real return)
Fill `results_2026/tracker/AUTHORITY_VERIFICATION_WORKSHEET_35.csv`, one row per state, two people per row.
1. Type the `authority_url`; confirm it is the state's election authority over valid HTTPS.
2. Confirm every `authority_domains_in_tracker` entry belongs to that authority (linked from its own site).
3. From the authority's own site, find the 2026 general election results page and record its URL.
4. If that page is on an authority domain or its subdomain, nothing else is needed. If it is on a separate host (the `pending_result_hosts`, e.g. results.elections.myflorida.com, electionresults.iowa.gov, mielections.us, electionresults.nebraska.gov, enr-scvotes.org, results.texas-election.com), record the authority page that links to it with `append_domain_verification.js` (dry run first) and note the record id.
5. Record the certifying body and expected certification date.
6. State items: Maine — where Round 0 results show Blank and Overvote counts, and where the RCV count report is posted. Alaska — initial tabulation and RCV report pages. Georgia — Dec 1 runoff page. Mississippi — confirm no statewide election-night reporting; Secretary of State certified returns only.
7. A wrong or outdated domain in `official_sources.csv` cannot be edited in place (static data is pinned): record it under issues; the fix ships as a new tracker version.
8. Sign and date both verifier columns; commit the worksheet as evidence (the code does not read it).

## C. Before the first real return
- ChatGPT and Kimi re-run the complete ZIP (`node results_2026/tracker/tests/run_all_with_tracker.js`) and this checklist.
- Every imported report follows the human verification checklist in DATA_ENTRY_GUIDE.md (exact page URL, numbers checked by a second person, Maine Round 0 counts).
- The tracker stays labeled pre-release until those sign-offs exist.
