# Options Master

A browser game for learning US stock options trading with play money. Built for iPhone, works on desktop too.

**Play:** open `index.html` in a browser (no build step, no dependencies).

## What's in it

- **Market:** 19 fictional stocks across 10 sectors, 6 ETFs (US 500, Tech 100, Small Cap, High Dividend, Bonds, Gold), plus gold and WTI crude; prices follow the market by beta, gold and oil by their own factors
- **Calendar:** real US trading days and holidays, Friday weekly/monthly expirations, Fed / CPI / jobs / OPEC+ events, quarterly earnings with EPS, revenue and guidance
- **Options:** option chain with bid/ask, delta and skew; 15 strategies (calls, puts, covered call, cash-secured put, protective put, 4 vertical spreads, straddle, strangle, collar, iron condor, iron butterfly, call butterfly); P/L chart; full Greeks (Δ Γ Θ ν ρ) per trade and for the portfolio
- **Black–Scholes calculator:** price, intrinsic/time value, all Greeks, d₁/d₂, probability ITM, put–call parity check, charts of price and each Greek against the stock price
- **Futures:** Micro US 500, Micro Tech 100, Micro Gold, Micro Crude Oil; initial/maintenance margin, daily mark-to-market, contango/basis, margin calls and forced liquidation, cash settlement at expiry
- **Long vs short-term investing:** any number of shares, lots tagged short-/long-term by holding period, quarterly dividends with DRIP, monthly dollar-cost-averaging plans, skip ahead by week/month/quarter/year
- 16 missions, 10 levels, 6 lesson sections (options basics, Black–Scholes & Greeks, strategies, futures vs options, long-term investing, risk)
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
