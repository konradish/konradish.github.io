# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run Commands

- **Serve locally**: Use `python -m http.server` or any simple HTTP server
- **Deploy**: Push changes to the main branch for GitHub Pages deployment
- **Validation**: Use the W3C validator (https://validator.w3.org/) for HTML validation

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