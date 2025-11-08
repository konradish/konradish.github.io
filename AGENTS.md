# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the only rendered page; it hosts all markup, styling, and JS for the theme toggle, so keep new sections modular (wrap in `<section class="...">`) and reuse CSS variables.
- `assets/` stores media and derived files; images such as `assets/me.jpg` and `assets/depth.png` load above the fold, so compress new assets (<200 KB) and mirror favicon sizes under `assets/favicon/`.
- `resume.json` is the public résumé feed, while `private-resume.json` can include redacted fields for manual outreach—do not reference it from the UI or commit secrets inside it.
- Root files `CNAME`, `favicon.svg`, `favicon.ico`, and `README.md` must remain at the top level for GitHub Pages to respect custom domains and favicons.

## Build, Test, and Development Commands
- `python3 -m http.server 4000` – serves the site locally; visit `http://localhost:4000` to verify layout, fonts, and dark/light theming.
- `npx serve . --listen 4173` – alternative static file server that matches GitHub Pages’ MIME handling when testing new assets.
- `npx prettier@3.3.3 --check index.html` – quick style check to ensure spacing stays two spaces and attribute order matches existing conventions.

## Coding Style & Naming Conventions
- Use two-space indentation inside HTML, and group CSS rules by component (layout, typography, interactions) with blank lines separating each block.
- Prefer inline `<style>` updates over external stylesheets to keep the single-page footprint; new CSS variables should start with `--` plus the section (e.g., `--cards-shadow`).
- Class names follow a descriptive, kebab-case pattern (`.theme-toggle`, `.project-card`); avoid camelCase or utility abbreviations.

## Testing Guidelines
- There are no automated tests; rely on manual verification in current Chromium and Safari engines plus one mobile viewport (use DevTools device emulation).
- Toggle between dark/light modes and ensure above-the-fold images preload without layout shift; check console for 404s whenever adding assets.
- Run `npx html-validate@9 index.html` before shipping structural changes to catch malformed nesting or duplicate IDs.

## Commit & Pull Request Guidelines
- Follow the repo history: short, imperative commit subjects (e.g., “Update favicon to neon-cyan KO monogram”) with optional one-line bodies for rationale.
- Group unrelated changes into separate commits to keep GitHub Pages deploy diffs readable.
- PRs should describe the visual delta, list testing steps (commands above), and attach before/after screenshots or screencasts for UI updates.

## Configuration & Deployment Notes
- GitHub Pages deploys from `main`; pushing triggers an automatic build, so verify `CNAME` still points to `konradodell.com` after force pushes.
- Never expose sensitive résumé data from `private-resume.json`; if you must sync it, encrypt out-of-band.
