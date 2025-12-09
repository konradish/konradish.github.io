# Website Refresh with Nano Banana AI Portraits - 2025-12-08

## Context
User requested review of personal portfolio website, identified "cheesiness" in the Three.js depth-mapped photo effect. Goal: replace with AI-generated stylized portrait using Nano Banana (Gemini 2.5 Flash Image), update project showcase from CEI to prompt-kit, and implement lighter-weight 3D effect.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **Port conflict with Traefik**: Tried localhost:8080 without checking → Screenshot showed wrong page → Should check ports in use first or use non-standard ports (8888+)
2. **Sort command with tab delimiter**: Used `$'\t'` which failed on WSL → Minor delay → Use jq for structured output instead
3. **GitHub repo list sorting**: First attempt failed due to bash quoting → Had to retry → Use jq directly for JSON processing

**Time wasted**: ~2 minutes on port conflict - Could have been prevented by using port 9000+ or checking `netstat` first

## Decisions
- **Low-poly portrait style**: Chosen over Pixar/figurine for "tech aesthetic" alignment with site's teal/blue color scheme
- **CSS 3D tilt effect**: Replaced Three.js WebGL with pure CSS transforms - much lighter weight, no external dependencies
- **Removed Three.js/unpkg.com**: CSP simplified, faster page load, no third-party scripts
- **prompt-kit over CEI**: User preference - prompt-kit has broader utility (LLM templates, HTK workflow)

## Implementation
- Changed `index.html`:
  - Removed Three.js canvas, depth map preloads, unpkg.com CSP
  - Added `.hero-portrait` CSS with perspective 3D transforms
  - Added mouse-tracking JS (60fps RAF loop with easing)
  - Replaced CEI project card with prompt-kit
- Generated `assets/me-figurine.png`: Pop Mart style (kept as option)
- Generated `assets/me-pixar.png`: Disney/Pixar style (kept as option)
- Generated `assets/me-lowpoly.png`: Low-poly geometric (selected for use)

## Lessons
- ✅ `uvx gemimg` works seamlessly for Nano Banana image generation from CLI
- ✅ CSS 3D transforms with perspective provide good visual effect without WebGL overhead
- ❌ Bash sort with tab delimiter is fragile - use jq for JSON processing
- 💡 Nano Banana prompt structure: "Transform this person into [style]. Keep distinctive features ([specifics]). [Environment/lighting]."

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| Bash | `sort -t$'\t'` failed | Use `jq` to sort JSON directly |
| Bash | localhost:8080 showed Traefik | Use port 8888+ or check ports first |
| Bash | `gh repo view --json readme` invalid | Check `gh repo view --help` for valid fields |

**Wasted tool calls:** 3 (sort failure, port conflict, gh readme field)
**Sequential→Parallel opportunities:** Good parallel usage (gh repo list + index.html read + glob)

### AI Agent Mistakes
1. **Assumed llm CLI had nanobanana**: Initially looked for "nanobanana" model - it's called Gemini 2.5 Flash Image, accessed via `gemimg` wrapper

### Times AI Correctly Pushed Back
- Identified low-poly as best match for site aesthetic when user asked for options

## Knowledge Gaps
- Missing: Documentation on available gemimg options (discovered via `--help`)
- Unclear: Which ports are commonly in use on user's system

## .claude Improvements

### REFERENCE.md (detailed technical info)
- [ ] Add to global CLAUDE.md or infra REFERENCE: Common port conflicts - Traefik uses 8080, use 8888+ for dev servers

### Commands (workflows someone would run)
- [ ] Create command: `ai/portrait` - Generate stylized portraits with gemimg presets

## Project Enhancements (Code-Level Work)

### Tech Debt Discovered

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Unused assets | `assets/me.jpg`, `assets/depth.png` | low | Remove if not needed elsewhere |
| hero.wireframe.js orphaned | `assets/hero.wireframe.js` | low | Delete - no longer used |

### Feature Ideas
- [ ] **Dark mode portrait variant**: Generate separate portrait for dark/light themes - Priority: P2

## Related Sessions
- 2025-12-08-resume-json-generation: Same project, resume tooling

## Artifacts
- Files modified: `index.html`
- Files created: `assets/me-figurine.png`, `assets/me-pixar.png`, `assets/me-lowpoly.png`
- Commands run: `uvx gemimg "..." -i assets/me.jpg -o assets/me-*.png`
