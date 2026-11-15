// Token Radar dashboard: the board, one detail view, the live-token set, and a model sandbox.
// No network, no framework. Reads window.RADAR from data.js, written by main.ts.
(function () {
  'use strict';

  var D = window.RADAR;
  if (!D || !Array.isArray(D.rows)) {
    document.body.textContent = 'Token Radar: no data loaded.';
    return;
  }

  var rows = D.rows;
  var live = D.live || [];
  var model = D.model;

  /* ------------------------------------------------------------ formatting */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(n) {
    if (n == null || !isFinite(n)) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }

  function pct(x) {
    if (x == null || !isFinite(x)) return '—';
    return (x >= 0 ? '+' : '') + x.toFixed(1) + '%';
  }

  function ageText(days) {
    if (days == null) return '—';
    if (days < 365) return days + 'd';
    return (days / 365).toFixed(1) + 'y';
  }

  function mult(x) {
    return '×' + x.toFixed(2);
  }

  function $(id) {
    return document.getElementById(id);
  }

  /* ------------------------------------------------------------ header */

  var chips = $('chips');
  var watchlistCount = rows.filter(function (r) { return r.on_watchlist; }).length;
  chips.innerHTML =
    '<span class="chip"><b>' + rows.length + '</b> protocols ranked</span>' +
    '<span class="chip"><b>' + watchlistCount + '</b> on the watchlist</span>' +
    '<span class="chip">Floor <b>' + money(D.floor_usd) + '</b></span>' +
    '<span class="chip">Snapshot <b>' + esc(D.as_of) + '</b></span>';

  $('method-text').innerHTML =
    'Every row is a protocol whose DefiLlama record carries no token: no market cap, no CoinGecko id, ' +
    'no symbol. The board covers the whole watchlist (TVL at or above ' + money(D.floor_usd) +
    ', no token recorded) and the pre-token protocols below the floor. Implied value is the model ' +
    '<b>radar-2</b>, from the snapshot\'s own figures only:';
  var formula = document.createElement('p');
  formula.className = 'formula';
  formula.textContent =
    'implied = TVL × ' + model.base_multiple +
    ' × (1 + clamp(7d change, -60%, +120%) × ' + model.growth_weight + ')' +
    ' × (0.6 + 0.4 × min(age, 1095d) / 1095)' +
    ' × (1 + 0.04 × min(chains − 1, 6))';
  $('method-text').appendChild(formula);
  var caveat = document.createElement('p');
  caveat.className = 'muted';
  caveat.textContent =
    'A protocol on the board may still have a token its DefiLlama record does not carry, and ' +
    'parentage is not one of the snapshot\'s fields, so a row may be a child of another protocol. ' +
    'The live-token protocols are set aside below, at the market\'s own value.';
  $('method-text').appendChild(caveat);
  $('source-line').textContent = 'Source: ' + D.source;

  /* ------------------------------------------------------------ controls */

  var qEl = $('q');
  var catEl = $('cat');
  var chainEl = $('chain');
  var watchEl = $('watch');
  var sortEl = $('sort');

  var categories = [];
  var chains = [];
  rows.forEach(function (r) {
    if (r.category && categories.indexOf(r.category) === -1) categories.push(r.category);
    r.chains.forEach(function (c) {
      if (chains.indexOf(c) === -1) chains.push(c);
    });
  });
  categories.sort();
  chains.sort();
  categories.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    catEl.appendChild(o);
  });
  chains.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    chainEl.appendChild(o);
  });

  /* ------------------------------------------------------------ model */

  function recompute(r, m) {
    var growth = Math.min(m.growth_cap, Math.max(m.growth_floor, r.change_7d == null ? 0 : r.change_7d));
    var growthMult = 1 + (growth / 100) * m.growth_weight;
    var age = r.age_days == null ? m.unknown_age_days : r.age_days;
    var maturityMult = m.maturity_floor + (1 - m.maturity_floor) * (Math.min(Math.max(age, 0), m.maturity_days) / m.maturity_days);
    var extra = Math.min(Math.max(r.chains.length - 1, 0), m.chain_max_extra);
    var chainsMult = 1 + m.chain_step * extra;
    var implied = Math.max(1, Math.round(r.tvl_usd * m.base_multiple * growthMult * maturityMult * chainsMult));
    return { implied: implied, growthMult: growthMult, maturityMult: maturityMult, chainsMult: chainsMult, growthPct: growth };
  }

  var sandbox = null; // null: the submitted model; else the sandbox constants

  function currentModel() {
    return sandbox || model;
  }

  function shownRows() {
    var q = qEl.value.trim().toLowerCase();
    var cat = catEl.value;
    var chain = chainEl.value;
    var watchOnly = watchEl.checked;
    var out = rows.filter(function (r) {
      if (watchOnly && !r.on_watchlist) return false;
      if (cat && r.category !== cat) return false;
      if (chain && r.chains.indexOf(chain) === -1) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    var m = currentModel();
    var sort = sortEl.value;
    if (sandbox) {
      out = out.map(function (r) { return { r: r, v: recompute(r, m) }; });
      out.sort(function (a, b) { return b.v.implied - a.v.implied || (a.r.slug < b.r.slug ? -1 : 1); });
      return out.map(function (x, i) { return { row: x.r, implied: x.v.implied, pos: i + 1 }; });
    }
    out = out.slice();
    if (sort === 'tvl') out.sort(function (a, b) { return b.tvl_usd - a.tvl_usd || a.rank - b.rank; });
    else if (sort === 'growth') out.sort(function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0) || a.rank - b.rank; });
    else if (sort === 'age') out.sort(function (a, b) { return (b.age_days || 0) - (a.age_days || 0) || a.rank - b.rank; });
    else out.sort(function (a, b) { return a.rank - b.rank; });
    return out.map(function (r) { return { row: r, implied: r.implied_value_usd, pos: r.rank }; });
  }

  /* ------------------------------------------------------------ board */

  var boardBody = document.querySelector('#board tbody');

  function renderBoard() {
    var list = shownRows();
    var html = '';
    list.forEach(function (item) {
      var r = item.row;
      var chg = r.change_7d;
      var cls = chg == null ? '' : chg >= 0 ? 'pos' : 'neg';
      html += '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="num">' + item.pos + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span>' +
        (r.on_watchlist ? '<span class="badge">WATCHLIST</span>' : '') +
        '<br><span class="slug">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.join(', ') || '—') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + cls + '">' + pct(chg) + '</td>' +
        '<td class="num">' + ageText(r.age_days) + '</td>' +
        '<td class="num big">' + money(item.implied) + '</td></tr>';
    });
    boardBody.innerHTML = html || '<tr><td colspan="8">No protocols match this filter.</td></tr>';
    $('count').textContent = list.length + ' of ' + rows.length + ' rows' +
      (sandbox ? ' — sandbox order, the submitted board is unchanged' : '');
  }

  boardBody.addEventListener('click', function (ev) {
    var tr = ev.target.closest('tr[data-slug]');
    if (!tr) return;
    openDetail(tr.getAttribute('data-slug'));
  });

  /* ------------------------------------------------------------ detail */

  var detailEl = $('detail');

  function openDetail(slug) {
    var r = null;
    for (var i = 0; i < rows.length; i++) if (rows[i].slug === slug) { r = rows[i]; break; }
    if (!r) return;
    var m = currentModel();
    var v = sandbox ? recompute(r, m) : {
      implied: r.implied_value_usd,
      growthMult: r.growth_multiplier,
      maturityMult: r.maturity_multiplier,
      chainsMult: r.chains_multiplier,
      growthPct: r.change_7d == null ? 0 : Math.min(120, Math.max(-60, r.change_7d)),
    };
    var base = Math.round(r.tvl_usd * m.base_multiple);
    var age = r.age_days == null ? m.unknown_age_days : r.age_days;
    var steps = r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    detailEl.hidden = false;
    detailEl.innerHTML =
      '<h2>' + esc(r.name) + (r.on_watchlist ? ' <span class="badge">WATCHLIST</span>' : '') + '</h2>' +
      '<p class="muted">' + esc(r.slug) + ' · ' + esc(r.category || 'uncategorised') + ' · listed ' + esc(r.listed_at || 'unknown') + ' · pre-token by DefiLlama record</p>' +
      '<div class="grid">' +
      '<div class="stat"><div class="k">Implied value</div><div class="v">' + money(v.implied) + '</div></div>' +
      '<div class="stat"><div class="k">TVL</div><div class="v">' + money(r.tvl_usd) + '</div></div>' +
      '<div class="stat"><div class="k">7-day change</div><div class="v">' + pct(r.change_7d) + '</div></div>' +
      '<div class="stat"><div class="k">Age</div><div class="v">' + ageText(r.age_days) + '</div></div>' +
      '<div class="stat"><div class="k">Chains</div><div class="v">' + esc(r.chains.join(', ') || '—') + '</div></div>' +
      '<div class="stat"><div class="k">Board rank</div><div class="v">#' + r.rank + ' of ' + rows.length + '</div></div>' +
      '</div>' +
      '<h3>How the value is built</h3>' +
      '<ul class="breakdown">' +
      '<li><span>Base — TVL × ' + m.base_multiple + '</span><span>' + money(base) + '</span></li>' +
      '<li><span>Growth — 7d ' + pct(r.change_7d) + ' clamped to ' + v.growthPct.toFixed(1) + '%</span><span>' + mult(v.growthMult) + '</span></li>' +
      '<li><span>Maturity — ' + age + ' days tracked</span><span>' + mult(v.maturityMult) + '</span></li>' +
      '<li><span>Reach — ' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + '</span><span>' + mult(v.chainsMult) + '</span></li>' +
      '<li><span>Implied value</span><span>' + money(v.implied) + '</span></li>' +
      '</ul>' +
      '<h3>Farm plan — six steps</h3>' +
      '<ol class="steps">' + steps + '</ol>' +
      '<p class="muted">Costs are estimates from the protocol\'s own size and age. Nothing here is a promise of a token, a date, or a reward.</p>';
    var prev = boardBody.querySelector('tr.selected');
    if (prev) prev.classList.remove('selected');
    var tr = boardBody.querySelector('tr[data-slug="' + slug + '"]');
    if (tr) tr.classList.add('selected');
    detailEl.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    if (location.hash !== '#detail=' + slug) history.replaceState(null, '', '#detail=' + slug);
  }

  /* ------------------------------------------------------------ live tokens */

  var liveBody = document.querySelector('#live tbody');
  var liveHtml = '';
  live.forEach(function (p) {
    var chg = p.change_7d;
    var cls = chg == null ? '' : chg >= 0 ? 'pos' : 'neg';
    liveHtml += '<tr>' +
      '<td><span class="name">' + esc(p.name) + '</span><br><span class="slug">' + esc(p.slug) + '</span></td>' +
      '<td>' + esc(p.category || '—') + '</td>' +
      '<td>' + esc(p.chains.join(', ') || '—') + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td>' +
      '<td class="num">' + money(p.mcap_usd) + '</td>' +
      '<td class="num ' + cls + '">' + pct(chg) + '</td></tr>';
  });
  liveBody.innerHTML = liveHtml;
  $('live-count').textContent = live.length + ' largest by market cap';

  /* ------------------------------------------------------------ sandbox */

  var sliderDefs = [
    { key: 'base_multiple', label: 'Base multiple (TVL ×)', min: 0.05, max: 0.6, step: 0.01 },
    { key: 'growth_weight', label: 'Growth weight', min: 0, max: 1, step: 0.05 },
    { key: 'maturity_floor', label: 'Maturity floor', min: 0.4, max: 0.8, step: 0.05 },
    { key: 'chain_step', label: 'Per extra chain', min: 0, max: 0.1, step: 0.01 },
  ];
  var slidersEl = $('sliders');
  sliderDefs.forEach(function (def) {
    var wrap = document.createElement('label');
    wrap.textContent = def.label + ' ';
    var out = document.createElement('output');
    out.id = 'out-' + def.key;
    out.textContent = model[def.key].toFixed(2);
    wrap.appendChild(out);
    var input = document.createElement('input');
    input.type = 'range';
    input.id = 'in-' + def.key;
    input.min = String(def.min);
    input.max = String(def.max);
    input.step = String(def.step);
    input.value = String(model[def.key]);
    input.addEventListener('input', function () {
      out.textContent = Number(input.value).toFixed(2);
    });
    wrap.appendChild(input);
    slidersEl.appendChild(wrap);
  });

  function readSandbox() {
    var m = {
      base_multiple: model.base_multiple,
      growth_weight: model.growth_weight,
      growth_floor: model.growth_floor,
      growth_cap: model.growth_cap,
      maturity_floor: model.maturity_floor,
      maturity_range: model.maturity_range,
      maturity_days: model.maturity_days,
      unknown_age_days: model.unknown_age_days,
      chain_step: model.chain_step,
      chain_max_extra: model.chain_max_extra,
    };
    sliderDefs.forEach(function (def) {
      m[def.key] = Number($('in-' + def.key).value);
    });
    return m;
  }

  $('apply-sandbox').addEventListener('click', function () {
    sandbox = readSandbox();
    renderBoard();
    $('sandbox-note').textContent = 'Sandbox active: the board above is re-ranked with your constants. The submitted board.json keeps radar-2.';
  });
  $('reset-sandbox').addEventListener('click', function () {
    sandbox = null;
    sliderDefs.forEach(function (def) {
      $('in-' + def.key).value = String(model[def.key]);
      $('out-' + def.key).textContent = model[def.key].toFixed(2);
    });
    renderBoard();
    $('sandbox-note').textContent = '';
  });

  /* ------------------------------------------------------------ wiring */

  [qEl, catEl, chainEl, watchEl, sortEl].forEach(function (el) {
    el.addEventListener('input', renderBoard);
    el.addEventListener('change', renderBoard);
  });

  // Deep links: #detail=<slug>, #cat=<category>, #chain=<chain>.
  var hash = location.hash.slice(1);
  var params = new URLSearchParams(hash);
  var hCat = params.get('cat');
  var hChain = params.get('chain');
  if (hCat && categories.indexOf(hCat) !== -1) catEl.value = hCat;
  if (hChain && chains.indexOf(hChain) !== -1) chainEl.value = hChain;

  renderBoard();

  var hDetail = params.get('detail');
  if (hDetail) openDetail(hDetail);
})();
