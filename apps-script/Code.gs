/**
 * Options Master — Google Sheets backend (Apps Script web app).
 *
 * Sheets (created automatically on first run, see setup()):
 *   Leaderboard  name + best net worth, sorted (what the game shows)
 *   Players      one row per player: visits, games, restarts, trades, best/current net worth…
 *   Games        one row per game (each new game / restart gets a new game_id)
 *   Trades       one row per trade action, with the market context the player saw
 *   Daily        one row per trading session the player advanced
 *   Events       visits, level-ups, missions, language changes, game over, renames…
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * Paste the /exec URL into SHEET_API in index.html.
 */

const TZ = 'America/New_York';
const HEAD = {
  Leaderboard: ['Rank', 'Name', 'Best net worth', 'Current net worth', 'Player ID', 'Updated'],
  Players: ['Player ID', 'Name', 'First seen', 'Last seen', 'Visits', 'Games started', 'Restarts', 'Game overs',
    'Trades', 'Sessions played', 'Best net worth', 'Current net worth', 'Current game ID', 'Level', 'Missions done',
    'Language', 'Device', 'Cloud save'],
  Games: ['Game ID', 'Player ID', 'Name', 'Game #', 'Start reason', 'Started', 'Last update', 'Ended', 'End reason',
    'Sessions played', 'Start game date', 'Last game date', 'Current net worth', 'Peak net worth', 'Cash', 'Trades',
    'Wins', 'Losses', 'Fees paid', 'Level', 'Missions done'],
  Trades: ['Time', 'Player ID', 'Name', 'Game ID', 'Game date', 'Session #', 'Action', 'Symbol', 'Strategy', 'Qty',
    'Legs', 'Expiry', 'DTE', 'Fill / share', 'Debit/Credit', 'Cash flow', 'Fees', 'P&L', 'P&L %', 'Days held',
    'Max loss', 'Max gain', 'Breakeven', 'Collateral', 'Delta (sh)', 'Theta/day', 'Vega/1%', 'Stock price',
    'IV 30d', 'IV Rank', 'HV 20d', 'VIX', 'Days to earnings', 'Expiry covers earnings', 'Expected move',
    'Risk % of net worth', 'News seen', 'Coach advice', 'Net worth before', 'Cash before', 'Level', 'Language'],
  Daily: ['Time', 'Player ID', 'Name', 'Game ID', 'Game date', 'Session #', 'Net worth', 'Day P&L', 'Cash',
    'Open options', 'Stock holdings', 'Theta/day', 'VIX', 'Market move', 'Macro event', 'Earnings today', 'Expired/assigned'],
  Events: ['Time', 'Player ID', 'Name', 'Game ID', 'Game date', 'Type', 'Detail']
};

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEAD).forEach(function (n) { sheet_(ss, n); });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
}

function sheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold')
      .setBackground('#1c2670').setFontColor('#ffc93c');
    sh.setFrozenRows(1);
  }
  return sh;
}

function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }
function str_(v, n) { return String(v == null ? '' : v).replace(/^[=+\-@]/, "'$&").slice(0, n || 500); }
function num_(v) { const x = Number(v); return isFinite(x) ? Math.round(x * 100) / 100 : ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function findRow_(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < n; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

/* ---------- GET: leaderboard (name + net worth only) ---------- */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Leaderboard');
  const lim = Math.min(100, Math.max(1, Number((e && e.parameter && e.parameter.n) || 50)));
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, rows: [] });
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  const rows = v.filter(function (r) { return r[1] !== ''; }).slice(0, lim)
    .map(function (r) { return { name: String(r[1]).replace(/^'/, ''), nw: Number(r[2]) || 0, me: String(r[4]) }; });
  // only the asking player's own id is echoed back, so the game can highlight its own row
  const pid = e && e.parameter && e.parameter.pid;
  rows.forEach(function (r) { r.me = pid && r.me === pid; });
  return json_({ ok: true, rows: rows });
}

/* ---------- POST: batched events from the game ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  if (!body || !body.pid || !/^[a-z0-9-]{8,40}$/i.test(body.pid)) return json_({ ok: false, error: 'bad player' });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ingest_(ss, body);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

function ingest_(ss, b) {
  const t = now_(), pid = str_(b.pid, 40), name = str_(b.name, 24), ev = (b.events || []).slice(0, 300);
  const g = b.game || {};
  const out = { Trades: [], Daily: [], Events: [] };
  let visits = 0, games = 0, restarts = 0, overs = 0, trades = 0, days = 0;
  /* highest net worth seen in this batch, per game and overall (a restart mid-batch must not hide an earlier peak) */
  const peak = {}; let best = Number(b.nw) || 0;
  function seen_(gid, v) { v = Number(v); if (!isFinite(v) || v <= 0) return; if (v > best) best = v; if (gid && !(peak[gid] >= v)) peak[gid] = v; }
  seen_(g.gid, b.nw);
  (b.closed || []).forEach(function (c) { seen_(c.gid, c.nw); });
  ev.forEach(function (x) { if (x.t === 'day' || x.t === 'trade') seen_(x.gid, x.nw); });

  ev.forEach(function (x) {
    const base = [str_(x.at || t, 20), pid, name, str_(x.gid || g.gid, 40), str_(x.date, 12)];
    if (x.t === 'trade') {
      trades++;
      out.Trades.push(base.concat([num_(x.day), str_(x.action, 20), str_(x.sym, 8), str_(x.strat, 24), num_(x.qty),
        str_(x.legs, 80), str_(x.exp, 12), num_(x.dte), num_(x.fill), str_(x.dc, 8), num_(x.cash), num_(x.fee),
        num_(x.pnl), num_(x.pnlPct), num_(x.held), num_(x.maxLoss), x.maxGain === 'inf' ? 'Unlimited' : num_(x.maxGain),
        str_(x.be, 40), num_(x.collat), num_(x.delta), num_(x.theta), num_(x.vega), num_(x.px), num_(x.iv),
        num_(x.ivr), num_(x.hv), num_(x.vix), num_(x.toEarn), x.covers === true ? 'Yes' : x.covers === false ? 'No' : '',
        num_(x.em), num_(x.riskPct), str_(x.news, 400), str_(x.advice, 300), num_(x.nw), num_(x.cashBefore),
        num_(x.lv), str_(x.lang, 4)]));
    } else if (x.t === 'day') {
      days++;
      out.Daily.push(base.concat([num_(x.day), num_(x.nw), num_(x.dpnl), num_(x.cash), num_(x.npos), str_(x.shares, 120),
        num_(x.theta), num_(x.vix), num_(x.mkt), str_(x.macro, 30), str_(x.earn, 200), str_(x.settled, 300)]));
    } else {
      if (x.t === 'visit') visits++;
      if (x.t === 'game_start') { games++; if (x.reason === 'restart' || x.reason === 'after_bust') restarts++; }
      if (x.t === 'game_over') overs++;
      out.Events.push(base.concat([str_(x.t, 24), str_(JSON.stringify(x.d || {}), 1000)]));
    }
  });
  Object.keys(out).forEach(function (n) {
    if (!out[n].length) return;
    const sh = sheet_(ss, n);
    sh.getRange(sh.getLastRow() + 1, 1, out[n].length, out[n][0].length).setValues(out[n]);
  });

  /* Players: upsert */
  const ps = sheet_(ss, 'Players'), pr = findRow_(ps, pid);
  const nw = num_(b.nw);
  let row;
  if (pr) {
    row = ps.getRange(pr, 1, 1, HEAD.Players.length).getValues()[0];
  } else {
    row = [pid, name, t, t, 0, 0, 0, 0, 0, 0, 0, 0, '', '', '', '', '', ''];
  }
  row[1] = name; row[3] = t;
  row[4] = (Number(row[4]) || 0) + visits; row[5] = (Number(row[5]) || 0) + games; row[6] = (Number(row[6]) || 0) + restarts;
  row[7] = (Number(row[7]) || 0) + overs; row[8] = (Number(row[8]) || 0) + trades; row[9] = (Number(row[9]) || 0) + days;
  if (nw !== '') row[11] = nw;
  if (best > (Number(row[10]) || 0)) row[10] = num_(best);
  row[12] = str_(g.gid, 40); row[13] = num_(g.lv); row[14] = num_(g.missions);
  row[15] = str_(b.lang, 4); row[16] = str_(b.device, 80); row[17] = str_(b.cloud, 6);
  if (pr) ps.getRange(pr, 1, 1, row.length).setValues([row]); else ps.appendRow(row);

  /* Games: upsert current game */
  if (g.gid) {
    const gs = sheet_(ss, 'Games'), gr = findRow_(gs, String(g.gid));
    let r = gr ? gs.getRange(gr, 1, 1, HEAD.Games.length).getValues()[0]
      : [str_(g.gid, 40), pid, name, num_(g.no), str_(g.reason, 16), t, t, '', '', 0, str_(g.startDate, 12), '', '', 0, '', 0, 0, 0, 0, '', ''];
    r[2] = name; r[6] = t; r[9] = num_(g.day); r[11] = str_(g.date, 12); r[12] = nw; if ((peak[g.gid] || 0) > (Number(r[13]) || 0)) r[13] = num_(peak[g.gid]);
    r[14] = num_(g.cash); r[15] = num_(g.trades); r[16] = num_(g.wins); r[17] = num_(g.losses); r[18] = num_(g.fees);
    r[19] = num_(g.lv); r[20] = num_(g.missions);
    if (g.ended) { r[7] = t; r[8] = str_(g.ended, 16); }
    if (gr) gs.getRange(gr, 1, 1, r.length).setValues([r]); else gs.appendRow(r);
  }
  /* close games that ended before this batch (restart / bust) */
  (b.closed || []).forEach(function (c) {
    const gs = sheet_(ss, 'Games'), gr = findRow_(gs, String(c.gid));
    if (!gr) return;
    const r = gs.getRange(gr, 1, 1, HEAD.Games.length).getValues()[0];
    r[6] = t; r[7] = t; r[8] = str_(c.reason, 16);
    if (c.day !== undefined) { r[9] = num_(c.day); r[11] = str_(c.date, 12); r[14] = num_(c.cash); r[15] = num_(c.trades);
      r[16] = num_(c.wins); r[17] = num_(c.losses); r[18] = num_(c.fees); r[19] = num_(c.lv); r[20] = num_(c.missions); }
    if (c.nw !== undefined) r[12] = num_(c.nw);
    if ((peak[c.gid] || 0) > (Number(r[13]) || 0)) r[13] = num_(peak[c.gid]);
    gs.getRange(gr, 1, 1, r.length).setValues([r]);
  });

  rebuildBoard_(ss);
}

function rebuildBoard_(ss) {
  const ps = sheet_(ss, 'Players'), n = ps.getLastRow() - 1;
  if (n < 1) return;
  const v = ps.getRange(2, 1, n, 12).getValues()
    .filter(function (r) { return r[1] !== '' && Number(r[10]) > 0; })
    .sort(function (a, b) { return Number(b[10]) - Number(a[10]); });
  const lb = sheet_(ss, 'Leaderboard'), t = now_();
  if (lb.getLastRow() > 1) lb.getRange(2, 1, lb.getLastRow() - 1, HEAD.Leaderboard.length).clearContent();
  if (!v.length) return;
  lb.getRange(2, 1, v.length, HEAD.Leaderboard.length).setValues(v.map(function (r, i) {
    return [i + 1, r[1], r[10], r[11], r[0], t];
  }));
}
