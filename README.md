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

## Disclaimer

Companies and prices are simulated; any match with a real ticker is a coincidence. Not modeled: early assignment, dividends, margin, limit orders, taxes. This is a practice tool, not investment advice.

---

# Options Master (Tiếng Việt)

Game trên trình duyệt để luyện giao dịch quyền chọn cổ phiếu Mỹ bằng tiền ảo. Thiết kế cho iPhone, chơi được trên máy tính.

**Chơi:** mở `index.html` bằng trình duyệt, không cần cài đặt gì.

Tiến trình lưu trong trình duyệt. Lưu cloud giữa các máy chỉ hoạt động khi game chạy dưới dạng artifact của Claude. Công ty và giá đều là mô phỏng; đây là công cụ luyện tập, không phải lời khuyên đầu tư.
