# AI Workflow Positioning Retrofit - 2025-12-11

## Context
Retrofitted konradodell.com to reposition from "Software Architect" to "AI Workflow Innovator". Restructured projects section to feature prompt-kit as flagship, added Mind->Music teaser, and implemented "Built with AI" footer. Goal: Show don't tell—demonstrate AI-assisted development through the site itself.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **None significant**: Session was efficient—clear plan from user, straightforward edits
2. **Minor**: BashOutput tool called with `block` parameter that doesn't exist → Quick recovery

**Time wasted**: Minimal (<1 min on BashOutput parameter error)

## Decisions
- **Hero copy**: Chose blend of Option B (show-don't-tell) + practical emphasis. "I build AI-assisted workflows that actually ship" positions as practitioner, not theorist.
- **prompt-kit prominence**: Full-width card at top of Featured Projects. Expanded description emphasizes "This is how I build software now."
- **Mind->Music**: Teaser only (Coming Soon) since project not public-ready. Positioned as brain-computer interface exploration.
- **Data Experiments demotion**: Moved to separate "Other Work" section—less relevant to AI positioning.
- **Footer meta-element**: Subtle "Built with Claude Code · See the workflow" reinforces positioning without being heavy-handed.

## Implementation
- Changed `index.html`: Title "software architect" → "AI workflow innovator"
- Changed `index.html`: Subtitle "Software Architect & Tech Enthusiast" → "AI Workflow Innovator"
- Changed `index.html`: About section copy—new positioning statement (2 sentences vs 3)
- Restructured projects: prompt-kit first (full-width via `grid-column: 1 / -1`), Mind->Music teaser, Magic Window retained, Data Experiments demoted
- Added footer with Claude Code attribution and prompt-kit workflow link

## Lessons
- ✅ Research phase paid off: simonwillison.net (practitioner-documenter) and swyx.io (direct positioning + format diversity) provided clear structural patterns
- ✅ Parallel web fetches for reference site research—efficient
- ✅ Using puppeteer for visual verification caught any layout issues immediately
- ✅ Mobile responsive check confirmed grid system handles full-width override correctly
- 💡 "Show don't tell" applies to portfolio sites: the 3D portrait and interactive elements demonstrate capability better than claims

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| BashOutput | Called with `block` parameter that doesn't exist | Check tool schema—parameter is not available |

**Wasted tool calls:** 1 (BashOutput with wrong param)
**Sequential→Parallel opportunities:** None missed—web fetches were parallel
**Wrong tool selections:** None

### AI Agent Mistakes
1. **BashOutput schema assumption**: Assumed `block` parameter existed based on similar tools → Should verify tool signature

### User Mistakes (Where AI Should Push Back)
- None—user provided comprehensive plan document with clear HTKs

### Times AI Correctly Pushed Back
- N/A—no push-back needed, plan was solid

## Knowledge Gaps
- None discovered—straightforward HTML/CSS edits

## .claude Improvements

### Routing Decision
No significant improvements needed—session was efficient and plan-driven.

### Skills
- [ ] None needed

### Commands
- [ ] None needed

### REFERENCE.md
- [ ] None needed

### CLAUDE.md
- [ ] None needed

## Project Enhancements (Code-Level Work)

### Tech Debt Discovered
| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Inline styles on project cards | `index.html` lines 585, 618 | low | Move to CSS classes |

### Feature Ideas
- [ ] **Mind->Music screenshot/GIF**: Add visual when project is presentable - Priority: P2
  - Files affected: `index.html`, `assets/preview/`
  - Complexity: small
- [ ] **Workflow documentation page**: Dedicated page explaining HTK methodology linked from footer - Priority: P2
  - Files affected: new `workflow.html` or link to prompt-kit docs
  - Complexity: medium

### Refactoring Opportunities
- [ ] **CSS extraction for project cards**: Current inline `grid-column: 1 / -1` and section styles → Dedicated CSS classes
  - Motivation: Cleaner HTML, easier maintenance
  - Approach: Add `.project--featured`, `.section--secondary` classes

### Testing Gaps
- [ ] No automated testing exists for this static site (expected for portfolio)

## Related Sessions
- 2025-12-09-glb-3d-model-hero: 3D portrait implementation this session preserves
- 2025-12-08-website-refresh-nanobanana: Previous site refresh this builds upon

## Artifacts
- Files modified: `index.html` (42 insertions, 24 deletions)
- Commands run: git diff, puppeteer navigation/screenshots
- Tests added: N/A (visual verification via puppeteer)
