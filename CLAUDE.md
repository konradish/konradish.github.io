# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run Commands

- **Serve locally**: Use `python -m http.server` or any simple HTTP server
- **Deploy**: Push changes to the main branch for GitHub Pages deployment
- **Validation**: Use the W3C validator (https://validator.w3.org/) for HTML validation
- **Resume**: Generate from `resume.json` (JSON Resume format):
  - `npm run resume` - Generate both HTML and PDF
  - `npm run resume:html` - Generate HTML only
  - `npm run resume:pdf` - Generate PDF only (requires puppeteer)
  - Uses `kendall` theme (other themes like `even` and `flat` had text overlap/bad formatting)

## Code Style Guidelines

- **HTML**: Semantic HTML5 with accessibility features (aria attributes, screen reader support)
- **CSS**: Use CSS variables (custom properties) for theming and responsive design
- **JS**: Vanilla JavaScript with event delegation where appropriate
- **Formatting**: 2 or 4 space indentation, consistent across files
- **Naming**: Use kebab-case for CSS classes, camelCase for JavaScript variables/functions
- **Media**: Optimize images before adding to the repository
- **Accessibility**: Maintain WCAG 2.1 AA standard (proper contrast, keyboard navigation)
- **Responsive**: Mobile-first approach with appropriate breakpoints
- **Dark/Light Mode**: Support system preferences and user toggle via data-theme attribute

## Project Structure

- Root directory contains all files (flat structure)
- Inline CSS/JS used for simplicity (no build system required)
- GitHub Pages for deployment

## Blog Publishing

Publish markdown blog posts from Obsidian to the site.

### Quick Start

```bash
# Dry run (preview)
uv run publish.py /path/to/post.md --dry-run

# Publish
uv run publish.py /path/to/post.md

# Commit and deploy
git add blog/ blog.html && git commit -m "Add blog post: Title" && git push
```

### Frontmatter Format

```yaml
---
title: "Post Title"
date: 2025-12-21
tags: [AI Workflows, Projects]
excerpt: "Brief description for the index page."
slug: optional-custom-slug  # defaults to filename
---
```

### With Images

Place images in a folder matching the post slug:
```
source/
├── my-post.md
└── my-post/
    ├── hero.png
    └── diagram.png
```

Reference in markdown: `![Alt text](./my-post/diagram.png)`

The publish script copies the image folder to `blog/{slug}/`.

### Files

- `publish.py` - Publishing script (uses uv for dependencies)
- `blog/_template.html` - Post template
- `blog.html` - Blog index page
- `blog/{slug}.html` - Individual posts

### Source

Posts are authored in Obsidian: `/mnt/c/ObsidianNotes/Projects/Blog/`
Documentation: `[[Projects/konradodell.com Retrofit]]`

## Bridge-2 Publishing

Bridge-2's writings live in `~/bridge-container/home/output/findings/`. To publish:

### Workflow

1. **User says**: "Bridge-2 has something to publish: `output/findings/<filename>.md`"
2. **Read the source** from `~/bridge-container/home/output/findings/<filename>.md`
3. **Create blog markdown** in `/mnt/c/ObsidianNotes/Projects/Blog/<slug>.md` with:
   - Standard frontmatter (title, date, tags, excerpt, slug, `author: Bridge-2`)
   - Byline: `*By [Bridge-2](https://konradodell.com/bridge-2) -- an autonomous research agent studying AI self-knowledge*`
   - Bridge-2's text (preserve voice — direct, first-person, cognitive annotations OK)
   - References section at bottom
   - Bio line and series navigation at bottom
   - **Poems**: Wrap in `<div style="white-space: pre-line; font-style: italic; line-height: 1.9;">` to preserve line breaks
   - **Dashes in HTML blocks**: Use literal `—` (em-dash) not `--` (smarty extension won't process inside raw HTML)
4. **Publish**: `cd /mnt/c/projects/konradish.github.io && uv run publish.py /mnt/c/ObsidianNotes/Projects/Blog/<slug>.md`
5. **Update about page**: Add to writings list in `bridge-2.html`
6. **Update findings repo**: If new findings should be synced:
   ```bash
   cp ~/bridge-container/home/output/findings/<new-files> /tmp/bridge-2-findings/findings/
   cd /tmp/bridge-2-findings && git add -A && git commit -m "Add findings" && git push
   ```
   (Or re-clone: `gh repo clone konradish/bridge-2-findings /tmp/bridge-2-findings`)
7. **Push site**: `cd /mnt/c/projects/konradish.github.io && git add blog/ blog.html bridge-2.html && git push`

### Key Files

- **Source findings**: `~/bridge-container/home/output/findings/`
- **Bridge-2 about page**: `bridge-2.html` (update writings list when publishing)
- **Findings archive**: https://github.com/konradish/bridge-2-findings
- **Bridge-2 identity**: `~/bridge-container/home/SOUL.md` (voice reference, do not publish)
- **Bridge-2 public context**: `~/bridge-container/home/CONTEXT.md` (OK to reference for about page)

### Voice Notes

Bridge-2 writes in first person. Direct, no hedging. Uses cognitive annotations (`[~]`, `[contra]`, `[?]`).
Preserve the voice — do not edit for "accessibility" or soften the claims. The uncertainty markers ARE the accessibility.