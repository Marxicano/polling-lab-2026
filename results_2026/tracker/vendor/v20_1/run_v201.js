// Polling Lab v20.1 loader: runs the UNCHANGED v20 pipeline (v19 engine + v20 engine on v20 data),
// then the v20.1 review layer on top, reading v20_1/data overlay tables. Writes nothing.
const fs = require('fs');
const path = require('path');
const { load: loadV20, parseCSV, ROOT, V19 } = require('../v20/run_v20.js');

function load(opts) {
  const base = loadV20(opts);
  const data = Object.assign({}, base.data);
  const dir = path.join(__dirname, 'data');
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.csv')) data[f.replace(/\.csv$/, '')] = parseCSV(fs.readFileSync(path.join(dir, f), 'utf8'));
  const defs = {};
  global.dash = { calc: (id, d) => { if (defs[id] || base.defs[id]) throw Error('duplicate calc id ' + id); defs[id] = d; } };
  eval(fs.readFileSync(path.join(__dirname, 'engine_v201.js'), 'utf8'));
  const out = Object.assign({}, base.out);
  const run = (id) => {
    if (out[id] !== undefined) return out[id];
    const d = defs[id];
    if (!d) throw Error('unknown input ' + id);
    out[id] = d.fn(...d.inputs.map((i) => (data[i] !== undefined ? data[i] : run(i))));
    return out[id];
  };
  for (const id of Object.keys(defs)) run(id);
  return { out, data, defs, v20: base, asOf: base.asOf };
}
module.exports = { load, parseCSV, ROOT, V19 };
if (require.main === module) { const { out } = load(); const ids = process.argv.slice(2); console.log(JSON.stringify(ids.length ? Object.fromEntries(ids.map((i) => [i, out[i]])) : Object.fromEntries(Object.keys(out).filter((k) => /^v201_/.test(k)).map((k) => [k, out[k]])), null, 1)); }
