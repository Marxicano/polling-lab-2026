/* Polling Lab engine (v3) — every calculation the dashboard shows.
   Each dash.calc(id, {inputs, fn}) is a pure function of the named datasets (CSV rows, values as text)
   or of other calcs. The same file runs in Node via run_engine.js for auditing. */
  // Default is the data's last reviewed day, not today's clock. `freeze_snapshot.js`
  // sets POLLING_LAB_AS_OF to the actual freeze date before loading the engine.
  // This keeps historical calculations reproducible while allowing the final
  // Nov 2 snapshot to use Nov 2 recency weights.
  const pollingAsOf = (typeof process !== 'undefined' && process.env && process.env.POLLING_LAB_AS_OF)
    || (typeof globalThis !== 'undefined' && globalThis.POLLING_LAB_AS_OF)
    || '2026-11-01';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pollingAsOf)) throw Error('Invalid POLLING_LAB_AS_OF date');
  const pollAsOfMs = Date.parse(pollingAsOf + 'T00:00:00Z');
  if (!Number.isFinite(pollAsOfMs)) throw Error('Invalid POLLING_LAB_AS_OF');

  dash.calc('gb_latest', {
    inputs: ['gb_snapshots'],
    title: 'Latest published averages',
    description: 'Newest published margin for each average, Democrats minus Republicans; computed from vote shares where only shares were published.',
    fn: (gb_snapshots) => {
      const latest = {};
      gb_snapshots.forEach((r) => {
        if (!latest[r.series] || String(r.as_of) > String(latest[r.series].as_of)) latest[r.series] = r;
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Object.keys(latest).map((k) => {
        const r = latest[k];
        const pub = r.margin_published === '' || r.margin_published == null ? NaN : Number(r.margin_published);
        const raw = Number.isFinite(pub) ? pub : Number(r.dem) - Number(r.rep);
        const margin = Math.round(raw * 10) / 10;
        const d = String(r.as_of);
        return {
          series: k,
          aggregator: r.aggregator,
          measure: r.measure,
          as_of: d,
          as_of_label: months[Number(d.slice(5, 7)) - 1] + ' ' + Number(d.slice(8, 10)),
          margin: margin,
          margin_abs: Math.abs(margin),
          leader: margin > 0 ? 'D' : margin < 0 ? 'R' : 'Even',
          label: (margin > 0 ? 'D+' : margin < 0 ? 'R+' : 'Even ') + Math.abs(margin).toFixed(1),
        };
      });
    },
  });

  dash.calc('gb_range', {
    inputs: ['gb_latest'],
    title: 'Range of published averages',
    description: 'Lowest and highest of the newest published margins, and the gap between them.',
    fn: (gb_latest) => {
      const s = gb_latest.slice().sort((a, b) => a.margin - b.margin);
      if (!s.length) return [];
      const lo = s[0];
      const hi = s[s.length - 1];
      return [{ low: lo.margin, high: hi.margin, low_label: lo.label, high_label: hi.label, gap: Math.round((hi.margin - lo.margin) * 10) / 10, n: s.length }];
    },
  });

  dash.calc('gb_trend', {
    inputs: ['gb_snapshots'],
    title: "Silver Bulletin's average over time",
    description: "Silver Bulletin's default average at each published snapshot.",
    fn: (gb_snapshots) => gb_snapshots
      .filter((r) => r.series === 'silver_default')
      .map((r) => ({ date: String(r.as_of), margin: Number(r.margin_published) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
  });

  dash.calc('error_rows', {
    inputs: ['track_record'],
    title: 'Signed polling error by cycle',
    description: 'Positive: final polls overstated Democrats. Negative: they overstated Republicans.',
    fn: (track_record) => track_record.map((r) => {
      const e = Number(r.signed_error);
      return {
        key: r.key,
        source: r.source,
        cycle: Number(r.cycle),
        cycle_type: r.cycle_type,
        scope: r.scope,
        error: e,
        error_abs: Math.abs(e),
        toward: e > 0 ? 'Democrats' : e < 0 ? 'Republicans' : 'neither party',
      };
    }),
  });

  dash.calc('error_summary', {
    inputs: ['track_record'],
    title: 'Average signed error by cycle type',
    description: 'Mean signed error for each source and cycle type, rounded to a tenth; positive means polls overstated Democrats.',
    fn: (track_record) => {
      const g = {};
      track_record.forEach((r) => {
        const k = (String(r.source).indexOf('AAPOR') === 0 ? 'aapor' : 'silver') + '_' + String(r.cycle_type).toLowerCase();
        if (!g[k]) g[k] = { source: r.source, cycle_type: r.cycle_type, sum: 0, n: 0 };
        g[k].sum += Number(r.signed_error);
        g[k].n += 1;
      });
      return Object.keys(g).map((k) => {
        const x = g[k];
        const mean = Math.round((x.sum / x.n) * 10) / 10;
        return {
          group: k,
          source: x.source,
          cycle_type: x.cycle_type,
          cycles: x.n,
          mean: mean,
          mean_abs: Math.abs(mean),
          toward: mean > 0 ? 'Democrats' : mean < 0 ? 'Republicans' : 'neither party',
        };
      });
    },
  });

  dash.calc('offyear_rows', {
    inputs: ['offyear'],
    title: 'Off-year polling misses',
    description: 'Final polling average minus result, Democratic margin in points. Positive: polls overstated Democrats.',
    fn: (offyear) => offyear.map((r) => {
      const poll = Number(r.poll_avg_margin);
      const res = Number(r.result_margin);
      const err = Math.round((poll - res) * 10) / 10;
      return {
        key: r.key,
        race: r.race,
        year: Number(r.year),
        poll: poll,
        result: res,
        error: err,
        error_abs: Math.abs(err),
        toward: err > 0 ? 'Democrats' : err < 0 ? 'Republicans' : 'neither party',
      };
    }),
  });

  dash.calc('offyear_summary', {
    inputs: ['offyear_rows'],
    title: 'Largest 2025 off-year miss',
    description: 'The 2025 governor race whose final polling average missed the result by the most.',
    fn: (offyear_rows) => {
      const rows = offyear_rows.filter((r) => r.year === 2025).sort((a, b) => b.error_abs - a.error_abs);
      const t = rows[0];
      return t ? [{ race: t.race, year: t.year, largest_abs: t.error_abs, toward: t.toward }] : [];
    },
  });

  dash.calc('va07_rows', {
    inputs: ['va07'],
    title: 'Virginia 7th, 2018: turnout scenarios and result',
    description: 'Margin under each NYT turnout scenario (positive: Spanberger ahead), plus the actual two-party margin and vote total.',
    fn: (va07) => va07.map((r) => {
      let margin;
      let turnout;
      if (r.kind === 'Result') {
        const d = Number(r.dem_votes);
        const rep = Number(r.rep_votes);
        turnout = d + rep;
        margin = Math.round(((d - rep) / (d + rep)) * 1000) / 10;
      } else {
        turnout = Number(r.est_turnout);
        margin = Number(r.margin);
      }
      return {
        key: r.key,
        short_label: r.short_label,
        label: r.label,
        kind: r.kind,
        turnout: turnout,
        margin: margin,
        margin_abs: Math.abs(margin),
        leader: margin > 0 ? 'Spanberger' : margin < 0 ? 'Brat' : 'Even',
      };
    }),
  });

  dash.calc('seat_math', {
    inputs: ['states', 'senate_totals'],
    title: 'Senate seat math',
    description: 'Seats not up plus seats rated safe, by party, and how many competitive races each side needs. Democrats need 51 seats; Republicans keep control at 50 because the vice president breaks ties.',
    fn: (states, senate_totals) => {
      const cur = senate_totals.find((r) => r.key === 'current');
      if (!cur) return [];
      const races = states.filter((r) => r.race === 'yes');
      const n = (f) => races.filter(f).length;
      const upD = n((r) => r.incumbent_party === 'D');
      const upR = n((r) => r.incumbent_party === 'R');
      const safeD = n((r) => r.incumbent_party === 'D' && r.forecaster_rating === 'Rated safe');
      const safeR = n((r) => r.incumbent_party === 'R' && r.forecaster_rating === 'Rated safe');
      const comp = n((r) => r.forecaster_rating === 'Competitive');
      const compWithDem = n((r) => r.forecaster_rating === 'Competitive' && String(r.dem_candidate || '').trim() !== '');
      const baseD = Number(cur.dem) - upD + Number(cur.ind) + safeD;
      const baseR = Number(cur.rep) - upR + safeR;
      return [{
        races: races.length,
        up_d: upD,
        up_r: upR,
        safe_d: safeD,
        safe_r: safeR,
        competitive: comp,
        comp_with_dem: compWithDem,
        base_d: baseD,
        base_r: baseR,
        d_needs: 51 - baseD,
        r_needs: 50 - baseR,
      }];
    },
  });

  dash.calc('reference_map', {
    inputs: ['senate_totals', 'seat_math'],
    title: "Mike from PA's map in competitive-race terms",
    description: 'Democratic seats in the shared stream map, minus the seats Democrats hold without a competitive race.',
    fn: (senate_totals, seat_math) => {
      const m = senate_totals.find((r) => r.key === 'mike_map');
      const s = seat_math[0];
      if (!m || !s) return [];
      return [{ dem_seats: Number(m.dem), implied_wins: Number(m.dem) - s.base_d, of_races: s.comp_with_dem }];
    },
  });

  dash.calc('state_miss_rows', {
    inputs: ['state_misses'],
    title: 'Past misses in 2026 battleground states',
    description: 'Final polling average minus result, Democratic margin in points; positive means polls overstated Democrats.',
    fn: (state_misses) => state_misses.map((r) => {
      const p = Number(r.poll_avg_margin);
      const res = Number(r.result_margin);
      const e = Math.round((p - res) * 10) / 10;
      const lab = (x) => (x > 0 ? 'D+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1);
      return { key: r.key, race: r.race, year: r.year, poll: p, result: res, error: e, poll_label: lab(p), result_label: lab(res), error_label: (e > 0 ? 'Democrats by ' : e < 0 ? 'Republicans by ' : 'Neither, ') + Math.abs(e).toFixed(1) };
    }),
  });

  /* ===== Senate (v3): included polls only, raw margin by default, optional two-party ===== */
  dash.calc('sen_polls_clean', {
    inputs: ['senate_polls'],
    title: 'Senate polls, cleaned',
    description: 'Included polls only (excluded rows stay in the file with a reason). Raw margin = challenger minus Republican, in points. Two-party margin = raw margin divided by (challenger + Republican) times 100. Age in days as of the explicit model date (defaults to Nov 1, 2026). Uses verified or provisionally sourced field-end date where known; otherwise retains the original legacy date (field-end/release status often unknown). sampling_sd and margin_moe (95%) are the sampling error of the candidate gap, 100*sqrt((p1+p2-(p1-p2)^2)/n) using the effective sample where published, else the reported sample (600 if missing); they exclude nonresponse, weighting and turnout-model error.',
    fn: (senate_polls) => {
      const asOf = pollAsOfMs;
      return senate_polls.filter((r) => r.include === 'yes' && r.date).map((r) => {
        const d = Number(r.dem);
        const rep = Number(r.rep);
        const nEff = Number(r.effective_n) || Number(r.sample_size) || 600;
        const p1 = d / 100;
        const p2 = rep / 100;
        const sdm = 100 * Math.sqrt(Math.max(0, p1 + p2 - (p1 - p2) * (p1 - p2)) / nEff);
        const legacyDate = String(r.date);
        const s = String(r.field_end || legacyDate);
        const t = Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
        return {
          poll_id: r.poll_id, state: r.state, pollster: r.pollster, date: s,
          legacy_date: legacyDate, field_end: r.field_end || '', release_date: r.release_date || '',
          recency_date_quality: r.recency_date_quality || 'legacy date ambiguous',
          age: Math.max(0, Math.round((asOf - t) / 864e5)),
          sample_size: r.sample_size === '' || r.sample_size == null ? null : Number(r.sample_size),
          effective_n: r.effective_n === '' || r.effective_n == null ? null : Number(r.effective_n),
          partisan_flag: r.partisan_flag || '',
          population: r.population || '', question: r.question, opp_party: r.opp_party || 'D',
          raw: Math.round((d - rep) * 10) / 10,
          two_party: Math.round(((d - rep) / (d + rep)) * 1000) / 10,
          n_eff: nEff,
          sampling_sd: Math.round(sdm * 100) / 100,
          margin_moe: Math.round(1.96 * sdm * 10) / 10,
        };
      });
    },
  });

  dash.calc('sen_house', {
    inputs: ['sen_polls_clean'],
    title: 'Pollster house effects (Senate)',
    description: "For each margin type: each pollster's average gap from other pollsters in the same state within 21 days, polls since Aug 1, 2026, pulled toward zero by n/(n+2); pollsters with at least 2 such polls. Positive: friendlier to the Democrat or independent challenger than the field. Relative to the field, not to the truth.",
    fn: (sen_polls_clean) => {
      const recent = sen_polls_clean.filter((p) => p.date >= '2026-08-01');
      const out = [];
      ['raw', 'two_party'].forEach((norm) => {
        const byP = {};
        recent.forEach((p) => {
          const others = recent.filter((q) => q.state === p.state && q.pollster !== p.pollster && Math.abs(q.age - p.age) <= 21);
          if (!others.length) return;
          const cons = others.reduce((s, q) => s + q[norm], 0) / others.length;
          if (!byP[p.pollster]) byP[p.pollster] = { n: 0, sum: 0, states: {} };
          byP[p.pollster].n += 1;
          byP[p.pollster].sum += p[norm] - cons;
          byP[p.pollster].states[p.state] = 1;
        });
        Object.keys(byP).forEach((k) => {
          const b = byP[k];
          if (b.n < 2) return;
          const raw = b.sum / b.n;
          const lean = Math.round((raw * b.n / (b.n + 2)) * 10) / 10;
          out.push({ key: norm + ' ' + k, norm: norm, pollster: k, polls: b.n, states: Object.keys(b.states).length, lean_raw: Math.round(raw * 10) / 10, lean: lean, lean_abs: Math.abs(lean), toward: lean > 0 ? 'Democrats' : lean < 0 ? 'Republicans' : 'neither party' });
        });
      });
      return out.sort((a, b) => a.lean - b.lean);
    },
  });

  dash.calc('sen_methods', {
    inputs: ['sen_polls_clean', 'sen_house'],
    title: 'Senate averages by method',
    description: "For raw and two-party margins: polls in the last 30 days (the 3 most recent if fewer). simple = mean; per_pollster = latest poll per pollster; lv_only = likely-voter polls; weighted = 0.5^(age/14) x sqrt(effective sample where the pollster publishes one, else reported sample; capped at 2,000; 600 if not reported); house_adj = latest per pollster minus that pollster's house effect.",
    fn: (sen_polls_clean, sen_house) => {
      const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
      const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
      const out = [];
      ['raw', 'two_party'].forEach((norm) => {
        const he = {};
        sen_house.filter((h) => h.norm === norm).forEach((h) => { he[h.pollster] = h.lean; });
        Array.from(new Set(sen_polls_clean.map((p) => p.state))).forEach((st) => {
          const all = sen_polls_clean.filter((p) => p.state === st).sort((a, b) => a.age - b.age);
          let win = all.filter((p) => p.age <= 30);
          if (win.length < 3) win = all.slice(0, 3);
          const latest = {};
          win.forEach((p) => { if (!latest[p.pollster] || p.age < latest[p.pollster].age) latest[p.pollster] = p; });
          const lat = Object.keys(latest).map((k) => latest[k]);
          const lv = win.filter((p) => p.population === 'LV');
          const w = win.map((p) => Math.pow(0.5, p.age / 14) * Math.sqrt(Math.min(p.effective_n || p.sample_size || 600, 2000)));
          const ws = w.reduce((s, x) => s + x, 0);
          const vals = {
            simple: [mean(win.map((p) => p[norm])), win.length],
            per_pollster: [mean(lat.map((p) => p[norm])), lat.length],
            lv_only: [mean(lv.map((p) => p[norm])), lv.length],
            weighted: [ws ? win.reduce((s, p, i) => s + p[norm] * w[i], 0) / ws : null, win.length],
            house_adj: [mean(lat.map((p) => p[norm] - (he[p.pollster] || 0))), lat.length],
          };
          Object.keys(vals).forEach((m) => out.push({ key: st + ' ' + norm + ' ' + m, state: st, norm: norm, method: m, margin: r1(vals[m][0]), polls: vals[m][1], opp_party: all[0].opp_party }));
        });
      });
      return out;
    },
  });

  dash.calc('sen_state_table', {
    inputs: ['sen_methods', 'sen_polls_clean'],
    title: 'Senate averages side by side',
    description: 'Each polled state under each method, for raw and two-party margins, with the gap between the highest and lowest method, the spread of the window polls (standard deviation), the standard error of their mean (spread divided by the square root of the poll count; a poll-dispersion figure, not a forecast interval), how many window polls carry a partisan sponsor flag, how many publish an effective sample size, and the mean 95% sampling margin of error on the candidate gap across the window polls (sampling only).',
    fn: (sen_methods, sen_polls_clean) => {
      const total = {};
      sen_polls_clean.forEach((p) => { total[p.state] = (total[p.state] || 0) + 1; });
      const by = {};
      sen_methods.forEach((r) => {
        const k = r.state + ' ' + r.norm;
        const lab = (x) => (x == null ? '' : (x > 0 ? r.opp_party + '+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1));
        if (!by[k]) by[k] = { key: k, state: r.state, norm: r.norm, polls_loaded: total[r.state] };
        by[k][r.method] = r.margin;
        by[k][r.method + '_label'] = lab(r.margin);
        if (r.method === 'simple') by[k].polls = r.polls;
      });
      return Object.keys(by).map((k) => {
        const r = by[k];
        const v = ['simple', 'per_pollster', 'lv_only', 'weighted', 'house_adj'].map((m) => r[m]).filter((x) => x != null);
        r.spread = v.length ? Math.round((Math.max.apply(null, v) - Math.min.apply(null, v)) * 10) / 10 : null;
        const all = sen_polls_clean.filter((p) => p.state === r.state).sort((a, b) => a.age - b.age);
        let win = all.filter((p) => p.age <= 30);
        if (win.length < 3) win = all.slice(0, 3);
        const vals = win.map((p) => p[r.norm]);
        const m = vals.reduce((s, x) => s + x, 0) / vals.length;
        const sd = vals.length > 1 ? Math.sqrt(vals.reduce((s, x) => s + (x - m) * (x - m), 0) / (vals.length - 1)) : null;
        r.poll_sd = sd == null ? null : Math.round(sd * 10) / 10;
        r.se_mean = sd == null ? null : Math.round((sd / Math.sqrt(vals.length)) * 10) / 10;
        r.partisan_in_window = win.filter((p) => p.partisan_flag).length;
        r.mean_poll_moe = Math.round((win.reduce((s, p) => s + p.margin_moe, 0) / win.length) * 10) / 10;
        r.with_effective_n = win.filter((p) => p.effective_n).length;
        return r;
      }).sort((a, b) => a.simple - b.simple);
    },
  });

  dash.calc('sen_state_grid', {
    inputs: ['sen_methods'],
    title: 'Senate margins after a uniform shift',
    description: "Each polled state's margin under each method and margin type after moving it the same amount, from 8 points toward Republicans to 8 toward the challenger.",
    fn: (sen_methods) => {
      const out = [];
      sen_methods.forEach((r) => {
        if (r.margin == null) return;
        for (let k = -8; k <= 8; k += 1) {
          const x = Math.round((r.margin + k) * 10) / 10;
          out.push({ key: [r.state, r.norm, r.method, k].join(' '), state: r.state, norm: r.norm, method: r.method, shift: k, margin: x, label: (x > 0 ? r.opp_party + '+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1) });
        }
      });
      return out;
    },
  });

  dash.calc('sen_seats', {
    inputs: ['sen_methods', 'states', 'seat_math'],
    title: 'Senate seats by method, margin type and polling error',
    description: 'For each method, margin type and uniform shift: every polled competitive race goes to whoever leads after the shift (a method with no polls in a state falls back to the simple average; ties within 0.05 go to the seat holder). Unpolled competitive races go to the seat holder. Dan Osborn (NE) is counted as an independent. Democrats need 51; Republicans keep control at 50 with the vice president.',
    fn: (sen_methods, states, seat_math) => {
      const s0 = seat_math[0];
      if (!s0) return [];
      const comp = states.filter((r) => r.race === 'yes' && r.forecaster_rating === 'Competitive');
      const m = {};
      sen_methods.forEach((r) => { if (r.margin != null) m[[r.state, r.norm, r.method].join(' ')] = r.margin; });
      const out = [];
      ['raw', 'two_party'].forEach((norm) => {
        ['simple', 'per_pollster', 'lv_only', 'weighted', 'house_adj'].forEach((meth) => {
          for (let k = -8; k <= 8; k += 1) {
            let d = 0;
            let rr = 0;
            let ind = 0;
            const flips = [];
            comp.forEach((c) => {
              const opp = String(c.dem_candidate || '').trim() ? 'D' : 'I';
              let v = m[[c.state, norm, meth].join(' ')];
              if (v == null) v = m[[c.state, norm, 'simple'].join(' ')];
              let win = c.incumbent_party;
              if (v != null && Math.abs(v + k) >= 0.05) win = v + k > 0 ? opp : 'R';
              if (win === 'D') d += 1; else if (win === 'I') ind += 1; else rr += 1;
              if (win !== c.incumbent_party) flips.push(c.state);
            });
            const dem = s0.base_d + d;
            const rep = s0.base_r + rr;
            out.push({ key: [norm, meth, k].join(' '), norm: norm, method: meth, shift: k, dem_seats: dem, rep_seats: rep, ind_seats: ind, control: dem >= 51 ? 'Democrats' : rep >= 50 ? 'Republicans' : 'No majority without Osborn', flips: flips.join(', ') });
          }
        });
      });
      return out;
    },
  });

  dash.calc('sen_flip_point', {
    inputs: ['sen_seats'],
    title: 'Polling error that flips Senate control',
    description: 'For each method and margin type: control with polls at face value, and the smallest uniform shift (within 8 points either way) that changes it.',
    fn: (sen_seats) => {
      const out = [];
      Array.from(new Set(sen_seats.map((r) => r.norm + '|' + r.method))).forEach((nm) => {
        const [norm, meth] = nm.split('|');
        const rows = sen_seats.filter((r) => r.norm === norm && r.method === meth);
        const zero = rows.find((r) => r.shift === 0);
        let flip = null;
        for (let d = 1; d <= 8 && flip == null; d += 1) {
          [-d, d].forEach((k) => {
            const r = rows.find((x) => x.shift === k);
            if (flip == null && r && r.control !== zero.control) flip = k;
          });
        }
        out.push({ key: norm + ' ' + meth, norm: norm, method: meth, dem_seats: zero.dem_seats, rep_seats: zero.rep_seats, control: zero.control, flip_shift: flip, flip_abs: flip == null ? null : Math.abs(flip), flip_toward: flip == null ? '' : flip > 0 ? 'the challengers' : 'Republicans' });
      });
      return out;
    },
  });

  dash.calc('sen_coverage', {
    inputs: ['senate_polls', 'sen_polls_clean', 'states'],
    title: 'Senate poll coverage',
    description: 'Competitive races with polls loaded, polls included and excluded, competitive races with no polls, and races resting on a single poll.',
    fn: (senate_polls, sen_polls_clean, states) => {
      const n = {};
      sen_polls_clean.forEach((p) => { n[p.state] = (n[p.state] || 0) + 1; });
      const comp = states.filter((s) => s.race === 'yes' && s.forecaster_rating === 'Competitive');
      const missing = comp.filter((s) => !n[s.state]).map((s) => s.state);
      const single = comp.filter((s) => n[s.state] === 1).map((s) => s.state);
      return [{ states_polled: comp.length - missing.length, competitive: comp.length, polls: sen_polls_clean.length, excluded: senate_polls.filter((r) => r.include !== 'yes').length, unpolled: missing.length, unpolled_list: missing.join(', ') || 'none', single_poll_list: single.join(', ') || 'none' }];
    },
  });

  /* ===== Generic ballot: our own average from individual polls ===== */
  dash.calc('gb_polls_clean', {
    inputs: ['generic_polls'],
    title: 'Generic-ballot polls, cleaned',
    description: 'Included national generic-ballot polls with raw margin (Democrat minus Republican) and two-party margin. Age is days before Oct 28, 2026 (2026 polls) or before Nov 5, 2024 (2024 polls).',
    fn: (generic_polls) => generic_polls.filter((r) => r.include === 'yes').map((r) => {
      const d = Number(r.dem);
      const rep = Number(r.rep);
      const fe = String(r.field_end);
      const t = Date.UTC(Number(fe.slice(0, 4)), Number(fe.slice(5, 7)) - 1, Number(fe.slice(8, 10)));
      const asOf = r.cycle === '2024' ? Date.UTC(2024, 10, 5) : pollAsOfMs;
      const lab = (x) => (x > 0 ? 'D+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1);
      const raw = Math.round((d - rep) * 10) / 10;
      const tp = Math.round(((d - rep) / (d + rep)) * 1000) / 10;
      return { poll_id: r.poll_id, cycle: r.cycle, release_id: r.release_id, pollster: r.pollster, sponsor: r.sponsor, field_end: fe, age: Math.max(0, Math.round((asOf - t) / 864e5)), sample_size: r.sample_size === '' ? null : Number(r.sample_size), population: r.population || 'not stated', dem: d, rep: rep, raw: raw, two_party: tp, raw_label: lab(raw), two_party_label: lab(tp), verification: r.verification };
    }),
  });

  dash.calc('gb_methods', {
    inputs: ['gb_polls_clean'],
    title: 'Generic-ballot averages by method',
    description: 'Per cycle and margin type, polls in the last 21 days. One row per release (likely voters preferred, then registered, then other) except for the likely-voter-only and registered-voter-only methods. simple = mean; per_pollster = latest release per pollster; weighted = 0.5^(age/10) x sqrt(sample, capped at 2,000; 600 if not reported).',
    fn: (gb_polls_clean) => {
      const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
      const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
      const rank = (p) => (p === 'LV' ? 0 : p === 'RV' ? 1 : 2);
      const out = [];
      ['2026', '2024'].forEach((cy) => {
        const win = gb_polls_clean.filter((p) => p.cycle === cy && p.age <= 21);
        const rel = {};
        win.forEach((p) => { if (!rel[p.release_id] || rank(p.population) < rank(rel[p.release_id].population)) rel[p.release_id] = p; });
        const one = Object.keys(rel).map((k) => rel[k]);
        const latest = {};
        one.forEach((p) => { if (!latest[p.pollster] || p.age < latest[p.pollster].age) latest[p.pollster] = p; });
        const lat = Object.keys(latest).map((k) => latest[k]);
        ['raw', 'two_party'].forEach((norm) => {
          const w = one.map((p) => Math.pow(0.5, p.age / 10) * Math.sqrt(Math.min(p.sample_size || 600, 2000)));
          const ws = w.reduce((s, x) => s + x, 0);
          // One version per survey release for each population. Some releases list multiple
          // LV screens; otherwise the LV-only average unintentionally double-counts them.
          const byReleasePopulation = (population) => {
            const picked = {};
            win.filter((p) => p.population === population).forEach((p) => {
              if (!picked[p.release_id]) picked[p.release_id] = p;
            });
            return Object.values(picked);
          };
          const lv = byReleasePopulation('LV');
          const rv = byReleasePopulation('RV');
          const vals = {
            simple: [mean(one.map((p) => p[norm])), one.length],
            per_pollster: [mean(lat.map((p) => p[norm])), lat.length],
            lv_only: [mean(lv.map((p) => p[norm])), lv.length],
            rv_only: [mean(rv.map((p) => p[norm])), rv.length],
            weighted: [ws ? one.reduce((s, p, i) => s + p[norm] * w[i], 0) / ws : null, one.length],
          };
          Object.keys(vals).forEach((m) => {
            const v = r1(vals[m][0]);
            const names = { simple: 'Simple average', per_pollster: 'Latest per pollster', lv_only: 'Likely voters only', rv_only: 'Registered voters only', weighted: 'Recency and size weighted' };
            out.push({ key: [cy, norm, m].join(' '), cycle: cy, norm: norm, method: m, method_label: names[m], margin: v, label: v == null ? 'no polls' : (v > 0 ? 'D+' : v < 0 ? 'R+' : 'Even ') + Math.abs(v).toFixed(1), polls: vals[m][1] });
          });
        });
      });
      return out;
    },
  });

  dash.calc('gb_backtest', {
    inputs: ['gb_methods', 'gb_polls_clean', 'generic_results'],
    title: '2024 generic-ballot backtest',
    description: "Final-week 2024 national generic-ballot polls as listed by Decision Desk HQ, averaged with the same methods, minus the 2024 House popular-vote margin. Positive error: polls overstated Democrats. Also each poll's own error.",
    fn: (gb_methods, gb_polls_clean, generic_results) => {
      const res = generic_results.find((r) => String(r.cycle) === '2024');
      if (!res) return [];
      const actual = Number(res.margin);
      const fmt = (e) => (e > 0 ? 'Democrats by ' : e < 0 ? 'Republicans by ' : 'neither, ') + Math.abs(e).toFixed(1);
      const out = gb_methods.filter((r) => r.cycle === '2024' && r.margin != null).map((r) => {
        const e = Math.round((r.margin - actual) * 10) / 10;
        return { key: 'avg ' + r.norm + ' ' + r.method, kind: 'average', norm: r.norm, name: 'Average: ' + r.method_label, polls: r.polls, estimate: r.margin, actual: actual, error: e, error_label: fmt(e) };
      });
      gb_polls_clean.filter((p) => p.cycle === '2024').forEach((p) => {
        const e = Math.round((p.raw - actual) * 10) / 10;
        out.push({ key: 'poll ' + p.poll_id, kind: 'poll', norm: 'raw', name: p.pollster + ' (' + p.population + ')', polls: 1, estimate: p.raw, actual: actual, error: e, error_label: fmt(e) });
      });
      return out;
    },
  });

  /* ===== Florida early vote: registration, assumption-based support, counted votes kept apart ===== */
  dash.calc('fl_ev', {
    inputs: ['fl_early_vote'],
    title: 'Florida ballots cast by party registration',
    description: 'Party registration of mail and early ballots already cast: share of ballots, share of registered voters, and turnout rate so far. These are registrations, not votes.',
    fn: (fl_early_vote) => {
      const reg = fl_early_vote.reduce((s, r) => s + Number(r.registered), 0);
      const cast = fl_early_vote.reduce((s, r) => s + Number(r.total_cast), 0);
      const p1 = (x) => Math.round(x * 1000) / 10;
      const rows = fl_early_vote.map((r) => ({ party: r.party, registered: Number(r.registered), total_cast: Number(r.total_cast), mail: Number(r.mail), early: Number(r.early), share_of_cast: p1(Number(r.total_cast) / cast), share_of_registered: p1(Number(r.registered) / reg), turnout_so_far: p1(Number(r.total_cast) / Number(r.registered)) }));
      const R = fl_early_vote.find((r) => r.party === 'Republican');
      const D = fl_early_vote.find((r) => r.party === 'Democrat');
      rows.push({ party: 'All', registered: reg, total_cast: cast, mail: rows.reduce((s, r) => s + r.mail, 0), early: rows.reduce((s, r) => s + r.early, 0), share_of_cast: 100, share_of_registered: 100, turnout_so_far: p1(cast / reg) });
      const lab = (x) => (x > 0 ? 'R+' : x < 0 ? 'D+' : 'Even ') + Math.abs(x).toFixed(1);
      rows.forEach((r) => {
        r.cast_reg_margin = Math.round(((Number(R.total_cast) - Number(D.total_cast)) / cast) * 1000) / 10;
        r.registration_margin = Math.round(((Number(R.registered) - Number(D.registered)) / reg) * 1000) / 10;
        r.cast_reg_label = lab(r.cast_reg_margin);
        r.registration_label = lab(r.registration_margin);
      });
      return rows;
    },
  });


  dash.calc('fl_official_comparison', {
    inputs: ['fl_early_vote', 'fl_early_vote_official'],
    title: 'Florida early voting: official vs. later third-party tracker',
    description: 'Official Florida Division of Elections report at Oct 28 08:07 ET compared with FL Voice 11:01 ET tracker; different collection times mean differences are not an error test. These are registrations of ballot casters, not candidate votes.',
    fn: (fl_early_vote, fl_early_vote_official) => {
      const total = (rows) => rows.reduce((s, r) => s + Number(r.total_cast), 0);
      const officialTotal = total(fl_early_vote_official), trackerTotal = total(fl_early_vote);
      const find = (rows, party) => rows.find(r => r.party === party);
      const oR = Number(find(fl_early_vote_official, 'Republican').total_cast);
      const oD = Number(find(fl_early_vote_official, 'Democrat').total_cast);
      const tR = Number(find(fl_early_vote, 'Republican').total_cast);
      const tD = Number(find(fl_early_vote, 'Democrat').total_cast);
      const results = fl_early_vote_official.map(o => {
        const t = find(fl_early_vote, o.party);
        return { key: o.party, group: o.party, official_ballots: Number(o.total_cast), tracker_ballots: Number(t.total_cast), difference: Number(t.total_cast) - Number(o.total_cast), official_as_of: o.as_of, tracker_as_of: t.as_of };
      });
      results.push({ key: 'All', group: 'All ballots', official_ballots: officialTotal, tracker_ballots: trackerTotal, difference: trackerTotal - officialTotal, official_as_of: fl_early_vote_official[0].as_of, tracker_as_of: fl_early_vote[0].as_of });
      results.push({ key: 'RminusD', group: 'R minus D ballots', official_ballots: oR-oD, tracker_ballots: tR-tD, difference: (tR-tD)-(oR-oD), official_as_of: fl_early_vote_official[0].as_of, tracker_as_of: fl_early_vote[0].as_of });
      return results;
    },
  });

  dash.calc('fl_scenarios_calc', {
    inputs: ['fl_early_vote', 'fl_scenarios'],
    title: 'Florida: estimated support among ballots already cast, by assumption',
    description: "Applies each stated assumption about how each registration group votes to the ballots already cast. Output is an assumption-driven estimate, not a vote count and not a forecast; no votes are counted until polls close.",
    fn: (fl_early_vote, fl_scenarios) => {
      const c = {};
      fl_early_vote.forEach((r) => { c[r.party] = Number(r.total_cast); });
      const tot = Object.keys(c).reduce((s, k) => s + c[k], 0);
      return fl_scenarios.map((s) => {
        const d = c.Democrat * s.d_reg_to_d + c.Republican * s.r_reg_to_d + c['No party'] * s.npa_to_d + c.Other * s.oth_to_d;
        const r = c.Democrat * s.d_reg_to_r + c.Republican * s.r_reg_to_r + c['No party'] * s.npa_to_r + c.Other * s.oth_to_r;
        const m = Math.round(((d - r) / tot) * 1000) / 10;
        return { scenario: s.scenario, est_margin: m, est_label: (m > 0 ? 'D+' : m < 0 ? 'R+' : 'Even ') + Math.abs(m).toFixed(1), note: s.note };
      });
    },
  });


  /* ===== 2025 pollster-level misses (NJ and VA governor) ===== */
  dash.calc('errors_2025', {
    inputs: ['polls_2025', 'results_2025', 'pollster_methods'],
    title: '2025 final polls vs. results',
    description: "Each final 2025 New Jersey and Virginia governor poll: raw margin (Democrat minus Republican) minus the result. Negative: the poll overstated the Republican. Joined to each pollster's recalled-vote and party-weighting tags.",
    fn: (polls_2025, results_2025, pollster_methods) => {
      const res = {};
      results_2025.forEach((r) => { res[r.race] = Number(r.margin); });
      const tag = {};
      pollster_methods.forEach((t) => { tag[t.pollster] = t; });
      const grp = (v) => (/^yes\b/.test(String(v)) ? 'yes' : /^no\b/.test(String(v)) ? 'no' : 'unknown');
      return polls_2025.map((p) => {
        const m = Number(p.dem) - Number(p.rep);
        const e = Math.round((m - res[p.race]) * 10) / 10;
        const t = tag[p.pollster] || {};
        return { poll_id: p.poll_id, race: p.race, pollster: p.pollster, date: p.date, poll_margin: m, result: res[p.race], error: e, error_label: (e > 0 ? 'Democrats by ' : e < 0 ? 'Republicans by ' : 'neither, ') + Math.abs(e).toFixed(1), recall_group: grp(t.recalled_vote_weighting), party_weighting: t.party_weighting || 'unknown' };
      });
    },
  });

  dash.calc('errors_2025_summary', {
    inputs: ['errors_2025'],
    title: '2025 misses by race and by recalled-vote weighting',
    description: 'Mean signed error of the final polls per race, the share of polls that overstated the Republican, and the same mean split by whether the pollster is verified to weight on recalled vote.',
    fn: (errors_2025) => {
      const out = [];
      const mean = (a) => Math.round((a.reduce((s, r) => s + r.error, 0) / a.length) * 10) / 10;
      ['NJ', 'VA'].forEach((race) => {
        const rs = errors_2025.filter((r) => r.race === race);
        if (!rs.length) return;
        out.push({ key: 'race ' + race, group: race === 'NJ' ? 'New Jersey, all final polls' : 'Virginia, all final polls', n: rs.length, mean_error: mean(rs), share_overstating_r: Math.round((rs.filter((r) => r.error < 0).length / rs.length) * 100) });
      });
      ['yes', 'no', 'unknown'].forEach((g) => {
        const rs = errors_2025.filter((r) => r.recall_group === g);
        if (!rs.length) return;
        out.push({ key: 'recall ' + g, group: 'Recalled-vote weighting: ' + g, n: rs.length, mean_error: mean(rs), share_overstating_r: Math.round((rs.filter((r) => r.error < 0).length / rs.length) * 100) });
      });
      return out;
    },
  });

  dash.calc('method_evidence_rows', {
    inputs: ['method_evidence'],
    title: 'Methodology evidence log',
    description: 'The methodology evidence file with a row key (pollster, date and question).',
    fn: (method_evidence) => method_evidence.map((r, i) => ({ ev_key: r.pollster + ' | ' + r.date + ' | ' + r.question + ' | ' + i, pollster: r.pollster, date: r.date, question: r.question, what_source_says: r.what_source_says, limitation: r.limitation, added_by: r.added_by, source_url: r.source_url })),
  });


  dash.calc('sen_date_audit', {
    inputs: ['senate_polls'],
    title: 'Senate poll date provenance',
    description: 'Included Senate polls by whether their fieldwork end is explicitly tagged. Legacy dates may be field-end or publication dates; provisional dates must not be presented as confirmed.',
    fn: (polls) => {
      const included = polls.filter((p) => p.include === 'yes');
      const groups = {};
      included.forEach((p) => {
        const q = String(p.recency_date_quality || '');
        const quality = p.field_end ? (q.includes('confirmed') || q.includes('primary') ? 'Field end: pollster document' : q.includes('PollCheck') ? 'Field end: PollCheck/Wikipedia list' : 'Field end: provisional/secondary') : 'Legacy listing date: type unverified';
        if (!groups[quality]) groups[quality] = 0;
        groups[quality]++;
      });
      return Object.entries(groups).map(([quality, polls]) => ({key: quality, quality, polls}));
    },
  });


  // v13.2 independent method audit (Kimi research cross-checked against original RedBox release).
  // This NEVER feeds the simple polling average or election seat scenario.
  dash.calc('fl_redbox_model_assumptions_rows', {
    inputs:['fl_redbox_model_assumptions'],
    title:'RedBox original-source modeling assumptions',
    description:'Source-reported operations/targets; a disclosed model is not independently validated. Model-family weights are not probabilities.',
    fn:(rows)=>rows.map((r)=>({...r})),
  });
  dash.calc('fl_redbox_precision_rows', {
    inputs:['fl_redbox_subgroup_precision'],
    title:'RedBox Florida subgroup candidate-gap approximate uncertainty',
    description:'Approximate 95% sampling-only interval on candidate difference, from the reported effective n. These are NOT total-survey-error intervals and do not validate model targets.',
    fn:(rows)=>rows.map((r)=>{
      const d=Number(r.nixon_pct)/100, m=Number(r.moody_pct)/100, n=Number(r.n_effective), delta=d-m;
      const moe=196*Math.sqrt(Math.max(0,d+m-delta*delta)/n);
      return {key:r.key, group:r.label, raw_n:Number(r.n_raw), effective_n:n,
        d_margin:100*delta, d_margin_label:(delta>0?'D+':'R+')+Math.abs(100*delta).toFixed(1),
        gap_moe:moe, gap_moe_label:'±'+moe.toFixed(1)+' pts', interpretation:r.interpretation,
        source_url:r.source_url};
    }),
  });
  dash.calc('fl_redbox_early_sensitivity', {
    inputs:['fl_redbox_subgroup_precision'],
    title:'Sensitivity to RedBox modeled early-voter fraction (not a forecast)',
    description:'Holds original subgroup candidate preferences fixed and varies the modeled share already voted; no individual vote data. It tests arithmetic sensitivity, not validity.',
    fn:(rows)=>{
      const already=rows.find(r=>r.key==='already'), later=rows.find(r=>r.key==='not_yet');
      const a=(Number(already.nixon_pct)-Number(already.moody_pct)), b=(Number(later.nixon_pct)-Number(later.moody_pct));
      const observed=Number(already.modeled_electorate_share); const breakeven=-b/(a-b);
      return [0.30,observed,0.50,breakeven,0.65].map((share,i)=>{
        const margin=share*a+(1-share)*b;
        return {key:'s'+i, early_share:share*100, early_share_label:(share*100).toFixed(1)+'%',
          d_margin:margin, margin_label:Math.abs(margin)<0.000001?'Even':(margin>0?'D+':'R+')+Math.abs(margin).toFixed(1),
          kind:i===1?'RedBox published mix':i===3?'Arithmetic break-even':'Illustrative mix',
          note:'Not independently observed turnout. Conditional on fixing both subgroup candidate shares.'};
      });
    },
  });

  dash.calc('fl_redbox_status_rows', {
    inputs: ['fl_redbox_vote_status'],
    title: 'RedBox Florida Senate: already voted versus not yet',
    description: 'Original RedBox Oct 20–23 crosstabs. Subgroup vote is self-reported (already voted) or intended (not yet voted), not validated candidate votes. Margins from original unrounded estimates; displayed shares are rounded.',
    fn: (rows) => rows.map((r) => ({
      key: r.key, group: r.voting_status, n: Number(r.n_unweighted),
      nixon: Number(r.nixon_rounded), moody: Number(r.moody_rounded),
      margin: Number(r.margin_d_exact),
      label: (Number(r.margin_d_exact) > 0 ? 'D+' : Number(r.margin_d_exact) < 0 ? 'R+' : 'Even ') + Math.abs(Number(r.margin_d_exact)).toFixed(1),
      note: r.note, source_url: r.source_url,
    })),
  });

  dash.calc('fl_crosstab_rows', {
    inputs: ['fl_crosstabs'],
    title: 'Florida polls: independents',
    description: "Nixon's margin among independents in Florida polls (shares where published, otherwise the published margin), and the simple mean. Poll 'independents' are usually self-identified and are not the same group as no-party registrants.",
    fn: (fl_crosstabs) => {
      const rows = fl_crosstabs.map((r) => {
        const m = r.nixon !== '' && r.moody !== '' ? Number(r.nixon) - Number(r.moody) : Number(r.margin_published);
        const v = Math.round(m * 10) / 10;
        return { key: r.key, poll: r.poll, field_dates: r.field_dates, sample: r.sample, margin: v, label: (v > 0 ? 'Nixon +' : v < 0 ? 'Moody +' : 'Even ') + Math.abs(v).toFixed(1), note: r.note };
      });
      const mean = Math.round((rows.reduce((s, r) => s + r.margin, 0) / rows.length) * 10) / 10;
      rows.push({ key: 'mean', poll: 'Mean of ' + rows.length + ' polls', field_dates: '', sample: '', margin: mean, label: (mean > 0 ? 'Nixon +' : 'Moody +') + Math.abs(mean).toFixed(1), note: 'Unweighted mean; subgroup samples are small' });
      return rows;
    },
  });

  dash.calc('gb_house', {
    inputs: ['gb_polls_clean', 'pollster_methods'],
    title: 'Generic-ballot house effects (2026)',
    description: "One row per 2026 release (likely voters preferred, then registered, then adults). Each release's raw margin minus the mean of other pollsters' releases within 10 days; averaged per pollster and pulled toward zero by n/(n+2). Positive: more Democratic than the field. Joined to recalled-vote tags. Relative to the field, not accuracy.",
    fn: (gb_polls_clean, pollster_methods) => {
      const rank = (p) => (p === 'LV' ? 0 : p === 'RV' ? 1 : 2);
      const rel = {};
      gb_polls_clean.filter((p) => p.cycle === '2026').forEach((p) => { if (!rel[p.release_id] || rank(p.population) < rank(rel[p.release_id].population)) rel[p.release_id] = p; });
      const rs = Object.keys(rel).map((k) => rel[k]);
      const by = {};
      rs.forEach((p) => {
        const others = rs.filter((q) => q.pollster !== p.pollster && Math.abs(q.age - p.age) <= 10);
        if (others.length < 3) return;
        const cons = others.reduce((s, q) => s + q.raw, 0) / others.length;
        if (!by[p.pollster]) by[p.pollster] = { n: 0, sum: 0 };
        by[p.pollster].n += 1;
        by[p.pollster].sum += p.raw - cons;
      });
      const tag = {};
      pollster_methods.forEach((t) => { tag[t.pollster] = t.recalled_vote_weighting; });
      const grp = (v) => (/^yes\b/.test(String(v || '')) ? 'yes' : /^no\b/.test(String(v || '')) ? 'no' : 'unknown');
      return Object.keys(by).map((k) => {
        const b = by[k];
        const raw = b.sum / b.n;
        const lean = Math.round((raw * b.n / (b.n + 2)) * 10) / 10;
        return { pollster: k, releases: b.n, lean_raw: Math.round(raw * 10) / 10, lean: lean, label: (lean > 0 ? 'D+' : lean < 0 ? 'R+' : 'Even ') + Math.abs(lean).toFixed(1), recall_group: grp(tag[k]) };
      }).sort((a, b) => a.lean - b.lean);
    },
  });

  /* ===== Turnout screens, herding and dated claims (v9) ===== */
  dash.calc('sen_lv_rv_pairs', {
    inputs: ['senate_lv_rv_pairs'],
    title: 'Senate polls: same-survey likely vs. registered voters',
    description: 'Each Senate survey that published both a likely-voter and a registered-voter result. Margins are Democrat minus Republican. r_shift = registered-voter margin minus likely-voter margin: positive means the likely-voter screen produced a more Republican result.',
    fn: (senate_lv_rv_pairs) => senate_lv_rv_pairs.map((r) => {
      const lv = Number(r.lv_dem) - Number(r.lv_rep);
      const rv = Number(r.rv_dem) - Number(r.rv_rep);
      const s = Math.round((rv - lv) * 10) / 10;
      const end = String(r.field_dates).slice(-10);
      return { pair_id: r.pair_id, state: r.state, pollster: r.pollster, field_end: end, october: end >= '2026-10-01' ? 'yes' : 'no', lv_margin: lv, rv_margin: rv, r_shift: s, shift_label: (s > 0 ? 'R+' : s < 0 ? 'D+' : 'Even ') + Math.abs(s).toFixed(1), note: r.note };
    }).sort((a, b) => b.field_end.localeCompare(a.field_end) || a.state.localeCompare(b.state)),
  });

  dash.calc('sen_lv_rv_summary', {
    inputs: ['sen_lv_rv_pairs', 'external_benchmarks'],
    title: 'Likely-voter screen effect in Senate polls, by group',
    description: "Mean and median registered-to-likely shift (positive: likely voters more Republican) for all pairs, October pairs, each pollster, and all pairs except Marist, with the gap from Harry Enten's reported R+4 for key Senate races.",
    fn: (pairs, external_benchmarks) => {
      const b = {};
      external_benchmarks.forEach((r) => { b[r.key] = Number(r.value); });
      const mean = (a) => (a.length ? Math.round((a.reduce((s, p) => s + p.r_shift, 0) / a.length) * 10) / 10 : null);
      const med = (a) => { const v = a.map((p) => p.r_shift).sort((x, y) => x - y); const n = v.length; return n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : null; };
      const lab = (x) => (x == null ? '' : (x > 0 ? 'R+' : x < 0 ? 'D+' : 'Even ') + Math.abs(x).toFixed(1));
      const row = (key, group, a) => { const m = mean(a); return { key: key, group: group, pairs: a.length, mean_shift: m, mean_label: lab(m), median_shift: med(a), vs_enten: m == null ? null : Math.round((m - b.enten_senate) * 10) / 10 }; };
      const out = [row('all', 'All Senate pairs (Aug-Oct)', pairs), row('october', 'October pairs only', pairs.filter((p) => p.october === 'yes')), row('october excl marist', 'October excluding Marist', pairs.filter((p) => p.october === 'yes' && p.pollster !== 'Marist Poll'))];
      Array.from(new Set(pairs.map((p) => p.pollster))).sort().forEach((pl) => out.push(row('pollster ' + pl, pl, pairs.filter((p) => p.pollster === pl))));
      out.push(row('excl marist', 'All pairs except Marist', pairs.filter((p) => p.pollster !== 'Marist Poll')));
      return out;
    },
  });

  dash.calc('sen_lv_rv_pollster_balanced', {
    inputs: ['sen_lv_rv_pairs'],
    title: 'Sensitivity: equal weight per pollster within October',
    description: 'October Senate same-survey shifts, averaged within each pollster first and then averaged once across pollsters. Reports both survey-weighted and pollster-balanced means. Small selected set, not a representative estimator or a test of which likely-voter screen is correct.',
    fn: (pairs) => {
      const oct = pairs.filter((p) => p.october === 'yes');
      const gr = {};
      oct.forEach((p) => { if (!gr[p.pollster]) gr[p.pollster] = []; gr[p.pollster].push(p.r_shift); });
      const means = Object.keys(gr).sort().map((name) => ({ pollster: name, pairs: gr[name].length, mean_shift: gr[name].reduce((a,b)=>a+b,0)/gr[name].length }));
      const avg = (a) => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10 : null;
      const label = (v) => v == null ? 'N/A' : (v>0?'R+':v<0?'D+':'Even ') + Math.abs(v).toFixed(1);
      return [
        {key:'survey', group:'One vote per matched October survey', pollsters:means.length, pairs:oct.length, mean_shift:avg(oct.map(x=>x.r_shift)), label:label(avg(oct.map(x=>x.r_shift)))},
        {key:'pollster', group:'One vote per October pollster', pollsters:means.length, pairs:oct.length, mean_shift:avg(means.map(x=>x.mean_shift)), label:label(avg(means.map(x=>x.mean_shift)))}
      ];
    },
  });

  dash.calc('herding_check', {
    inputs: ['sen_polls_clean'],
    title: 'Herding check: spread of Senate polls vs. sampling error',
    description: 'For each state with at least 3 polls in a period (Aug 1-Sep 30 and Oct 1-28): the spread (standard deviation) of poll margins, the spread expected from sampling error alone (each poll\'s candidate-gap sampling SD from its shares and effective sample; 600 when no sample is reported), and their ratio. Real polls usually spread more than sampling error alone because of house effects and real movement; a ratio below 1 shows less observed spread than this naive independent-sampling reference, not proof of intentional herding. Reported sample sizes may not be effective sample sizes, and many polls share weighting and sampling assumptions.',
    fn: (sen_polls_clean) => {
      const periods = [['Aug-Sep', '2026-08-01', '2026-09-30'], ['Oct', '2026-10-01', '2026-10-28']];
      const out = [];
      Array.from(new Set(sen_polls_clean.map((p) => p.state))).sort().forEach((st) => {
        periods.forEach((pd) => {
          const ps = sen_polls_clean.filter((p) => p.state === st && p.date >= pd[1] && p.date <= pd[2]);
          if (ps.length < 3) return;
          const m = ps.reduce((s, p) => s + p.raw, 0) / ps.length;
          const obs = Math.sqrt(ps.reduce((s, p) => s + Math.pow(p.raw - m, 2), 0) / (ps.length - 1));
          const exp = Math.sqrt(ps.reduce((s, p) => s + p.sampling_sd * p.sampling_sd, 0) / ps.length);
          out.push({ key: st + ' ' + pd[0], state: st, period: pd[0], polls: ps.length, mean_margin: Math.round(m * 10) / 10, observed_sd: Math.round(obs * 10) / 10, expected_sd: Math.round(exp * 10) / 10, ratio: Math.round((obs / exp) * 100) / 100 });
        });
      });
      return out;
    },
  });

  dash.calc('herding_sensitivity', {
    inputs: ['sen_polls_clean'],
    title: 'Sensitivity: latest survey per pollster and state within each period',
    description: 'Repeats the naive dispersion diagnostic using at most one latest release per pollster, per state and period. Reduces dependence on frequent repeat pollsters; does not correct for design effects, shared methods, opinion changes, or correlated sampling. This is not a test of intentional herding.',
    fn: (sen_polls_clean) => {
      const periods = [['Aug-Sep', '2026-08-01', '2026-09-30'], ['Oct', '2026-10-01', '2026-10-28']];
      const out = [];
      Array.from(new Set(sen_polls_clean.map((p) => p.state))).sort().forEach((st) => {
        periods.forEach((pd) => {
          const latest = {};
          sen_polls_clean.filter((p) => p.state === st && p.date >= pd[1] && p.date <= pd[2]).forEach((p) => {
            if (!latest[p.pollster] || p.date > latest[p.pollster].date) latest[p.pollster] = p;
          });
          const ps = Object.values(latest);
          if (ps.length < 3) return;
          const mean = ps.reduce((s, p) => s + p.raw, 0) / ps.length;
          const sd = Math.sqrt(ps.reduce((s, p) => s + (p.raw - mean) ** 2, 0) / (ps.length - 1));
          const expected = Math.sqrt(ps.reduce((s, p) => s + p.sampling_sd * p.sampling_sd, 0) / ps.length);
          out.push({ key: st + ' ' + pd[0], state: st, period: pd[0], pollsters: ps.length, observed_sd: Math.round(sd * 100) / 100, expected_sd: Math.round(expected * 100) / 100, ratio: Math.round(sd / expected * 100) / 100 });
        });
      });
      return out;
    },
  });

  dash.calc('herding_sensitivity_summary', {
    inputs: ['herding_sensitivity'],
    title: 'Sensitivity summary: one survey per pollster per period',
    description: 'Naive pooled dispersion ratios for states with at least three pollsters in both periods, using the latest survey per pollster. Descriptive only; cannot establish deliberate herding.',
    fn: (rows) => {
      const states = [...new Set(rows.map((r) => r.state))].filter((st) => rows.filter((r) => r.state === st).length === 2);
      return ['Aug-Sep', 'Oct'].map((period) => {
        const rs = rows.filter((r) => r.period === period && states.includes(r.state));
        const num = rs.reduce((s, r) => s + (r.pollsters - 1) * r.observed_sd ** 2, 0);
        const den = rs.reduce((s, r) => s + (r.pollsters - 1) * r.expected_sd ** 2, 0);
        return { period, states: rs.length, pollsters: rs.reduce((s, r) => s + r.pollsters, 0), pooled_ratio: den ? Math.round(Math.sqrt(num / den) * 100) / 100 : null, below_1: rs.filter((r) => r.ratio < 1).length };
      });
    },
  });

  dash.calc('herding_summary', {
    inputs: ['herding_check'],
    title: 'Herding check, pooled by period',
    description: 'Across states with at least 3 polls in both periods: pooled ratio of observed to sampling-only spread, how many states fall below 1, and the average change in state means from Aug-Sep to October (positive: toward the challenger).',
    fn: (herding_check) => {
      const states = Array.from(new Set(herding_check.map((r) => r.state))).filter((st) => herding_check.filter((r) => r.state === st).length === 2);
      const out = [];
      ['Aug-Sep', 'Oct'].forEach((pd) => {
        const rs = herding_check.filter((r) => r.period === pd && states.indexOf(r.state) >= 0);
        const num = rs.reduce((s, r) => s + (r.polls - 1) * r.observed_sd * r.observed_sd, 0);
        const den = rs.reduce((s, r) => s + (r.polls - 1) * r.expected_sd * r.expected_sd, 0);
        out.push({ key: pd, period: pd, states: rs.length, polls: rs.reduce((s, r) => s + r.polls, 0), pooled_ratio: den ? Math.round(Math.sqrt(num / den) * 100) / 100 : null, states_below_1: rs.filter((r) => r.ratio < 1).length, mean_shift: null, toward_challenger: null });
      });
      const shifts = states.map((st) => herding_check.find((r) => r.state === st && r.period === 'Oct').mean_margin - herding_check.find((r) => r.state === st && r.period === 'Aug-Sep').mean_margin);
      const ms = shifts.length ? Math.round((shifts.reduce((s, x) => s + x, 0) / shifts.length) * 10) / 10 : null;
      out.push({ key: 'shift', period: 'Change in state averages, Aug-Sep to Oct', states: shifts.length, polls: null, pooled_ratio: null, states_below_1: null, mean_shift: ms, toward_challenger: shifts.filter((x) => x > 0).length });
      return out;
    },
  });

  dash.calc('within_pollster_change', {
    inputs: ['sen_polls_clean'],
    title: 'Same pollster, same state: Aug-Sep vs. October',
    description: 'For each pollster that polled a state in both Aug-Sep and October: its latest October margin minus its latest Aug-Sep margin (positive: moved toward the challenger). Holding the pollster fixed controls only for stable pollster offsets; sampling method, weighting, electorate composition and candidate support may change.',
    fn: (sen_polls_clean) => {
      const out = [];
      Array.from(new Set(sen_polls_clean.map((p) => p.state + '|' + p.pollster))).forEach((k) => {
        const parts = k.split('|');
        const ps = sen_polls_clean.filter((p) => p.state === parts[0] && p.pollster === parts[1]);
        const a = ps.filter((p) => p.date >= '2026-08-01' && p.date <= '2026-09-30').sort((x, y) => y.date.localeCompare(x.date))[0];
        const b = ps.filter((p) => p.date >= '2026-10-01' && p.date <= '2026-10-28').sort((x, y) => y.date.localeCompare(x.date))[0];
        if (!a || !b) return;
        const c = Math.round((b.raw - a.raw) * 10) / 10;
        out.push({ key: k, state: parts[0], pollster: parts[1], sep_margin: a.raw, oct_margin: b.raw, change: c, change_label: (c > 0 ? 'D+' : c < 0 ? 'R+' : 'Even ') + Math.abs(c).toFixed(1) });
      });
      return out.sort((x, y) => y.change - x.change);
    },
  });

  dash.calc('within_pollster_summary', {
    inputs: ['within_pollster_change'],
    title: 'Same-pollster change, summary',
    description: 'Mean and median of the same-pollster changes, and how many moved toward the challenger, toward Republicans, or not at all.',
    fn: (rows) => {
      if (!rows.length) return [];
      const v = rows.map((r) => r.change).sort((a, b) => a - b);
      const n = v.length;
      const mean = Math.round((v.reduce((s, x) => s + x, 0) / n) * 10) / 10;
      const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
      return [{ key: 'all', pairs: n, mean_change: mean, mean_label: (mean > 0 ? 'D+' : mean < 0 ? 'R+' : 'Even ') + Math.abs(mean).toFixed(1), median_change: median, toward_challenger: v.filter((x) => x > 0).length, toward_r: v.filter((x) => x < 0).length, unchanged: v.filter((x) => x === 0).length }];
    },
  });

  dash.calc('mike_claims_check', {
    inputs: ['sen_seats', 'sen_state_table', 'external_benchmarks'],
    title: "What Mike's Oct 28 calls would require",
    description: "The smallest uniform polling error (raw margins, simple average) at which Democrats reach Mike's 56 Senate seats, and how far Florida polls would have to be off for a toss-up. The House call has no model here.",
    fn: (sen_seats, sen_state_table, external_benchmarks) => {
      const b = {};
      external_benchmarks.forEach((r) => { b[r.key] = Number(r.value); });
      const rows = sen_seats.filter((r) => r.norm === 'raw' && r.method === 'simple').sort((x, y) => x.shift - y.shift);
      const hit = rows.find((r) => r.shift >= 0 && r.dem_seats >= b.mike_senate);
      const fl = sen_state_table.find((r) => r.norm === 'raw' && r.state === 'FL');
      return [
        { key: 'senate', claim: 'Democrats win ' + b.mike_senate + ' Senate seats', requires: hit ? 'Under a uniform +' + hit.shift + '-point scenario applied across competitive races, the model reaches ' + b.mike_senate + ' Democratic seats; this is one scenario, not a necessary error in each state' : 'Not reached within an 8-point shift', points: hit ? hit.shift : null },
        { key: 'florida', claim: 'Florida Senate is a toss-up', requires: fl ? 'Florida polls overstate Moody by about ' + Math.abs(fl.simple).toFixed(1) + ' points' : 'Florida not polled', points: fl ? Math.abs(fl.simple) : null },
        { key: 'house', claim: 'Democrats win ' + b.mike_house + ' House seats', requires: 'No House seat model in this project; score against the certified result', points: null },
      ];
    },
  });

  /* ===== Experimental turnout scenarios (v12): separately labeled, never model inputs ===== */
  dash.calc('sen_turnout_scenarios', {
    inputs: ['sen_methods', 'sen_lv_rv_pairs', 'sen_polls_clean', 'pollster_methods', 'external_benchmarks'],
    title: 'Experimental turnout scenarios (not the main average)',
    description: "For each state with same-survey likely/registered pairs: the main unadjusted simple average, then labeled scenarios. RV versions = mean of the registered-voter margins in the pairs (any date); LV versions of the same surveys; RV minus 1 and minus 2 = historical midterm screen effects reported by Harry Enten (CNN, Oct 28) applied to the RV mean; screen-removed = main average minus the state's mean observed screen shift; recalled-vote-only and verified-no-recall = the 30-day simple average restricted to pollsters with those verified tags. Each row shows its difference from the main average. These are sensitivity checks on stated assumptions, not forecasts, and they do not feed the seat count.",
    fn: (sen_methods, sen_lv_rv_pairs, sen_polls_clean, pollster_methods, external_benchmarks) => {
      const b = {};
      external_benchmarks.forEach((r) => { b[r.key] = Number(r.value); });
      const tag = {};
      pollster_methods.forEach((t) => { tag[t.pollster] = String(t.recalled_vote_weighting || ''); });
      const grp = (v) => (/^yes\b/.test(v) ? 'yes' : /^no\b/.test(v) ? 'no' : 'unknown');
      const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
      const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
      const out = [];
      Array.from(new Set(sen_lv_rv_pairs.map((p) => p.state))).sort().forEach((st) => {
        const main = sen_methods.find((m) => m.state === st && m.norm === 'raw' && m.method === 'simple');
        if (!main || main.margin == null) return;
        const pairs = sen_lv_rv_pairs.filter((p) => p.state === st);
        const all = sen_polls_clean.filter((p) => p.state === st).sort((x, y) => x.age - y.age);
        let win = all.filter((p) => p.age <= 30);
        if (win.length < 3) win = all.slice(0, 3);
        const opp = all.length ? all[0].opp_party : 'D';
        const lab = (x) => (x == null ? 'no data' : (x > 0 ? opp + '+' : x < 0 ? 'R+' : 'Even ') + Math.abs(x).toFixed(1));
        const push = (key, scenario, value, n, basis) => out.push({ key: st + ' ' + key, state: st, scenario: scenario, value: r1(value), label: lab(r1(value)), n: n, delta_vs_main: value == null ? null : r1(value - main.margin), basis: basis });
        push('main', 'Main unadjusted simple average (reference)', main.margin, main.polls, 'All included polls, last 30 days');
        const rv = mean(pairs.map((p) => p.rv_margin));
        const lv = mean(pairs.map((p) => p.lv_margin));
        push('rv', 'Registered-voter versions of paired surveys', rv, pairs.length, 'Same-survey pairs, any date');
        push('lv', 'Likely-voter versions of the same surveys', lv, pairs.length, 'Same-survey pairs, any date');
        push('rv_h1', 'RV versions minus 1 point (historical midterm screen, Enten)', rv == null ? null : rv - b.enten_hist_2026_states, pairs.length, 'Enten: party-ID gain from all to validated voters, these states in 2018');
        push('rv_h2', 'RV versions minus 2 points (key 2018 Senate races, Enten)', rv == null ? null : rv - b.enten_hist_2018_key, pairs.length, 'Enten: key 2018 Senate races');
        const shift = mean(pairs.map((p) => p.r_shift));
        push('screen_removed', 'Main average with the observed screen shift added back', shift == null ? null : main.margin + shift, pairs.length, 'Main average plus the mean RV-minus-LV shift in this state');
        const yes = win.filter((p) => grp(tag[p.pollster]) === 'yes').map((p) => p.raw);
        const no = win.filter((p) => grp(tag[p.pollster]) === 'no').map((p) => p.raw);
        push('recall_yes', 'Only pollsters verified to weight on recalled 2024 vote', mean(yes), yes.length, '30-day window; pollster-level tags');
        push('recall_no', 'Only pollsters verified not to weight on recalled vote', mean(no), no.length, '30-day window; pollster-level tags');
        const nonpart = win.filter((p) => !p.partisan_flag).map((p) => p.raw);
        push('no_partisan', 'Excluding polls with a partisan sponsor flag', mean(nonpart), nonpart.length, '30-day window; unflagged sponsors are not necessarily nonpartisan');
      });
      return out;
    },
  });

  dash.calc('sen_dup_check', {
    inputs: ['senate_polls'],
    title: 'Possible duplicate or same-survey rows',
    description: 'Among included Senate polls: pairs with the same state and pollster, dates within 3 days and identical candidate shares (possible duplicates), and pairs with the same state, pollster and fieldwork start but a different population (two versions of one survey, which must not both count). Empty means none found.',
    fn: (senate_polls) => {
      const inc = senate_polls.filter((r) => r.include === 'yes');
      const day = (s) => (s ? Date.parse(String(s) + 'T00:00:00Z') / 864e5 : null);
      const out = [];
      for (let i = 0; i < inc.length; i += 1) {
        for (let j = i + 1; j < inc.length; j += 1) {
          const a = inc[i];
          const b = inc[j];
          if (a.state !== b.state || a.pollster !== b.pollster) continue;
          const da = day(a.field_end || a.date);
          const db = day(b.field_end || b.date);
          const close = da != null && db != null && Math.abs(da - db) <= 3;
          if (close && a.dem === b.dem && a.rep === b.rep) out.push({ key: a.poll_id + '|' + b.poll_id, kind: 'possible duplicate (same shares within 3 days)', a: a.poll_id, b: b.poll_id, state: a.state, pollster: a.pollster });
          else if (a.field_start && a.field_start === b.field_start && a.population !== b.population) out.push({ key: a.poll_id + '|' + b.poll_id, kind: 'two populations from one survey', a: a.poll_id, b: b.poll_id, state: a.state, pollster: a.pollster });
        }
      }
      return out;
    },
  });

  /* ===== Methodology comparison and hypothesis ledger ===== */
  dash.calc('method_comparison', {
    inputs: ['sen_polls_clean', 'sen_house', 'gb_polls_clean', 'pollster_methods'],
    title: 'Pollster methodology comparison',
    description: "Per pollster: Senate polls loaded, likely-voter share, raw-margin house effect where estimable, generic-ballot polls loaded, and methodology tags with their verification status and scope (survey = from a specific release; pollster-general = from a general or national statement; secondary = from a third party). Recalled-vote weighting, party weighting and turnout screens are kept separate; political_weighting is yes if any political target (recalled vote, party, or modeled past vote) is verified, and 'no (demographic only)' only if both recalled-vote and party weighting are verified absent.",
    fn: (sen_polls_clean, sen_house, gb_polls_clean, pollster_methods) => {
      const he = {};
      sen_house.filter((h) => h.norm === 'raw').forEach((h) => { he[h.pollster] = h; });
      const tags = {};
      pollster_methods.forEach((t) => { tags[t.pollster] = t; });
      const names = Array.from(new Set(sen_polls_clean.map((p) => p.pollster).concat(gb_polls_clean.filter((p) => p.cycle === '2026').map((p) => p.pollster))));
      return names.map((nm) => {
        const ps = sen_polls_clean.filter((p) => p.pollster === nm);
        const lv = ps.filter((p) => p.population === 'LV').length;
        const t = tags[nm] || {};
        const h = he[nm];
        const isYes = (v) => /^yes\b/.test(String(v || ''));
        const isNo = (v) => /^no\b/.test(String(v || ''));
        const modeled = /synthetic|modeled/i.test(String(t.recalled_vote_weighting || ''));
        const political = isYes(t.recalled_vote_weighting) || isYes(t.party_weighting) || modeled ? 'yes' : isNo(t.recalled_vote_weighting) && isNo(t.party_weighting) ? 'no (demographic only)' : 'unknown';
        return { pollster: nm, senate_polls: ps.length, lv_share: ps.length ? Math.round((lv / ps.length) * 100) : null, house_effect: h ? h.lean : null, house_effect_label: h ? (h.lean > 0 ? 'D+' : h.lean < 0 ? 'R+' : '') + Math.abs(h.lean).toFixed(1) : 'not estimable', generic_polls: gb_polls_clean.filter((p) => p.pollster === nm && p.cycle === '2026').length, mode: t.mode || 'unknown', lv_screen: t.lv_screen || 'unknown', recalled_vote_weighting: t.recalled_vote_weighting || 'unknown', party_weighting: t.party_weighting || 'unknown', political_weighting: political, tag_scope: t.tag_scope || '', verification: t.verification || 'not tagged' };
      }).sort((a, b) => b.senate_polls - a.senate_polls);
    },
  });

  dash.calc('hypothesis_ledger', {
    inputs: ['offyear_rows', 'gb_backtest', 'error_summary', 'state_miss_rows', 'method_comparison', 'errors_2025_summary', 'gb_house', 'sen_lv_rv_summary', 'herding_summary', 'within_pollster_summary'],
    title: 'Hypothesis ledger: do recent polls favor Republicans?',
    description: 'Each available piece of evidence, its measured signed error (positive: polls overstated Democrats), and what it can and cannot show. The methodology test runs only when pollsters are tagged from verified methodology statements.',
    fn: (offyear_rows, gb_backtest, error_summary, state_miss_rows, method_comparison, errors_2025_summary, gb_house, sen_lv_rv_summary, herding_summary, within_pollster_summary) => {
      const dir = (e) => (e > 0 ? 'Polls overstated Democrats' : e < 0 ? 'Polls overstated Republicans' : 'No lean');
      const out = [];
      offyear_rows.forEach((r) => out.push({ key: 'off ' + r.key, evidence: r.race + ', ' + r.year + ' (final average)', error: r.error, direction: dir(r.error), n: 1, limits: 'One race; off-year turnout differs from a midterm' }));
      const g = gb_backtest.find((r) => r.key === 'avg raw simple');
      if (g) out.push({ key: 'gb2024', evidence: '2024 generic ballot, final-week polls (simple average)', error: g.error, direction: dir(g.error), n: g.polls, limits: 'Presidential year; generic ballot vs. House vote is an imperfect match' });
      error_summary.filter((r) => r.group.indexOf('aapor') === 0).forEach((r) => out.push({ key: 'aapor ' + r.group, evidence: 'AAPOR, ' + r.cycle_type.toLowerCase() + ' years (average)', error: r.mean, direction: dir(r.mean), n: r.cycles, limits: 'Industry-wide averages, all offices' }));
      state_miss_rows.forEach((r) => out.push({ key: 'state ' + r.key, evidence: r.race + ', ' + r.year + ' (final average)', error: r.error, direction: dir(r.error), n: 1, limits: 'One race in a 2026 battleground state' }));
      errors_2025_summary.filter((r) => r.key.indexOf('race ') === 0).forEach((r) => out.push({ key: 'p25 ' + r.key, evidence: r.group + ' (pollster level, 2025)', error: r.mean_error, direction: dir(r.mean_error), n: r.n, limits: r.share_overstating_r + '% of final polls overstated the Republican; off-year electorate' }));
      const grp = (v) => (/^yes\b/.test(String(v)) ? 'yes' : /^no\b/.test(String(v)) ? 'no' : 'unknown');
      const pol = method_comparison.filter((m) => m.political_weighting !== 'unknown' && m.house_effect != null);
      const polYes = pol.filter((m) => m.political_weighting === 'yes');
      const polNo = pol.filter((m) => m.political_weighting !== 'yes');
      const pavg = (a) => (a.length ? Math.round((a.reduce((s, m) => s + m.house_effect, 0) / a.length) * 10) / 10 : null);
      if (polYes.length && polNo.length) out.push({ key: 'politicalw', evidence: 'Senate house effect: any political weighting (' + polYes.length + ') minus demographic-only weighting (' + polNo.length + ')', error: Math.round((pavg(polYes) - pavg(polNo)) * 10) / 10, direction: pavg(polYes) - pavg(polNo) < 0 ? 'Politically weighted pollsters lean Republican relative to demographic-only' : 'Politically weighted pollsters lean Democratic relative to demographic-only', n: pol.length, limits: polNo.length < 3 ? 'Descriptive only: fewer than 3 verified demographic-only pollsters' : 'Relative lean only' });
      const tagged = method_comparison.filter((m) => grp(m.recalled_vote_weighting) !== 'unknown' && m.house_effect != null);
      const yes = tagged.filter((m) => grp(m.recalled_vote_weighting) === 'yes');
      const no = tagged.filter((m) => grp(m.recalled_vote_weighting) === 'no');
      const avg = (a) => (a.length ? Math.round((a.reduce((s, m) => s + m.house_effect, 0) / a.length) * 10) / 10 : null);
      const diff = yes.length && no.length ? Math.round((avg(yes) - avg(no)) * 10) / 10 : null;
      const enough = yes.length >= 3 && no.length >= 3;
      const surveyLevel = tagged.filter((m) => m.tag_scope === 'survey').length;
      out.push({ key: 'tags', evidence: 'Senate house effect: pollsters verified to weight on recalled vote (' + yes.length + ') minus those verified not to (' + no.length + ')', error: diff, direction: diff == null ? 'Not testable yet' : diff < 0 ? 'Recalled-vote pollsters lean Republican relative to the others' : diff > 0 ? 'Recalled-vote pollsters lean Democratic relative to the others' : 'No difference', n: tagged.length, limits: (enough ? 'Relative lean only; says nothing about which group is right' : 'Descriptive only: fewer than 3 verified pollsters in a group') + '. ' + surveyLevel + ' of ' + tagged.length + ' tags come from the specific survey release; the rest are pollster-level.' });
      const y25 = errors_2025_summary.find((r) => r.key === 'recall yes');
      const n25 = errors_2025_summary.find((r) => r.key === 'recall no');
      const gy = gb_house.filter((h) => h.recall_group === 'yes');
      const gn = gb_house.filter((h) => h.recall_group === 'no');
      const gavg = (a) => (a.length ? Math.round((a.reduce((s, h) => s + h.lean, 0) / a.length) * 10) / 10 : null);
      if (gy.length && gn.length) out.push({ key: 'tagsgb', evidence: 'Generic-ballot house effect: recalled-vote pollsters (' + gy.length + ') minus pollsters verified not to weight on it (' + gn.length + ')', error: Math.round((gavg(gy) - gavg(gn)) * 10) / 10, direction: gavg(gy) - gavg(gn) < 0 ? 'Recalled-vote pollsters lean Republican relative to the others' : 'Recalled-vote pollsters lean Democratic relative to the others', n: gy.length + gn.length, limits: gy.length >= 3 && gn.length >= 3 ? 'Relative lean only' : 'Descriptive only: fewer than 3 verified pollsters in a group' });
      if (y25 && n25) out.push({ key: 'tags25', evidence: '2025 error: recalled-vote pollsters (' + y25.n + ' polls) minus pollsters verified not to weight on it (' + n25.n + ' polls)', error: Math.round((y25.mean_error - n25.mean_error) * 10) / 10, direction: y25.mean_error - n25.mean_error > 0 ? 'Recalled-vote polls missed less toward Republicans' : 'Recalled-vote polls missed more toward Republicans', n: y25.n + n25.n, limits: 'Descriptive only: two pollsters in total' });
      const sOct = sen_lv_rv_summary.find((r) => r.key === 'october');
      const sMar = sen_lv_rv_summary.find((r) => r.key === 'pollster Marist Poll');
      const sEx = sen_lv_rv_summary.find((r) => r.key === 'excl marist');
      if (sOct) out.push({ key: 'lvoct', evidence: 'Senate likely-voter screen effect: October same-survey pairs (' + sOct.pairs + '); positive means likely voters more Republican', error: sOct.mean_shift, direction: sOct.mean_shift > 0 ? 'Likely-voter results more Republican than registered' : 'Likely-voter results more Democratic than registered', n: sOct.pairs, limits: 'Measures the screen, not accuracy' + (sMar ? '; Marist alone averages ' + sMar.mean_label + ' across ' + sMar.pairs + ' states' : '') });
      if (sEx) out.push({ key: 'lvexm', evidence: 'Same, all Aug-Oct pairs except Marist (' + sEx.pairs + ')', error: sEx.mean_shift, direction: sEx.mean_shift > 0 ? 'Likely-voter results more Republican than registered' : 'Likely-voter results more Democratic than registered', n: sEx.pairs, limits: 'Few pollsters publish both versions' });
      herding_summary.filter((r) => r.pooled_ratio != null).forEach((r) => out.push({ key: 'herd ' + r.key, evidence: 'Herding check, ' + r.period + ': spread of Senate polls relative to sampling error alone (ratio)', error: r.pooled_ratio, direction: r.pooled_ratio < 1 ? 'Below simple sampling reference (not proof of herding)' : 'At or above simple sampling reference', n: r.polls, limits: 'Not a hypothesis test for intentional herding. Independent sampling and effective sample sizes are unverified; correlated methods, sample overlap, weighting and rounding can change expected spread.' }));
      const ws = within_pollster_summary[0];
      if (ws) out.push({ key: 'within', evidence: 'Same pollster, same state, Aug-Sep to October (' + ws.pairs + ' pairs); positive means toward the challenger', error: ws.mean_change, direction: ws.mean_change > 0 ? 'Polls moved toward the challenger' : 'Polls moved toward Republicans', n: ws.pairs, limits: 'Movement can be real opinion change; says nothing about motive' });
      return out;
    },
  });

  /* ===== Analyst claims & within-survey LV/RV audit (v8) ===== */
  dash.calc('analyst_claims_rows', {
    inputs: ['analyst_claims'],
    title: 'Dated analyst statements and empirical comparison (not model inputs)',
    description: 'Statements, evidence grades and planned checks. Predictions are attributed to speakers and have no effect on poll averages or seat maps.',
    fn: (analyst_claims) => analyst_claims.map((r) => ({
      claim_id:r.claim_id, date:r.date, speaker:r.speaker, topic:r.topic,
      claim:r.claim, category:r.category, source_type:r.source_type,
      verification:r.verification, proposed_test:r.proposed_test,
      limitation:r.limitation, source_url:r.source_url
    })),
  });

  dash.calc('gb_lv_rv_pairs', {
    inputs: ['gb_polls_clean'],
    title: 'Paired registered- and likely-voter shifts in 2026 national generic-ballot releases',
    description: 'Only releases containing both RV and LV estimates in the same dataset. One LV and one RV per release; if multiple LV versions are listed, use the first and flag that choice. R_shift = RV raw Democratic margin minus LV raw Democratic margin: positive means the LV screen produces a more Republican margin. Different from comparing separate LV-only and RV-only averages.',
    fn: (gb_polls_clean) => {
      const groups={};
      gb_polls_clean.filter(p => p.cycle==='2026' && p.age<=21).forEach(p => {
        if (!groups[p.release_id]) groups[p.release_id]=[];
        groups[p.release_id].push(p);
      });
      const r1=x=>Math.round(x*10)/10;
      return Object.keys(groups).flatMap(release_id => {
        const grp=groups[release_id];
        const lv=grp.filter(p=>p.population==='LV');
        const rv=grp.filter(p=>p.population==='RV');
        if(!lv.length||!rv.length) return [];
        const L=lv[0], R=rv[0];
        const shift=r1(R.raw-L.raw);
        return [{ release_id, pollster:L.pollster, field_end:L.field_end,
          lv_margin:L.raw, rv_margin:R.raw, r_shift:shift,
          shift_label:(shift>0?'R+':shift<0?'D+':'Even ')+Math.abs(shift).toFixed(1),
          lv_versions:lv.length, sample_note:lv.length>1?'Multiple LV results: first listed is used; confirm exact screen in original PDF':'One LV result',
          verification:'Secondary-imported figures; audit individual releases before interpretation' }];
      }).sort((a,b)=> b.field_end.localeCompare(a.field_end)||a.pollster.localeCompare(b.pollster));
    },
  });

  dash.calc('gb_lv_rv_summary', {
    inputs: ['gb_lv_rv_pairs','gb_polls_clean'],
    title: 'Within-release LV/RV screen change summary',
    description: "Unweighted mean and median of paired Republican-direction shifts; NOT representative of all polls and NOT comparable to Enten's separate sample. Excludes releases lacking both populations.",
    fn: (pairs, gb_polls_clean) => {
      const unique=new Set(gb_polls_clean.filter(p=>p.cycle==='2026'&&p.age<=21).map(p=>p.release_id)).size;
      if(!pairs.length) return [{pairs:0,eligible_releases:unique,avg_r_shift:null,median_r_shift:null,summary:'No matched same-release RV/LV pairs',caveat:'Missing pairs; no inference possible'}];
      const vals=pairs.map(p=>p.r_shift).sort((a,b)=>a-b);
      const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
      const median=vals.length%2?vals[(vals.length-1)/2]:(vals[vals.length/2-1]+vals[vals.length/2])/2;
      const s=x=>(x>0?'R+':x<0?'D+':'Even ')+Math.abs(x).toFixed(1);
      return [{pairs:pairs.length,eligible_releases:unique,
        avg_r_shift:Math.round(mean*10)/10, median_r_shift:Math.round(median*10)/10,
        summary:s(Math.round(mean*10)/10),
        caveat:'Paired sample is selective; some releases have multiple LV versions. Verify against original questionnaires. A positive number indicates a more Republican LV margin.'}];
    },
  });
