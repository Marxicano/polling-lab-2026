// Wrapper (Claude) for ChatGPT's unchanged demonstration script TRACKER_1_1_2_MAINE_BLANK_BALLOT_EDGE.js.
// That script was written to DEMONSTRATE the bug: it exits normally when the tracker declares the false Maine
// majority, and throws "Unexpected: tracker did not reproduce denominator issue" once the bug is gone.
// This wrapper turns that into a pass/fail check. Run from the repository root.
'use strict';
const { spawnSync } = require('child_process'); const path = require('path');
const r = spawnSync(process.execPath, [path.join(__dirname, 'TRACKER_1_1_2_MAINE_BLANK_BALLOT_EDGE.js')], { cwd: path.join(__dirname, '..', '..', '..', '..'), encoding: 'utf8' });
const out = (r.stdout || '') + (r.stderr || '');
const fixed = r.status !== 0 && /did not reproduce denominator issue/.test(out) && !/"winner":"D"/.test(out);
console.log(out.trim().split('\n').filter((l) => /THRESHOLD|TRACKER|REJECTS|UNEXPECTED|Unexpected/.test(l)).map((l) => '   ' + l.slice(0, 200)).join('\n'));
console.log((fixed ? 'PASS' : 'FAIL') + ' Maine blank-ballot demonstration: ' + (fixed ? 'the false first-round majority no longer reproduces' : 'the tracker still declares a first-round majority from candidate votes only'));
process.exit(fixed ? 0 : 1);
