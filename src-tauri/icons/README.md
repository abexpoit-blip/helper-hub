# Icons folder

GitHub Actions workflow auto-generates icons from a source PNG.

**To customize:**
1. Drop a 1024x1024 PNG named `app-icon.png` in repo root
2. Workflow runs `tauri icon app-icon.png` automatically and creates:
   - icon.ico (Windows)
   - icon.icns (macOS)
   - 32x32.png, 128x128.png, 128x128@2x.png

If no `app-icon.png` exists, a default placeholder icon is generated.
