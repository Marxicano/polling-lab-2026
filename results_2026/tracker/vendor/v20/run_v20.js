// Polling Lab v20 (post-freeze, election eve) — loader.
// Runs the FROZEN v19 engine code (v19_frozen/engine.js, read-only, unchanged) on the SEPARATE
// v20 data folder, then the v20 model layer (engine_v20.js). Nothing here writes to v19_frozen.
// Usage: node v20/run_v20.js [calc_id ...]     (as-of date: env POLLING_LAB_AS_OF, default 2026-11-02)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V19 = path.join(ROOT, 'v19_frozen');
const DATA = path.join(__dirname, 'data');

function parseCSV(t) {
  const rows = []; let i = 0, f = '', r = [], q = false;
  while (i < t.length) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else if (c !== '\r') f += c;
    i++;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const h = rows.shift().map((x) => x.replace(/^\uFEFF/, ''));
  return rows.filter((x) => x.length > 1).map((x) => Object.fromEntries(h.map((k, j) => [k, x[j] ?? ''])));
}

function load(opts) {
  const o = opts || {};
  process.env.POLLING_LAB_AS_OF = o.asOf || process.env.POLLING_LAB_AS_OF || '2026-11-02';
  const dataDir = o.dataDir || DATA;
  const data = {};
  for (const f of fs.readdirSync(dataDir)) if (f.endsWith('.csv')) data[f.replace(/\.csv$/, '')] = parseCSV(fs.readFileSync(path.join(dataDir, f), 'utf8'));
  // Read-only reference to the frozen snapshot, for comparisons only.
  data.v19_snapshot = parseCSV(fs.readFileSync(path.join(V19, 'data', 'snapshot_2026-11-02.csv'), 'utf8'));
  data.v20_preregistration = [JSON.parse(fs.readFileSync(path.join(__dirname, 'preregistration_mike.json'), 'utf8'))];
  const defs = {};
  global.dash = { calc: (id, d) => { if (defs[id]) throw Error('duplicate calc id ' + id); defs[id] = d; } };
  eval(fs.readFileSync(path.join(V19, 'engine.js'), 'utf8'));
  eval(fs.readFileSync(path.join(__dirname, 'engine_v20.js'), 'utf8'));
  const out = {};
  const run = (id) => {
    if (out[id]) return out[id];
    const d = defs[id];
    if (!d) throw Error('unknown input ' + id);
    out[id] = d.fn(...d.inputs.map((i) => (data[i] !== undefined ? data[i] : run(i))));
    return out[id];
  };
  for (const id of Object.keys(defs)) run(id);
  return { out, data, defs, asOf: process.env.POLLING_LAB_AS_OF };
}

module.exports = { load, parseCSV, ROOT, V19, DATA };

if (require.main === module) {
  const { out } = load();
  const ids = process.argv.slice(2);
  console.log(JSON.stringify(ids.length ? Object.fromEntries(ids.map((i) => [i, out[i]])) : out, null, 1));
}
