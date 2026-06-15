## Build Plan — 6 Big Features (Phased)

স্কোপ অনেক বড়, তাই **৬ phase** এ ভাগ করছি। প্রতি phase শেষে আপনি test করবেন, তারপর next phase।

---

### **Phase A — Excel FB Account Upload + Auto-Fallback Login** 🔑
- **UI**: `Accounts` tab-এ "Bulk Upload Excel" button
- **Excel columns**: `uid`, `password`, `cookies` (যেকোনো order, optional columns)
- **SheetJS** দিয়ে parse → preview table → save to `fb_accounts` table
- **Auto-fallback logic** (backend serverFn):
  1. প্রথমে cookies দিয়ে login try
  2. Cookies invalid/expired হলে → UID + PASSWORD দিয়ে login
  3. Success হলে new cookies save করে রাখবে (future use)
- **Encryption**: password `APP_ENCRYPTION_KEY` দিয়ে encrypt করে store

### **Phase B — Advanced Facebook Policy Checker** 🛡️
- বর্তমান `/policy-check` upgrade
- Caption + URL + media description একসাথে scan
- Risk terms database (1000+ FB-banned keywords/phrases)
- Link reputation check (shortener, blacklist domain)
- Severity breakdown: Hate / Spam / Misleading / Copyright / Adult
- **Pre-post warning modal** — যেকোনো post action-এর আগে auto check

### **Phase C — AI Thumbnail Generator** 🖼️
- Video URL/topic input → AI দিয়ে ৪টা thumbnail variant generate (Lovable AI image gen: `google/gemini-3.1-flash-image-preview`)
- Text style options: **Bold Shock / Curiosity / Emoji Pack / Minimal**
- Live preview grid → choose & download PNG
- Auto-save to `thumbnails` table (history)

### **Phase D — 10 Hook Variants + A/B Test Scheduler** 🎯
- Topic input → Gemini generate ১০টা hook (different angles: shock, question, story, stat, controversy etc.)
- Each hook-এর জন্য predicted score
- **A/B Schedule**: prime time slots (BD: 7-10 PM)-এ ৫টা hook auto-schedule
- `ab_tests` table track করবে কোন hook winner

### **Phase E — Viral Score History Dashboard** 📊
- New `/dashboard` route
- Recharts দিয়ে: viral score over time line chart
- Per-edit version compare (side-by-side: v1 vs v2 vs v3)
- Filter by niche / language / audience
- `viral_history` table store every analysis

### **Phase F — Video Upload + Edit + Download (Tauri ffmpeg bundle)** 🎬
- **Tauri Rust side**: ffmpeg sidecar binary bundle
- Drag-drop local video file
- Apply preset effects (Reels Killer / Duplicate Bypass etc.)
- Process locally via ffmpeg
- Download edited `.mp4`
- **App size will grow ~80MB** (ffmpeg)

---

## Technical Plan

**Database (new tables)**: `thumbnails`, `ab_tests`, `viral_history`, `policy_risk_terms`, `account_login_logs`

**Backend serverFns**:
- `bulk-upload-accounts.functions.ts`
- `account-login.functions.ts` (cookie → UID/PASS fallback)
- `advanced-policy-check.functions.ts`
- `generate-thumbnails.functions.ts`
- `generate-hooks.functions.ts`
- `schedule-ab-test.functions.ts`
- `viral-history.functions.ts`

**Frontend**:
- `AccountUploadView.tsx`, `ThumbnailGeneratorView.tsx`, `HookVariantsView.tsx`, `DashboardView.tsx`, `VideoEditorView.tsx`
- Existing `PolicyCheckView` upgrade

**Tauri (Phase F)**: `src-tauri/Cargo.toml` add `tauri-plugin-shell` + ffmpeg sidecar; `tauri.conf.json` externalBin config

---

## Deployment per phase
প্রতি phase শেষে:
```bash
git tag v0.0.X && git push origin v0.0.X
```
GitHub Actions auto-build → Release-এ নতুন `.exe`।

---

## এখন শুরু করছি: **Phase A (Excel FB Account Upload)**

এটা finish করে আপনাকে test করতে দিব, তারপর Phase B-তে যাবো। OK?