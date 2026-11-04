// Polling Lab 2026 — election results tracker library, version 1.1.
// Runs only on verified, byte-identical vendored copies of the published v19/v20/v20.1 files (lib/deps.js).
// Official returns live in append-only, hash-chained logs; every report is validated as a complete unit.
'use strict';
const fs = require('fs');
const path = require('path');
const deps = require('./deps.js');

const TRACKER = deps.TRACKER;
const REPO = deps.REPO;
const DATA = path.join(TRACKER, 'data');
const sha = deps.sha;
const STATIC_MANIFEST_HASH = 'a77061e0c71f8bc19557293d6d548c026603a64b32a76956bb752e73af509114';
const CONVENTIONS_HASH = '8b58b910860094c1eec78cf2653910afe640ab296e96670eb1726112c294a839';
const MAX_VOTES = 50000000;
const CERT_TYPES = ['certified', 'recount_certified', 'amended_certified'];
const UNITS = ['ballots', 'precincts', 'counties'];
// Ballot party codes. OTH is an aggregate of other candidates and write-ins: it is never a candidate and never wins.
const BALLOT_PARTIES = ['D', 'R', 'I', 'L', 'G', 'CON', 'OTH'];
const seatOf = (p) => (p === 'D' || p === 'R' ? p : 'I'); // seat category: Democratic, Republican, or independent/other

// ---------- CSV ----------
function parseCSV(t) {
  const rows = []; let i = 0, f = '', r = [], q = false;
  t = String(t).replace(/^\uFEFF/, '');
  while (i < t.length) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 1; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else if (c !== '\r') f += c;
    i += 1;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const h = rows.shift() || [];
  return rows.filter((x) => x.length > 1 || (x.length === 1 && x[0] !== '')).map((x) => { if (x.length !== h.length) throw new Error('CSV row has ' + x.length + ' fields, header has ' + h.length); return Object.fromEntries(h.map((k, j) => [k, x[j]])); });
}
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const readCSV = (file) => parseCSV(fs.readFileSync(file, 'utf8'));

// ---------- hash-chained logs ----------
const LOGS = {
  returns: { file: 'candidate_returns.csv', genesis: 'GENESIS-polling-lab-2026-results', prefix: 'R',
    fields: ['record_id', 'state', 'office', 'round', 'candidate', 'ballot_party', 'votes', 'total_votes', 'reported_pct', 'reporting_unit', 'authority_status_text', 'reporting_status', 'report_timestamp_utc', 'retrieved_at_utc', 'certification_date', 'authority_name', 'source_url', 'ballots_cast_for_office', 'blank_first_rank', 'overvote_first_rank', 'excluded_first_rank', 'denominator_source_url', 'notes', 'entered_by', 'prev_hash', 'row_hash'] },
  untracked: { file: 'untracked_results.csv', genesis: 'GENESIS-polling-lab-2026-untracked', prefix: 'U',
    fields: ['record_id', 'state', 'round', 'candidate_winner', 'winner_party', 'reporting_status', 'report_timestamp_utc', 'retrieved_at_utc', 'certification_date', 'authority_name', 'source_url', 'notes', 'entered_by', 'prev_hash', 'row_hash'] },
  domains: { file: 'domain_verifications.csv', genesis: 'GENESIS-polling-lab-2026-domains', prefix: 'V',
    fields: ['record_id', 'state', 'host', 'authority_page_url', 'verified_at_utc', 'verified_by', 'evidence_note', 'prev_hash', 'row_hash'] },
};
const RETURN_FIELDS = LOGS.returns.fields;
const GENESIS = LOGS.returns.genesis;
function rowHashFor(log, row) { return sha(log.fields.filter((k) => k !== 'row_hash').map((k) => k + '=' + (row[k] == null ? '' : String(row[k]))).join('\u001f')); }
const rowHash = (row) => rowHashFor(LOGS.returns, row);
function verifyChainFor(log, rows) {
  const errors = []; let prev = log.genesis; const ids = new Set();
  rows.forEach((r, i) => {
    if (r.prev_hash !== prev) errors.push(log.file + ' row ' + (i + 1) + ' (' + r.record_id + '): prev_hash does not match the previous row');
    if (rowHashFor(log, r) !== r.row_hash) errors.push(log.file + ' row ' + (i + 1) + ' (' + r.record_id + '): row_hash does not match its contents');
    if (ids.has(r.record_id)) errors.push(log.file + ': duplicate record_id ' + r.record_id);
    ids.add(r.record_id); prev = r.row_hash;
  });
  return { ok: errors.length === 0, errors, head: prev };
}
const verifyChain = (rows) => verifyChainFor(LOGS.returns, rows);

// ---------- static data ----------
const STATIC_FILES = ['races_2026.csv', 'untracked_races_2026.csv', 'official_sources.csv', 'caucus_alignment.csv', 'scoring_conventions.json', 'archive/scoring_conventions_v1.0.json', 'archive/scoring_conventions_v1.1.json', 'archive/scoring_conventions_v1.1.1.json', 'archive/scoring_conventions_v1.1.3.json'];
function verifyStatic(dir) {
  const manPath = path.join(dir, 'TRACKER_STATIC.json');
  if (!fs.existsSync(manPath)) throw new Error('data/TRACKER_STATIC.json missing');
  const h = sha(fs.readFileSync(manPath));
  if (STATIC_MANIFEST_HASH.indexOf('__') !== 0 && h !== STATIC_MANIFEST_HASH) throw new Error('data/TRACKER_STATIC.json changed (sha256 ' + h + ')');
  const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
  STATIC_FILES.forEach((f) => { const p = path.join(dir, f); if (!fs.existsSync(p)) throw new Error('static file missing: ' + f); if (sha(fs.readFileSync(p)) !== man[f]) throw new Error('static file changed without a new tracker version: ' + f); });
  return h;
}

// ---------- validation helpers ----------
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const safeInt = (x) => /^\d+$/.test(String(x)) && Number.isSafeInteger(Number(x)) && Number(x) <= MAX_VOTES;
function hostOf(url) { try { const u = new URL(url); return u.protocol === 'https:' ? u.hostname.toLowerCase() : null; } catch (e) { return null; } }
const within = (h, domains) => domains.some((d) => h === d || h.endsWith('.' + d));
function hostAllowed(url, allowed) { const h = hostOf(url); return !!h && within(h, allowed); }
function sourceAllowed(state, url, D) {
  const src = D.sources.find((s) => s.state === state); const h = hostOf(url);
  if (!src || !h) return false;
  if (within(h, src.authority_domains.split(';').filter(Boolean))) return true;
  return D.domains.some((v) => v.state === state && norm(v.host) === h);
}

function loadData(dataDir, opts) {
  const dir = dataDir || DATA;
  const dep = deps.ensureDependencies(opts && opts.depOpts);
  if (fs.existsSync(path.join(dir, 'noncompetitive_overrides.csv'))) throw new Error('legacy noncompetitive_overrides.csv found: untracked results must go through append_untracked.js');
  const staticHash = verifyStatic(dir);
  const D = {
    dir, deps: dep, staticHash,
    races: readCSV(path.join(dir, 'races_2026.csv')),
    untrackedRaces: readCSV(path.join(dir, 'untracked_races_2026.csv')),
    sources: readCSV(path.join(dir, 'official_sources.csv')),
    caucus: readCSV(path.join(dir, 'caucus_alignment.csv')),
    corrections: fs.existsSync(path.join(dir, 'corrections_ledger.csv')) ? readCSV(path.join(dir, 'corrections_ledger.csv')) : [],
    conventions: JSON.parse(fs.readFileSync(path.join(dir, 'scoring_conventions.json'), 'utf8')),
    conventionsHash: sha(fs.readFileSync(path.join(dir, 'scoring_conventions.json'))),
    domains: [], returns: [], untracked: [], record: null,
  };
  if (D.conventionsHash !== CONVENTIONS_HASH) throw new Error('scoring_conventions.json changed after registration');
  // Each log: verify its chain, then re-validate every stored row and report in order.
  ['domains', 'untracked', 'returns'].forEach((k) => {
    const rows = readCSV(path.join(dir, LOGS[k].file));
    const ch = verifyChainFor(LOGS[k], rows); if (!ch.ok) throw new Error('log fails verification: ' + ch.errors.join('; '));
    D[k + 'Head'] = ch.head;
    if (k === 'domains') rows.forEach((r) => { const e = validateDomainRow(r, D); if (e.length) throw new Error('stored domain verification ' + r.record_id + ' invalid: ' + e.join('; ')); D.domains.push(r); });
    if (k === 'untracked') rows.forEach((r) => { const e = validateUntrackedRow(r, D, D.untracked); if (e.length) throw new Error('stored untracked result ' + r.record_id + ' invalid: ' + e.join('; ')); D.untracked.push(r); });
    if (k === 'returns') groupReports(rows).forEach((g) => { const e = validateReport(g, D, D.returns); if (e.length) throw new Error('stored report ' + g[0].record_id + ' invalid: ' + e.join('; ')); D.returns.push(...g); });
  });
  const recPath = path.join(dir, 'registered_scoring_record.json');
  if (fs.existsSync(recPath)) {
    const rec = JSON.parse(fs.readFileSync(recPath, 'utf8')); const body = Object.assign({}, rec); delete body.record_sha256;
    if (sha(JSON.stringify(body)) !== rec.record_sha256) throw new Error('registered_scoring_record.json fails its integrity check');
    D.record = rec;
  }
  return D;
}

const reportKey = (r) => [r.state, r.round, r.reporting_status, r.report_timestamp_utc].join('|');
function groupReports(rows) { const order = []; const by = {}; rows.forEach((r) => { const k = reportKey(r); if (!by[k]) { by[k] = []; order.push(k); } by[k].push(r); }); return order.map((k) => by[k]); }

const DEN_FIELDS = ['ballots_cast_for_office', 'blank_first_rank', 'overvote_first_rank', 'excluded_first_rank', 'denominator_source_url'];
const SHARED = ['state', 'office', 'round', 'reporting_status', 'report_timestamp_utc', 'retrieved_at_utc', 'certification_date', 'authority_name', 'source_url', 'reported_pct', 'reporting_unit', 'authority_status_text', 'entered_by'].concat(DEN_FIELDS);
function validateReport(rows, D, existing) {
  const e = []; const r0 = rows[0];
  SHARED.forEach((k) => { if (rows.some((r) => String(r[k] == null ? '' : r[k]) !== String(r0[k] == null ? '' : r0[k]))) e.push('rows of one report disagree on ' + k); });
  const race = D.races.find((x) => x.state === r0.state);
  if (!race) { e.push('state ' + r0.state + ' is not one of the 15 tracked races'); return e; }
  if (r0.office !== 'U.S. Senate') e.push('office must be "U.S. Senate"');
  if (['first', 'rcv_final', 'runoff'].indexOf(r0.round) < 0) e.push('round must be first, rcv_final or runoff');
  if (r0.round === 'rcv_final' && race.ranked_choice !== 'yes') e.push('rcv_final only for ranked-choice states');
  if (r0.round === 'runoff' && r0.state !== 'GA') e.push('runoff only for Georgia');
  const st = r0.reporting_status; const cert = CERT_TYPES.indexOf(st) >= 0;
  if (D.conventions.statuses.indexOf(st) < 0) e.push('unknown reporting_status ' + st);
  if (!ISO.test(r0.report_timestamp_utc) || !ISO.test(r0.retrieved_at_utc)) e.push('timestamps must be ISO UTC');
  if (cert && !DATE.test(r0.certification_date)) e.push(st + ' needs certification_date');
  if (!cert && r0.certification_date) e.push('only certified statuses carry a certification_date');
  if (r0.reported_pct !== '') { if (!(Number(r0.reported_pct) >= 0 && Number(r0.reported_pct) <= 100)) e.push('reported_pct must be 0-100'); if (UNITS.indexOf(r0.reporting_unit) < 0) e.push('a reported share needs reporting_unit (ballots, precincts or counties)'); }
  if (cert && r0.reported_pct !== '' && Number(r0.reported_pct) !== 100) e.push('a certified report cannot be partial');
  if (!r0.authority_status_text) e.push('authority_status_text required (the authority’s own status wording)');
  if (!r0.entered_by) e.push('entered_by required');
  if (!sourceAllowed(r0.state, r0.source_url, D)) e.push('source_url is not on a confirmed or verified official host for ' + r0.state);
  // Legal-majority denominator (all ballots cast for the office): separate from the candidate-vote total used for polling error.
  if (DEN_FIELDS.some((k) => r0[k])) {
    if (r0.round !== 'first') e.push('ballots-cast denominator fields belong only on first-round reports');
    else {
      const num = (k) => (r0[k] === '' && k === 'excluded_first_rank' ? 0 : (safeInt(r0[k]) ? Number(r0[k]) : NaN));
      const cast = num('ballots_cast_for_office'), blank = num('blank_first_rank'), over = num('overvote_first_rank'), excl = num('excluded_first_rank');
      if ([cast, blank, over, excl].some((x) => !Number.isFinite(x))) e.push('ballots_cast_for_office, blank_first_rank and overvote_first_rank must all be whole numbers (excluded_first_rank optional)');
      else if (safeInt(r0.total_votes) && cast !== Number(r0.total_votes) + blank + over + excl) e.push('ballots cast for the office (' + cast + ') must reconcile to candidate votes (' + r0.total_votes + ') plus blank, overvoted and excluded first rankings (' + (blank + over + excl) + ')' + (cast < Number(r0.total_votes) ? '; it is below the candidate votes' : ''));
      if (!sourceAllowed(r0.state, r0.denominator_source_url, D)) e.push('denominator_source_url must be an official page for ' + r0.state + ' showing the blank and overvote counts');
    }
  }
  const names = rows.map((r) => norm(r.candidate));
  if (names.some((n) => !n)) e.push('every row needs a candidate name');
  if (new Set(names).size !== names.length) e.push('duplicate candidate rows');
  if (rows.some((r) => BALLOT_PARTIES.indexOf(r.ballot_party) < 0)) e.push('ballot_party must be one of ' + BALLOT_PARTIES.join(', ') + ' (OTH = aggregate of other candidates and write-ins)');
  const agg = rows.filter((r) => r.ballot_party === 'OTH');
  if (agg.length > 1) e.push('at most one aggregate (OTH) row per report');
  const ch = rows.filter((r) => norm(r.candidate) === norm(race.challenger)); const rp = rows.filter((r) => norm(r.candidate) === norm(race.republican));
  if (ch.length === 1 && ch[0].ballot_party !== race.challenger_party) e.push(race.challenger + ' must carry party ' + race.challenger_party);
  if (rp.length === 1 && rp[0].ballot_party !== 'R') e.push(race.republican + ' must carry party R');
  if (r0.round === 'first') {
    if (ch.length !== 1 || rp.length !== 1) e.push('report must list ' + race.challenger + ' and ' + race.republican + ' exactly once');
  } else {
    // Ranked-choice final rounds and the Georgia runoff: individual candidates from the first round only.
    if (agg.length) e.push('a ' + r0.round + ' report lists individual candidates only (no aggregate rows)');
    if (r0.round === 'rcv_final' && rows.length !== 2) e.push('a final ranked-choice round must list exactly two continuing candidates (Alaska and Maine tabulate until two remain unless someone wins the first round)');
    if (r0.round === 'runoff' && rows.length < 2) e.push('a runoff report needs two candidates');
    const firstReports = groupReports(existing.filter((x) => x.state === r0.state && x.round === 'first')).sort((a, b) => a[0].report_timestamp_utc.localeCompare(b[0].report_timestamp_utc));
    const firstLatest = firstReports[firstReports.length - 1];
    if (!firstLatest) e.push('a ' + r0.round + ' report needs an earlier first-round report');
    else {
      const fw = officialWinner(firstLatest);
      const firstNames = new Set(firstLatest.filter((x) => x.ballot_party !== 'OTH').map((x) => norm(x.candidate)));
      if (names.some((n) => !firstNames.has(n))) e.push('every ' + r0.round + ' candidate must appear in the first round');
      const mt = majorityTest(r0.state, firstLatest);
      if (mt.result === 'yes') e.push('no ' + (r0.round === 'runoff' ? 'runoff' : 'further ranked-choice round') + ': ' + mt.candidate + ' won a first-round majority (' + mt.rule + ')');
      // 1.1.4: if Maine's legal denominator is missing (result 'unknown'), an official final round is accepted. Under
      // 21-A M.R.S. §723-A(2) the count proceeds to rounds only when no candidate has more than half of all ballots cast,
      // so the authority's tabulation is itself the official finding. A RECORDED majority still blocks it (escalate).
      if (r0.round === 'runoff') {
        if (CERT_TYPES.indexOf(firstLatest[0].reporting_status) < 0) e.push('a runoff needs a certified November count');
        const top2 = firstLatest.filter((x) => x.ballot_party !== 'OTH').sort((a, b) => Number(b.votes) - Number(a.votes));
        if (top2.length >= 3 && Number(top2[1].votes) === Number(top2[2].votes)) e.push('second place is tied in November; runoff pairing cannot be checked');
        const pair = new Set(top2.slice(0, 2).map((x) => norm(x.candidate)));
        if (rows.length !== 2 || names.some((n) => !pair.has(n))) e.push('a runoff must list exactly the top two November candidates (' + top2.slice(0, 2).map((x) => x.candidate).join(' and ') + ')');
      }
      if (r0.round === 'rcv_final' && safeIntRows(rows)) { const w = officialWinner(rows); if (!w.majority) e.push('a final ranked-choice round must give one candidate a majority of continuing ballots'); }
    }
  }
  if (!safeIntRows(rows)) e.push('votes and total_votes must be whole numbers within safe limits');
  else {
    if (new Set(rows.map((r) => r.total_votes)).size !== 1) e.push('rows of one report disagree on total_votes');
    const total = Number(r0.total_votes); const sum = rows.reduce((s, r) => s + Number(r.votes), 0);
    if (!(total > 0)) e.push('total_votes must be positive');
    if (sum !== total) e.push('candidate votes sum to ' + sum + ', not total_votes ' + total + ' (list every candidate and the write-in total)');
  }
  // 1.1.4: recorded legal majority contradicting an already recorded official final round -> stop and escalate
  if (r0.round === 'first' && race.ranked_choice === 'yes' && safeIntRows(rows) && existing.some((x) => x.state === r0.state && x.round === 'rcv_final')) {
    const mt0 = majorityTest(r0.state, rows);
    if (mt0.result === 'yes') e.push('the recorded ballots cast show a first-round majority for ' + mt0.candidate + ', but an official ranked-choice final round is already recorded; stop and escalate (' + mt0.rule + ')');
  }
  // lifecycle against earlier reports for the same state and round
  const prior = groupReports(existing.filter((x) => x.state === r0.state && x.round === r0.round)).map((g) => g[0]).sort((a, b) => a.report_timestamp_utc.localeCompare(b.report_timestamp_utc));
  if (prior.some((p) => reportKey(p) === reportKey(r0))) e.push('this report already exists; reports cannot be split or extended');
  const last = prior[prior.length - 1];
  if (last && !(r0.report_timestamp_utc > last.report_timestamp_utc)) e.push('report_timestamp_utc must be later than the previous report for this round');
  const seenCert = prior.some((p) => CERT_TYPES.indexOf(p.reporting_status) >= 0); const seenRecount = prior.some((p) => p.reporting_status === 'recount');
  if (st === 'unofficial' && (seenCert || seenRecount)) e.push('unofficial reports are not accepted after certification or a recount');
  if (st === 'certified' && (seenCert || seenRecount)) e.push('use amended_certified or recount_certified after the first certification');
  if (st === 'recount' && !last) e.push('a recount needs an earlier report');
  if (st === 'recount_certified' && !(last && last.reporting_status === 'recount')) e.push('recount_certified must follow a recount report');
  if (st === 'amended_certified' && !(seenCert && last && last.reporting_status !== 'recount')) e.push('amended_certified must follow a certified report and cannot interrupt a recount');
  return e;
}

function validateUntrackedRow(r, D, existing) {
  const e = [];
  const race = D.untrackedRaces.find((x) => x.state === r.state);
  if (!race) { e.push('state ' + r.state + ' is not one of the 20 untracked 2026 races'); return e; }
  if (r.round !== 'final') e.push('round must be final');
  if (!r.candidate_winner) e.push('candidate_winner required');
  if (['D', 'R', 'I', 'L', 'G', 'OTH'].indexOf(r.winner_party) < 0) e.push('winner_party must be D, R, I, L, G or OTH');
  const st = r.reporting_status; const cert = CERT_TYPES.indexOf(st) >= 0;
  if (!cert && st !== 'recount') e.push('untracked contests accept only certified, recount, recount_certified or amended_certified');
  if (cert && !DATE.test(r.certification_date)) e.push(st + ' needs certification_date');
  if (!cert && r.certification_date) e.push('only certified statuses carry a certification_date');
  if (!ISO.test(r.report_timestamp_utc) || !ISO.test(r.retrieved_at_utc)) e.push('timestamps must be ISO UTC');
  if (!r.authority_name || !r.entered_by) e.push('authority_name and entered_by required');
  if (!sourceAllowed(r.state, r.source_url, D)) e.push('source_url is not on a confirmed or verified official host for ' + r.state);
  const prior = existing.filter((x) => x.state === r.state).sort((a, b) => a.report_timestamp_utc.localeCompare(b.report_timestamp_utc));
  const last = prior[prior.length - 1]; const seenCert = prior.some((p) => CERT_TYPES.indexOf(p.reporting_status) >= 0);
  if (last && !(r.report_timestamp_utc > last.report_timestamp_utc)) e.push('timestamp must be later than the previous record for this contest');
  if (st === 'certified' && prior.length) e.push('a second certified result must be amended_certified or recount_certified');
  if (st === 'recount' && !seenCert) e.push('a recount record needs an earlier certified result');
  if (st === 'recount_certified' && !(last && last.reporting_status === 'recount')) e.push('recount_certified must follow a recount record');
  if (st === 'amended_certified' && !(seenCert && last && last.reporting_status !== 'recount')) e.push('amended_certified must follow a certified result');
  return e;
}

function validateDomainRow(r, D) {
  const e = []; const src = D.sources.find((s) => s.state === r.state);
  if (!src) { e.push('unknown state ' + r.state); return e; }
  const host = norm(r.host); const auth = src.authority_domains.split(';').filter(Boolean);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) e.push('host must be a bare hostname');
  if (within(host, auth)) e.push('host is already an authority domain; no verification needed');
  if (!hostAllowed(r.authority_page_url, auth)) e.push('authority_page_url must be an https page on the authority’s confirmed domain');
  if (!ISO.test(r.verified_at_utc)) e.push('verified_at_utc must be ISO UTC');
  if (!r.verified_by || !r.evidence_note) e.push('verified_by and evidence_note required');
  if (D.domains.some((v) => v.state === r.state && norm(v.host) === host)) e.push('host already verified');
  return e;
}

function appendTo(logKey, newRows, dataDir, validateFn, opts) {
  const D = loadData(dataDir); const log = LOGS[logKey];
  let prev = D[logKey + 'Head']; let n = D[logKey].length;
  const accepted = [];
  const batches = logKey === 'returns' ? groupReports(newRows.map((r) => Object.assign({ office: 'U.S. Senate' }, r))) : newRows.map((r) => [r]);
  batches.forEach((g) => {
    const rows = g.map((r0) => { const r = {}; log.fields.forEach((k) => { r[k] = r0[k] == null ? '' : String(r0[k]); }); return r; });
    const errs = validateFn(rows, D);
    if (errs.length) throw new Error('rejected (' + (rows[0].state || '?') + '): ' + errs.join('; '));
    rows.forEach((r) => { n += 1; r.record_id = log.prefix + String(n).padStart(5, '0'); r.prev_hash = prev; r.row_hash = rowHashFor(log, r); prev = r.row_hash; accepted.push(r); });
    D[logKey].push(...rows);
  });
  if (!(opts && opts.dryRun) && accepted.length) fs.appendFileSync(path.join(D.dir, log.file), accepted.map((r) => log.fields.map((k) => csvCell(r[k])).join(',')).join('\n') + '\n');
  return accepted;
}
const appendReturns = (rows, dataDir, opts) => appendTo('returns', rows, dataDir, (g, D) => validateReport(g, D, D.returns), opts);
const appendUntracked = (rows, dataDir, opts) => appendTo('untracked', rows, dataDir, (g, D) => validateUntrackedRow(g[0], D, D.untracked), opts);
const appendDomainVerification = (rows, dataDir, opts) => appendTo('domains', rows, dataDir, (g, D) => validateDomainRow(g[0], D), opts);

// ---------- official winner from ALL candidates in a report (separate from the two-candidate polling margin) ----------
function safeIntRows(rows) { return rows.every((r) => safeInt(r.votes) && safeInt(r.total_votes)); }
function officialWinner(rows) {
  const total = Number(rows[0].total_votes);
  const ind = rows.filter((r) => r.ballot_party !== 'OTH').map((r) => ({ candidate: r.candidate, ballot_party: r.ballot_party, votes: Number(r.votes) })).sort((a, b) => b.votes - a.votes);
  const aggVotes = rows.filter((r) => r.ballot_party === 'OTH').reduce((s, r) => s + Number(r.votes), 0);
  const top = ind[0]; const second = ind[1];
  if (!top || !total) return { status: 'undetermined', majority: false, basis: 'cannot determine: no individual candidates' };
  const share = Math.round((top.votes * 1e6) / total) / 1e4;
  if (top.votes * 2 > total) return { status: 'winner', majority: true, candidate: top.candidate, ballot_party: top.ballot_party, seat: seatOf(top.ballot_party), share };
  if (second && second.votes === top.votes) return { status: 'tie', majority: false, basis: 'tie for first place' };
  if (aggVotes >= top.votes) return { status: 'undetermined', majority: false, basis: 'cannot determine: the aggregated other candidates could include the leader' };
  return { status: 'winner', majority: false, candidate: top.candidate, ballot_party: top.ballot_party, seat: seatOf(top.ballot_party), share };
}
// Legal first-round majority test. The denominator differs by state and is NOT the polling-error denominator.
function majorityTest(state, rows) {
  const total = Number(rows[0].total_votes);
  const top = rows.filter((r) => r.ballot_party !== 'OTH').map((r) => ({ candidate: r.candidate, votes: Number(r.votes) })).sort((a, b) => b.votes - a.votes)[0];
  const share = (den) => Math.round((top.votes * 1e6) / den) / 1e4;
  if (state === 'ME') {
    const rule = 'Maine: more than 50% of all ballots cast for the office, including blank and overvoted first rankings (21-A M.R.S. §723-A(2))';
    const cast = rows[0].ballots_cast_for_office ? Number(rows[0].ballots_cast_for_office) : null;
    if (cast) return { rule, candidate: top.candidate, votes: top.votes, denominator: cast, share: share(cast), result: top.votes * 2 > cast ? 'yes' : 'no' };
    if (top.votes * 2 <= total) return { rule, candidate: top.candidate, votes: top.votes, denominator: null, share: null, result: 'no', note: 'no candidate has more than half even of the candidate votes' };
    return { rule, candidate: top.candidate, votes: top.votes, denominator: null, share: null, result: 'unknown', note: 'ballots cast for the office (with blank and overvoted first rankings) not recorded' };
  }
  if (state === 'AK') return { rule: 'Alaska: more than half of the active ballots in the initial tabulation (AS 15.15.350(d)); inactive ballots (blank, overvote, double skip) excluded', candidate: top.candidate, votes: top.votes, denominator: total, share: share(total), result: top.votes * 2 > total ? 'yes' : 'no' };
  if (state === 'GA') return { rule: 'Georgia: majority of the votes cast for the office (candidate votes, write-ins included)', candidate: top.candidate, votes: top.votes, denominator: total, share: share(total), result: top.votes * 2 > total ? 'yes' : 'no' };
  return { rule: 'plurality (no majority required)', candidate: top.candidate, votes: top.votes, denominator: total, share: share(total), result: top.votes * 2 > total ? 'yes' : 'no' };
}
function roundSummary(rep) {
  if (!rep) return null;
  const total = rep.total;
  return { total, candidates: rep.rows.map((r) => ({ candidate: r.candidate, ballot_party: r.ballot_party, votes: Number(r.votes), pct: Math.round((Number(r.votes) * 1e6) / total) / 1e4 })).sort((a, b) => b.votes - a.votes) };
}

// ---------- current state of each round ----------
function reportsFor(D, state, round) {
  return groupReports(D.returns.filter((r) => r.state === state && r.round === round)).map((rows) => ({ rows, status: rows[0].reporting_status, timestamp: rows[0].report_timestamp_utc, certification_date: rows[0].certification_date, reported_pct: rows[0].reported_pct === '' ? null : Number(rows[0].reported_pct), reporting_unit: rows[0].reporting_unit, authority_status_text: rows[0].authority_status_text, total: Number(rows[0].total_votes), source_url: rows[0].source_url, authority: rows[0].authority_name }));
}
function currentReport(D, state, round) { const rs = reportsFor(D, state, round).sort((a, b) => a.timestamp.localeCompare(b.timestamp)); return rs.length ? rs[rs.length - 1] : null; }
const isCert = (rep) => !!rep && CERT_TYPES.indexOf(rep.status) >= 0;
function shares(report, race) {
  if (!report) return null;
  const pick = (name) => report.rows.filter((r) => norm(r.candidate) === norm(name)).reduce((s, r) => s + Number(r.votes), 0);
  const ch = pick(race.challenger), rep = pick(race.republican), total = report.total;
  if (!total) return null;
  return { challenger_votes: ch, republican_votes: rep, total, challenger_pct: Math.round((ch * 1e6) / total) / 1e4, republican_pct: Math.round((rep * 1e6) / total) / 1e4, margin: Math.round(((ch - rep) * 10000) / total) / 100, majority: (ch * 2 > total) || (rep * 2 > total) };
}

function frozenPredictions() {
  const snap = parseCSV(fs.readFileSync(deps.vendorPath('v19_frozen/data/snapshot_2026-11-02.csv'), 'utf8'));
  const site = JSON.parse(fs.readFileSync(deps.vendorPath('docs/data/site_v20.json'), 'utf8'));
  const v19 = {}; snap.filter((r) => r.kind === 'senate_state' && r.norm === 'raw' && r.method === 'simple').forEach((r) => { v19[r.state] = r.margin === '' ? null : Number(r.margin); });
  const s = snap.find((r) => r.kind === 'senate_seats' && r.norm === 'raw' && r.method === 'simple');
  const v20 = {}; site.races.forEach((r) => { v20[r.state] = r.simple; });
  return { v19, v20, seats19: { dem: Number(s.dem_seats), rep: Number(s.rep_seats), ind: Number(s.ind_seats), label: 'caucus-equivalent: the frozen v19 model counts the sitting independents who caucus with Democrats (King, Sanders) as Democratic seats; Osborn counts as independent only if he wins' } };
}

function compare(D) {
  const P = frozenPredictions();
  const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
  return D.races.map((race) => {
    const first = currentReport(D, race.state, 'first');
    const fin = race.ranked_choice === 'yes' ? currentReport(D, race.state, 'rcv_final') : null;
    const run = race.state === 'GA' ? currentReport(D, race.state, 'runoff') : null;
    const s1 = shares(first, race);
    // Recount scope follows the ballots: in ranked-choice races every round is a tabulation of the same ballots,
    // so a recount in any round suspends the whole race; Georgia's runoff is a separate election, so a runoff
    // recount suspends only the winner and leaves the certified November score in place.
    const rcvRecount = race.ranked_choice === 'yes' && ((first && first.status === 'recount') || (fin && fin.status === 'recount'));
    let comparable = 'none';
    if (first) {
      if (first.status === 'recount' || rcvRecount) comparable = 'recount';
      else if (isCert(first)) comparable = 'certified';
      else comparable = first.reported_pct === 100 && (first.reporting_unit === 'ballots' || first.reporting_unit === 'precincts') ? 'provisional' : 'partial';
    }
    const canCompare = comparable === 'certified' || comparable === 'provisional';
    const err = (p) => (canCompare && p != null && s1 ? r2(p - s1.margin) : null);
    let winner = null, basis = '', wc = null, wp = null;
    const take = (w, why) => { if (w.status === 'winner') { winner = w.seat; wc = w.candidate; wp = w.ballot_party; basis = why; } else basis = (w.status === 'tie' ? 'certified tie for first place: resolution pending' : w.basis); };
    if (comparable === 'recount') basis = rcvRecount && !(first && first.status === 'recount') ? 'ranked-choice recount in progress (all rounds use the same ballots)' : 'recount in progress';
    else if (isCert(first) && s1) {
      const w1 = officialWinner(first.rows);
      if (race.state === 'GA') {
        if (w1.majority) take(w1, 'certified November majority; no runoff');
        else if (run && run.status === 'recount') basis = 'runoff recount in progress';
        else if (isCert(run)) take(officialWinner(run.rows), 'certified runoff');
        else basis = 'runoff pending';
      } else if (race.ranked_choice === 'yes') {
        const mt = majorityTest(race.state, first.rows);
        if (mt.result === 'yes' && fin) basis = 'DISCREPANCY: the recorded first-round count shows a majority but an official ranked-choice final round exists; stop and escalate';
        else if (mt.result === 'yes') take(w1, 'certified first-round majority');
        else if (mt.result === 'unknown' && isCert(fin)) take(officialWinner(fin.rows), 'certified final ranked-choice round; the official count proceeded to rounds, which under 21-A M.R.S. §723-A(2) means no candidate had more than half of all ballots cast (Maine legal denominator not recorded: verify Round 0 counts)');
        else if (mt.result === 'unknown') basis = 'cannot verify the first-round majority: Maine legal denominator (' + mt.note + '); human review needed';
        else if (isCert(fin)) take(officialWinner(fin.rows), 'certified final ranked-choice round');
        else basis = 'ranked-choice tabulation pending';
      } else take(w1, w1.majority ? 'certified majority' : 'certified plurality');
    }
    return {
      state: race.state, name: race.name, challenger: race.challenger, challenger_party: race.challenger_party, republican: race.republican, incumbent_party: race.incumbent_party, ranked_choice: race.ranked_choice,
      v19: P.v19[race.state], v20: P.v20[race.state],
      status: first ? first.status : 'no_results', comparable, report_timestamp_utc: first ? first.timestamp : null, reported_pct: first ? first.reported_pct : null, reporting_unit: first ? first.reporting_unit : null, authority_status_text: first ? first.authority_status_text : null, certification_date: first ? first.certification_date : null, source_url: first ? first.source_url : null,
      first_round: s1, first_round_candidates: roundSummary(first), final_round: roundSummary(fin), final_round_status: fin ? fin.status : null, runoff: roundSummary(run), runoff_status: run ? run.status : null,
      majority_test: first ? majorityTest(race.state, first.rows) : null,
      error_v19: err(P.v19[race.state]), error_v20: err(P.v20[race.state]), winner, winner_candidate: wc, winner_ballot_party: wp, winner_basis: basis,
    };
  });
}

function scorecard(rows, key, kind) {
  const use = rows.filter((r) => r.comparable === kind && r[key] != null);
  const mean = (a) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 100) / 100 : null);
  const pred = key === 'error_v19' ? 'v19' : 'v20';
  return { estimate: pred, basis: kind, races: use.length, mean_signed_error: mean(use.map((r) => r[key])), mean_abs_error: mean(use.map((r) => Math.abs(r[key]))), leader_right: use.filter((r) => r[pred] != null && r.first_round && Math.sign(r[pred]) === Math.sign(r.first_round.margin)).length };
}

// ---------- seats: party affiliation and caucus alignment kept apart ----------
function baseSeats(D) {
  const states = readCSV(deps.vendorPath('v20/data/states.csv'));
  const totals = readCSV(deps.vendorPath('v20/data/senate_totals.csv'));
  const cur = totals.find((x) => x.key === 'current'); const up = totals.find((x) => x.key === 'up_2026');
  const notUp = { D: Number(cur.dem) - Number(up.dem), I: Number(cur.ind) - Number(up.ind || 0), R: Number(cur.rep) - Number(up.rep) };
  const caucusRows = (D ? D.caucus : readCSV(path.join(DATA, 'caucus_alignment.csv'))).filter((c) => /not up in 2026/.test(c.status));
  if (caucusRows.length !== notUp.I) throw new Error('caucus_alignment.csv lists ' + caucusRows.length + ' sitting independents not up; the Senate composition says ' + notUp.I);
  const iD = caucusRows.filter((c) => c.caucus === 'D').length; const iR = caucusRows.filter((c) => c.caucus === 'R').length;
  const untracked = states.filter((s) => s.race === 'yes' && s.forecaster_rating !== 'Competitive');
  const u = { D: untracked.filter((s) => s.incumbent_party === 'D').length, R: untracked.filter((s) => s.incumbent_party === 'R').length, I: untracked.filter((s) => s.incumbent_party === 'I').length };
  return { notUp: { party: notUp, caucus: { D: notUp.D + iD, R: notUp.R + iR, unaligned: notUp.I - iD - iR } }, untrackedAssumed: u, untracked: untracked.length,
    party: { D: notUp.D + u.D, R: notUp.R + u.R, I: notUp.I + u.I }, caucus: { D: notUp.D + iD + u.D, R: notUp.R + iR + u.R, unaligned: notUp.I - iD - iR } };
}
function untrackedStatus(D) {
  return D.untrackedRaces.map((race) => {
    const rows = D.untracked.filter((x) => x.state === race.state).sort((a, b) => a.report_timestamp_utc.localeCompare(b.report_timestamp_utc));
    const last = rows[rows.length - 1];
    if (last && CERT_TYPES.indexOf(last.reporting_status) >= 0) return { state: race.state, name: race.name, holder: race.incumbent_party, status: 'confirmed', party: last.winner_party, winner: last.candidate_winner, source_url: last.source_url, certification_date: last.certification_date };
    return { state: race.state, name: race.name, holder: race.incumbent_party, status: last && last.reporting_status === 'recount' ? 'recount' : 'assumed', party: race.incumbent_party, winner: null, source_url: last ? last.source_url : null };
  });
}
function caucusOf(seat, state, D, candidate) { if (seat === 'D' || seat === 'R') return seat; const c = D.caucus.find((x) => x.state === state && norm(x.senator_or_candidate) === norm(candidate) && !/not up in 2026/.test(x.status)); return c && (c.caucus === 'D' || c.caucus === 'R') ? c.caucus : 'unaligned'; }
function seatTally(rows, D, P) {
  const b = baseSeats(D);
  const party = Object.assign({ D: 0, R: 0, I: 0 }, b.notUp.party); const caucus = Object.assign({ D: 0, R: 0, unaligned: 0 }, b.notUp.caucus);
  const add = (p, c) => { const pk = p === 'D' || p === 'R' ? p : 'I'; party[pk] += 1; caucus[c] += 1; };
  const un = untrackedStatus(D);
  un.forEach((u) => add(u.party, caucusOf(seatOf(u.party), u.state, D, u.winner)));
  const decided = rows.filter((r) => r.winner);
  decided.forEach((r) => add(r.winner, caucusOf(r.winner, r.state, D, r.winner_candidate)));
  const confirmedUntracked = un.filter((u) => u.status === 'confirmed').length;
  const undecided = rows.length - decided.length;
  const computed = undecided === 0 && confirmedUntracked === un.length;
  let result = null;
  if (computed) result = caucus.D >= 51 ? 'Democratic caucus majority' : caucus.R >= 50 ? 'Republican majority (with the vice president’s tie-break)' : 'No majority without unaligned independents';
  return { party, caucus, not_up: b.notUp, tracked_decided: decided.length, tracked_undecided: undecided, untracked_confirmed: confirmedUntracked, untracked_assumed: un.length - confirmedUntracked, untracked: un,
    control: { computed, result, reason: computed ? 'all 15 tracked and 20 untracked contests confirmed' : 'not computed: ' + undecided + ' tracked race(s) undecided and ' + (un.length - confirmedUntracked) + ' untracked contest(s) only assumed' },
    complete: computed, frozen_v19: (P || frozenPredictions()).seats19 };
}

// ---------- registered tests: gate and a one-time record ----------
function gate(D, rows, now) {
  const certified = rows.filter((r) => r.comparable === 'certified').length;
  const all = certified === rows.length;
  const fallback = (now || new Date().toISOString()).slice(0, 10) >= '2027-01-15';
  return { certified, total: rows.length, ready: all || fallback, reason: all ? 'all races certified' : fallback ? 'fallback date reached; scoring with certified races only' : 'awaiting certification (' + certified + ' of ' + rows.length + ')' };
}
function registeredTests(D, rows, opts) {
  const o = opts || {};
  const dep = deps.ensureDependencies();
  const g = gate(D, rows, o.now);
  if (!g.ready) return { gate: g, tests: null, exploratory: null };
  const results = rows.filter((r) => r.comparable === 'certified' && r.first_round).map((r) => { const s = r.first_round; return r.challenger_party === 'I' ? { state: r.state, dem_pct: '0', rep_pct: String(s.republican_pct), ind_pct: String(s.challenger_pct) } : { state: r.state, dem_pct: String(s.challenger_pct), rep_pct: String(s.republican_pct), ind_pct: '' }; });
  const { score } = require(deps.vendorPath('v20/score_v20.js'));
  const v20 = score(results, o.scoreOpts || {});
  let exploratory = null;
  try { const { score: s201 } = require(deps.vendorPath('v20_1/score_v201.js')); exploratory = s201(results, o.scoreOpts || {}).exploratory; } catch (err) { exploratory = { unavailable: String(err.message || err) }; }
  return { gate: g, tests: v20.tests, accuracy: v20.accuracy, calibration: v20.calibration, exploratory, results_used: results.length, dependency_manifest_sha256: dep.manifest_sha256 };
}
function currentInputs(D) { return { returns_chain_head: D.returnsHead, returns_rows: D.returns.length, untracked_chain_head: D.untrackedHead, domain_chain_head: D.domainsHead, conventions_sha256: D.conventionsHash, static_manifest_sha256: D.staticHash, dependency_manifest_sha256: D.deps.manifest_sha256, prereg_sha256: deps.PINNED.anchors['v20/preregistration_mike.json'], v19_snapshot_sha256: deps.PINNED.anchors['v19_frozen/data/snapshot_2026-11-02.csv'] }; }
function recordRegisteredScoring(dataDir, opts) {
  const o = opts || {};
  const D = loadData(dataDir); const rows = compare(D);
  const file = path.join(D.dir, 'registered_scoring_record.json');
  if (fs.existsSync(file)) throw new Error('a registered scoring record already exists and is never overwritten; publish any later analysis as a labeled revision');
  const res = registeredTests(D, rows, o);
  if (!res.tests) throw new Error('not ready to score: ' + res.gate.reason);
  const record = { schema: 'polling-lab-2026-registered-scoring-1', recorded_at_utc: o.now || new Date().toISOString(), gate: res.gate, replicates: (o.scoreOpts && o.scoreOpts.reps) || 'registered (10000)', registered_replicates: !(o.scoreOpts && o.scoreOpts.reps), simulation_setting: process.env.V20_SIMS ? 'V20_SIMS=' + process.env.V20_SIMS : 'published default', inputs: currentInputs(D), tests: res.tests, accuracy: res.accuracy, exploratory: res.exploratory, results_used: res.results_used };
  record.record_sha256 = sha(JSON.stringify(record));
  fs.writeFileSync(file, JSON.stringify(record, null, 1), { flag: 'wx' });
  return record;
}
function inputsChangedSinceRecord(D) { if (!D.record) return null; const now = currentInputs(D); return ['returns_chain_head', 'untracked_chain_head', 'conventions_sha256', 'dependency_manifest_sha256'].some((k) => now[k] !== D.record.inputs[k]); }

module.exports = { DEN_FIELDS, majorityTest, BALLOT_PARTIES, officialWinner, roundSummary, TRACKER, REPO, DATA, CONVENTIONS_HASH, STATIC_FILES, CERT_TYPES, LOGS, RETURN_FIELDS, GENESIS, deps, verifyDependencies: deps.verifyDependencies,
  parseCSV, readCSV, loadData, verifyChain, verifyChainFor, rowHash, validateReport, validateUntrackedRow, validateDomainRow, hostAllowed, sourceAllowed,
  appendReturns, appendUntracked, appendDomainVerification, reportsFor, currentReport, shares, frozenPredictions, compare, scorecard, baseSeats, untrackedStatus, seatTally, gate, registeredTests, recordRegisteredScoring, inputsChangedSinceRecord, currentInputs };
