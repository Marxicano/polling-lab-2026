// Runs only the tracker suites; use this in a fresh clone of the live repository after adding results_2026/tracker.
const { execFileSync } = require('child_process'); const path = require('path');
const REPO = path.join(__dirname, '..', '..', '..'); let failed = 0;
['test_tracker.js', 'test_review_regressions.js', 'test_review_1_1_1.js', 'test_review_1_1_2.js', 'test_review_1_1_3.js', 'test_review_1_1_4.js'].forEach((t) => {
  try { const o = execFileSync(process.execPath, [path.join(__dirname, t)], { cwd: REPO, encoding: 'utf8', env: Object.assign({}, process.env, { V20_SIMS: process.env.V20_SIMS || '3000' }) }); console.log(o.trim()); }
  catch (e) { failed += 1; console.log('FAIL ' + t + '\n' + (e.stdout || '') + (e.stderr || '')); }
});
['TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js', 'TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE_reconstructed.js', 'TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE.js', 'run_maine_blank_ballot_demo.js', 'TRACKER_1_1_3_MAINE_ROUND0_REGRESSION_adapted.js'].forEach((f) => { try { console.log(execFileSync(process.execPath, [path.join(__dirname, 'independent', f), REPO], { cwd: REPO, encoding: 'utf8' }).trim()); } catch (e) { failed += 1; console.log('FAIL ' + f + '\n' + (e.stdout || '') + (e.stderr || '')); } });
console.log(failed ? 'TRACKER SUITES FAILED' : 'TRACKER SUITES PASSED (1.1.4)'); process.exit(failed ? 1 : 0);
