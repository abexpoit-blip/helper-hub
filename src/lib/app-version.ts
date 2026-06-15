// Current desktop app version — bump this BEFORE you push a new git tag.
// Must match the tag (without the leading "v"). Example: tag "v0.0.8" -> "0.0.8".
export const APP_VERSION = "0.0.8";

// GitHub repo that hosts the .exe releases (owner/repo).
// Override at build time with VITE_GITHUB_REPO if your repo name differs.
export const GITHUB_REPO =
  (import.meta.env.VITE_GITHUB_REPO as string | undefined) ??
  "abexpoit-blip/helper-hub";
