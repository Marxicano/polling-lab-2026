// Dependency fingerprinting for the results tracker (1.1).
// The tracker runs only on byte-identical vendored copies of the published v19, v20 and v20.1 files it needs.
// Every load verifies: the pinned manifest, the pinned published checksum lists, every vendored file against
// both, the two public anchors, that no unlisted file sits in vendor/, and that any copy of the same file
// present elsewhere in the checkout is identical. Any failure stops the tracker (fail closed).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRACKER = path.join(__dirname, '..');
const VENDOR = path.join(TRACKER, 'vendor');
const REPO = path.join(TRACKER, '..', '..');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const PINNED = {
  manifest: '0c42360cac97409dc3923a2b09e55ca86f1e6473f2e7bc84ccf616b2ca72a69b',
  lists: {
    'v19_frozen/SHA256SUMS.txt': '24446e1de0550836f83bb379f2e6c80774331d9e8950fa365ef8327583da7464',
    'checksums/SHA256SUMS_V20.txt': 'b144fbff97a4400019aade6bc2b4a3a3e5a00bc7ce4bf1f27fab9f9b552a42ba',
    'checksums/SHA256SUMS_V20_1.txt': '3ef784da452a37930766715219db3287138e70c5e7eca86fda3dd6b1f00ddd48',
  },
  anchors: {
    'v19_frozen/data/snapshot_2026-11-02.csv': '7cd5e1f9581a0edaaca6c69148c8dbd97cdb1c34ff7e2542d691535fb270c461',
    'v20/preregistration_mike.json': '15da8d6c9d3c37cb4b3f1ba79b7a9372e9e2b81eae9ef40c6e16e551a3cdd1af',
  },
};

function parseList(file) {
  const out = {};
  fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach((line) => { const m = line.match(/^([0-9a-f]{64})\s+\.?\/?(.+)$/); if (m) out[m[2].trim()] = m[1]; });
  return out;
}
function walk(dir, base, acc) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p, base, acc); else acc.push(path.relative(base, p).split(path.sep).join('/')); } return acc; }

// Copies of the same published files that may exist elsewhere in a checkout (layouts differ between packages).
// Checksum lists are pinned by hash instead (a checkout may legitimately hold regenerated lists).
function repoCandidates(rel) {
  if (rel.startsWith('checksums/') || rel === 'v19_frozen/SHA256SUMS.txt') return [];
  if (rel.startsWith('v19_frozen/data/snapshot')) return ['v19_frozen/data/snapshot_2026-11-02.csv', 'data/snapshot_2026-11-02.csv'];
  return [rel];
}

function verifyDependencies(opts) {
  const o = opts || {};
  const vendor = o.vendor || VENDOR; const repo = o.repo || REPO;
  const errors = []; const repoChecks = [];
  const manPath = path.join(vendor, 'DEPENDENCIES.json');
  if (!fs.existsSync(manPath)) return { ok: false, errors: ['vendor/DEPENDENCIES.json missing'], files: [], repo_checks: [] };
  const manBuf = fs.readFileSync(manPath); const manHash = sha(manBuf);
  if (manHash !== PINNED.manifest) errors.push('dependency manifest changed (sha256 ' + manHash + ')');
  const man = JSON.parse(manBuf.toString('utf8'));
  const lists = {};
  Object.keys(PINNED.lists).forEach((l) => {
    const p = path.join(vendor, l);
    if (!fs.existsSync(p)) { errors.push('missing checksum list ' + l); return; }
    const h = sha(fs.readFileSync(p)); if (h !== PINNED.lists[l]) errors.push('published checksum list changed: ' + l);
    lists[l] = parseList(p);
  });
  const files = [];
  man.files.forEach((f) => {
    const p = path.join(vendor, f.path);
    if (!fs.existsSync(p)) { errors.push('missing dependency ' + f.path); return; }
    const h = sha(fs.readFileSync(p));
    if (h !== f.sha256) errors.push('dependency altered: ' + f.path);
    if (lists[f.vouched_by] && lists[f.vouched_by][f.entry] !== f.sha256) errors.push('dependency not vouched by ' + f.vouched_by + ': ' + f.path);
    if (!lists[f.vouched_by] && f.vouched_by !== 'pinned in lib/deps.js') errors.push('unknown voucher for ' + f.path);
    if (f.vouched_by === 'pinned in lib/deps.js' && PINNED.lists[f.path] !== h) errors.push('pinned list mismatch: ' + f.path);
    files.push({ path: f.path, sha256: h, vouched_by: f.vouched_by });
  });
  Object.keys(PINNED.anchors).forEach((a) => { const f = files.find((x) => x.path === a); if (!f || f.sha256 !== PINNED.anchors[a]) errors.push('public anchor missing or different: ' + a); });
  const listed = new Set(man.files.map((f) => f.path).concat(['DEPENDENCIES.json']));
  walk(vendor, vendor, []).forEach((rel) => { if (!listed.has(rel)) errors.push('unlisted file in vendor/: ' + rel); });
  // Cross-check any originals present in the checkout; a differing copy means something published was altered.
  man.files.forEach((f) => {
    let found = false;
    repoCandidates(f.path).forEach((rp) => {
      const full = path.join(repo, rp);
      if (path.resolve(full).startsWith(path.resolve(vendor))) return;
      if (fs.existsSync(full)) { found = true; const h = sha(fs.readFileSync(full)); const status = h === f.sha256 ? 'match' : 'mismatch'; repoChecks.push({ path: f.path, repo_path: rp, status }); if (status === 'mismatch') errors.push('checkout copy differs from the published file: ' + rp); }
    });
    if (!found) repoChecks.push({ path: f.path, repo_path: null, status: 'absent' });
  });
  return { ok: errors.length === 0, errors, files, manifest_sha256: manHash, repo_checks: repoChecks, vendor };
}

function ensureDependencies(opts) {
  const v = verifyDependencies(opts);
  if (!v.ok) throw new Error('Dependency verification failed; the tracker will not run. ' + v.errors.slice(0, 6).join('; ') + (v.errors.length > 6 ? ' (+' + (v.errors.length - 6) + ' more)' : ''));
  return v;
}
const vendorPath = (rel) => path.join(VENDOR, rel);

module.exports = { PINNED, TRACKER, VENDOR, REPO, verifyDependencies, ensureDependencies, vendorPath, sha };
