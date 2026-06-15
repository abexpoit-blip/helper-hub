## কী Build করব (Order অনুযায়ী)

আপনি ৪টা feature চেয়েছেন। আমি **এক phase-এ একটা করে** ship করব, যাতে প্রতিটা ভালোভাবে test করা যায়।

---

### Phase 1 — Facebook Policy Checker (AI Alert) 🛡️
নতুন page `/policy-check`:
- বড় textarea — post content / link / caption paste করবেন
- "Check Now" button → Lovable AI (Gemini) check করবে
- Result card দেখাবে:
  - ✅ Safe / ⚠️ Risky / 🚫 Will be removed
  - কোন rule ভঙ্গ হচ্ছে (spam, misleading, copyright, hate, adult, clickbait, ইত্যাদি)
  - কী fix করতে হবে — suggestion সহ
- Backend: `src/lib/policy-check.functions.ts` (server function, Lovable AI Gateway)

---

### Phase 2 — Direct URL + Excel Bulk Upload 📊
যেখানে এখন shortener আছে, সেটা refactor:
- Shortener call বাদ — সরাসরি URL pass through
- নতুন "Bulk Upload" tab:
  - Excel/CSV file upload (.xlsx, .csv)
  - Auto-parse — columns: `url`, `caption`, `schedule_time` (optional)
  - Preview table → "Process All" button
  - প্রতিটা row Supabase `campaigns` table-এ save হবে
- Library: `xlsx` (SheetJS), already lightweight

---

### Phase 3 — Embed Code Generator 🎬
নতুন page `/embed-generator`:
- Video URL paste (YouTube, FB, Vimeo, TikTok)
- Auto-detect platform → SEO-optimized embed code generate:
  - Responsive `<iframe>` wrapper
  - VideoObject JSON-LD schema (Google ranking)
  - Open Graph meta tags
  - lazy-load attribute
- Copy button + download as `.html`
- AI দিয়ে title/description suggest করতে পারে video URL থেকে

---

### Phase 4 — Premium UI Redesign + App Icon 🎨
- নতুন design system: dark premium theme (deep navy + gold accent, বা আপনি choose করবেন)
- Sidebar redesign, dashboard cards, gradients, shadows
- নতুন app icon generate (Lovable image gen) — Tauri `src-tauri/icons/` update
- Tauri rebuild → নতুন `.exe`

---

## Video Download / Edit সম্পর্কে
আপনি বলেছেন external tool suggest করতে — Phase 1 শেষে আমি একটা **"Tools" page** add করব যেখানে free tools এর link থাকবে:
- **yt-dlp** (YouTube/FB/TikTok download)
- **HandBrake** (video convert)
- **CapCut / DaVinci Resolve** (edit)
- Step-by-step Bangla guide সহ

---

## Deployment
প্রতি phase এর শেষে আপনি commands পাবেন:
```bash
git tag v0.0.X && git push origin v0.0.X
```
Build complete হলে GitHub Releases থেকে নতুন `.exe` download করবেন।

---

**শুরু করব Phase 1 দিয়ে?** Approve করলে আমি এখনই Facebook Policy Checker build করব।
