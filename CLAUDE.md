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