# Resume JSON Generation Setup - 2025-12-08

## Context
Set up resume-cli tooling to generate PDF/HTML from `resume.json` (JSON Resume format). Also professionalized resume content, fixed inaccuracies, and found a working theme after several had rendering issues.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **Tried `resume-cli` first**: Theme resolution broken → Wasted 3-4 tool calls → Use `resumed` CLI instead
2. **npx cache isolation**: `npx resumed` couldn't see local themes → Had to use `./node_modules/.bin/resumed` directly
3. **Theme trial-and-error**: `even` and `flat` themes had text overlap → Test PDF output visually before committing to theme

**Time wasted**: ~10 minutes on resume-cli/npx issues - Could have been prevented by checking resumed docs first

## Decisions
- **CLI choice**: `resumed` over `resume-cli` - better theme resolution with local node_modules
- **Theme**: `kendall` - only theme tested that rendered without text overlap in PDF
- **Dual resume files**: `resume.json` (public/slim) and `private-resume.json` (full details, redacted PII)
- **npm scripts**: Added `resume`, `resume:html`, `resume:pdf` for easy regeneration

## Implementation
- Added `package.json` with resumed, puppeteer, theme dependencies
- Updated `CLAUDE.md` with resume generation commands and theme note
- Professionalized resume content (proper casing, tightened language)
- Fixed accuracy issues:
  - Removed Dagster/Airbyte (evaluated only, SSO blocker)
  - Consent-management: "Architected" → "Led team" (was team lead role)
  - Removed "23 breaking changes" claim (unverifiable)
  - Windows→Linux: focus on performance/zero-downtime, not licensing
  - Nearstar: Fixed dates (2010-09 start) and position progression
  - Removed Helm, Vault, Jenkins from DevOps skills (dated)

## Lessons
- ✅ `resumed` CLI works better than `resume-cli` for local theme usage
- ✅ Keep public resume slim, private resume detailed
- ❌ `even` and `flat` themes have text overlap in PDF
- ❌ npx runs in isolated cache, can't see local node_modules
- 💡 Always verify resume claims are accurate before publishing
- 💡 Test PDF output visually - rendering issues aren't obvious from CLI success

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| Bash | `npx resume-cli export` theme error | Check if resumed is better option first |
| Bash | `npx resumed` couldn't find local theme | Use `./node_modules/.bin/resumed` directly |
| Bash | Multiple theme installs/exports | Could batch: install all themes, test in parallel |

**Wasted tool calls:** 4 calls debugging resume-cli theme resolution
**Sequential→Parallel opportunities:** Theme installs could have been parallel

### AI Agent Mistakes
1. **Didn't question resume claims initially**: Should have asked user to verify accuracy of specific numbers (23 breaking changes, 70% licensing) before committing

### User-Initiated Corrections
- Dagster/Airbyte: User caught this wasn't actually adopted
- Consent-management role: User clarified was team lead, not architect
- 23 breaking changes: User flagged as unverifiable
- Licensing claim: User corrected to performance focus

## Knowledge Gaps
- Missing: Which JSON Resume themes render well for multi-page resumes
- Unclear: resumed vs resume-cli trade-offs documented nowhere

## .claude Improvements

### CLAUDE.md
- [x] Already updated with resume generation commands and theme note

### Project-Specific
- Consider adding `.gitignore` entries for `resume.html`, `resume.pdf` if generated artifacts shouldn't be tracked

## Project Enhancements

### Tech Debt Discovered
| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Unused theme packages | package.json | low | Remove `jsonresume-theme-even`, `jsonresume-theme-flat` |

### Testing Gaps
- [ ] No validation that resume.json matches schema before generation

## Artifacts
- Files modified: `resume.json`, `private-resume.json`, `package.json`, `CLAUDE.md`
- Files created: `resume.html`, `resume.pdf`, `package-lock.json`
- Commits:
  - `b5e124d` - Professionalize resume and add build tooling
  - `aef4da1` - Fix resume accuracy issues
