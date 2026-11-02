// Runs every suite: 9 frozen v19, 2 published v20, 2 v20.1.
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'); let failed = 0;
const run = (f, cwd) => { try { const o = execFileSync(process.execPath, [f], { cwd, env: Object.assign({}, process.env, { V20_SIMS: process.env.V20_SIMS || '4000' }), encoding: 'utf8' }); console.log('OK   ' + path.relative(ROOT, path.join(cwd, f)) + '  ' + (o.trim().split('\n').pop() || '').slice(0, 100)); } catch (e) { failed += 1; console.log('FAIL ' + path.relative(ROOT, path.join(cwd, f)) + '\n' + (e.stdout || '') + (e.stderr || '')); } };
const V19 = path.join(ROOT, 'v19_frozen');
fs.readdirSync(V19).filter((f) => /^test_.*\.js$/.test(f)).sort().forEach((f) => run(f, V19));
['test_v20.js', 'test_v20_site.js'].forEach((f) => run(f, path.join(ROOT, 'v20', 'tests')));
['test_v201.js', 'test_v201_site.js'].forEach((f) => run(f, __dirname));
console.log(failed ? failed + ' suite(s) failed' : 'ALL 13 SUITES PASSED'); process.exit(failed ? 1 : 0);
