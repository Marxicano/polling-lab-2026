// Runs all 14 suites: 9 frozen v19, 2 v20, 2 v20.1, 1 explorer.
const { execFileSync } = require('child_process'); const path = require('path');
const ROOT = path.join(__dirname, '..');
let failed = 0;
try { const o = execFileSync(process.execPath, [path.join(ROOT, 'v20_1', 'tests', 'run_all_v201.js')], { encoding: 'utf8' }); console.log(o.trim()); } catch (e) { failed += 1; console.log((e.stdout || '') + (e.stderr || '')); }
try { const o = execFileSync(process.execPath, [path.join(__dirname, 'test_explorer.js')], { encoding: 'utf8', env: Object.assign({}, process.env, { V20_SIMS: process.env.V20_SIMS || '4000' }) }); console.log('OK   explorer/test_explorer.js  ' + o.trim().split('\n').pop()); } catch (e) { failed += 1; console.log('FAIL explorer/test_explorer.js\n' + (e.stdout || '') + (e.stderr || '')); }
console.log(failed ? 'SOME SUITES FAILED' : 'ALL 14 SUITES PASSED'); process.exit(failed ? 1 : 0);
