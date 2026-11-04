// Runs every existing suite (explorer/run_all_explorer.js, if present) and then both tracker suites.
const { execFileSync } = require('child_process'); const path = require('path'); const fs = require('fs');
const REPO = path.join(__dirname, '..', '..', '..'); let failed = 0;
const runner = path.join(REPO, 'explorer', 'run_all_explorer.js');
if (fs.existsSync(runner)) { try { console.log(execFileSync(process.execPath, [runner], { cwd: REPO, encoding: 'utf8' }).trim()); } catch (e) { failed += 1; console.log((e.stdout || '') + (e.stderr || '')); } }
else console.log('explorer/run_all_explorer.js not found in this checkout: earlier suites skipped');
['test_tracker.js', 'test_review_regressions.js', 'test_review_1_1_1.js', 'test_review_1_1_2.js', 'test_review_1_1_3.js', 'test_review_1_1_4.js'].forEach((t) => {
  try { const o = execFileSync(process.execPath, [path.join(__dirname, t)], { cwd: REPO, encoding: 'utf8', env: Object.assign({}, process.env, { V20_SIMS: process.env.V20_SIMS || '3000' }) }); console.log('OK   results_2026/tracker/tests/' + t + '  ' + o.trim().split('\n').pop()); }
  catch (e) { failed += 1; console.log('FAIL results_2026/tracker/tests/' + t + '\n' + (e.stdout || '') + (e.stderr || '')); }
});
[['TRACKER_1_1_INDEPENDENT_EDGE_REGRESSIONS.js', 'ChatGPT 1.1 edge tests, final-round fixtures updated to two finalists'], ['TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE_reconstructed.js', 'reconstruction of ChatGPT 1.1.1 RCV final-round test'], ['TRACKER_1_1_1_RCV_FINAL_ROUND_EDGE.js', 'ChatGPT original 1.1.1 RCV final-round test, unchanged'], ['run_maine_blank_ballot_demo.js', 'ChatGPT 1.1.2 Maine blank-ballot demonstration, unchanged, via wrapper'], ['TRACKER_1_1_3_MAINE_ROUND0_REGRESSION_adapted.js', 'Kimi 1.1.3 Maine Round 0 regression, field mapping adapted, expectations unchanged']].forEach(([f, label]) => { try { const o = execFileSync(process.execPath, [path.join(__dirname, 'independent', f), REPO], { cwd: REPO, encoding: 'utf8' }); console.log('OK   results_2026/tracker/tests/independent/' + f + ' (' + label + ')  ' + o.trim().split('\n').pop()); } catch (e) { failed += 1; console.log('FAIL ' + f + '\n' + (e.stdout || '') + (e.stderr || '')); } });
console.log(failed ? 'SOME SUITES FAILED' : 'ALL SUITES PASSED (tracker 1.1.4, pre-release)'); process.exit(failed ? 1 : 0);
