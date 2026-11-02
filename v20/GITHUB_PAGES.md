# Publishing the dashboard on GitHub Pages
1. Copy the `docs/` folder (including the empty `.nojekyll` file) to the root of the `polling-lab-2026` repository on `main`. Do not touch `data/snapshot_2026-11-02.csv`, its manifest or `SNAPSHOT_RECORD.md`.
2. Repository Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch `main`, folder `/docs` → Save.
3. The site appears at `https://marxicano.github.io/polling-lab-2026/` within a few minutes.
4. `docs/index.html` embeds its data, so it also works when opened as a local file. `docs/data/site_v20.json` is the same data for anyone who wants to reuse it.
5. To update after new data: edit `v20/data`, run `node v20/tests/run_all.js`, then `node v20/build_site.js`, and commit `docs/` with a message saying what changed. Never edit the v19 files.
