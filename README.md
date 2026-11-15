# Options Master

A browser game for learning US stock options trading with play money. Built for iPhone, works on desktop too.

**Play:** open `index.html` in a browser (no build step, no dependencies).

## What's in it

- 8 fictional companies and an index ETF, with simulated prices that follow the market by beta
- A real US trading calendar: weekends and market holidays, Friday weekly and monthly expirations
- An option chain with bid/ask, delta and volatility skew; $0.65 per contract per leg in fees
- 10 strategies unlocked by level: Long Call/Put, Covered Call, Cash-Secured Put, four vertical spreads, Long Straddle, Iron Condor
- Quarterly earnings with EPS, revenue and guidance, so a stock can fall after beating estimates
- Macro events (Fed, CPI, jobs report), VIX, IV Rank, expected move, IV crush
- P/L chart at expiry and today, Greeks per trade and for the whole portfolio
- 12 missions, 10 levels, 16 short lessons
- Vietnamese and English, switchable in-game (VI / EN button)

## Saving

Progress is saved in the browser (`localStorage`). Cloud saving across devices works only when the game runs as a Claude artifact; elsewhere the cloud icon shows 📱 and the game saves on the device.

## Leaderboard & player data

The in-game leaderboard (🏆 Ranks tab) shows only each player's name and best net worth. Behind it, every visit, game, restart, trade and trading session is logged to a Google Sheet through an Apps Script web app (`apps-script/Code.gs`):

| Tab | One row per |
|---|---|
| Leaderboard | player, ranked by best net worth |
| Players | player: visits, games started, restarts, game overs, trades, sessions, best/current net worth, level, device |
| Games | game (each restart starts a new one): sessions, net worth, peak, wins/losses, fees, how it ended |
| Trades | trade action, with the market context the player saw: price, IV, IV Rank, HV, VIX, days to earnings, expected move, news, coach advice, Greeks, risk % |
| Daily | trading session advanced: net worth, day P&L, positions, market move, macro event, earnings, expirations |
| Events | visit, name set/rename, level up, mission, language change, game over |

Setup: open the sheet → Extensions → Apps Script → paste `apps-script/Code.gs` → Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone) → put the `/exec` URL in `SHEET_API` in `index.html`. Logging only runs when `SHEET_API` is set and the game is served from the web (e.g. GitHub Pages); Claude artifacts block outside requests.

## Disclaimer

Companies and prices are simulated; any match with a real ticker is a coincidence. Not modeled: early assignment, dividends, margin, limit orders, taxes. This is a practice tool, not investment advice.

---

# Options Master (Tiếng Việt)

Game trên trình duyệt để luyện giao dịch quyền chọn cổ phiếu Mỹ bằng tiền ảo. Thiết kế cho iPhone, chơi được trên máy tính.

**Chơi:** mở `index.html` bằng trình duyệt, không cần cài đặt gì.

Tiến trình lưu trong trình duyệt. Lưu cloud giữa các máy chỉ hoạt động khi game chạy dưới dạng artifact của Claude. Công ty và giá đều là mô phỏng; đây là công cụ luyện tập, không phải lời khuyên đầu tư.
