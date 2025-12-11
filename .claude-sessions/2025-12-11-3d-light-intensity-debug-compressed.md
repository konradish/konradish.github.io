# 3D Model Light Intensity Debugging & Tuning - 2025-12-11

## Context
User reported 3D model light intensity wasn't visibly changing. Added debug slider to test values, tuned time-based lighting curve, fixed glasses auto-toggle behavior, and improved moonlight color to silvery appearance.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **Glasses threshold used old intensity value (1) after scaling to 20x**: Original code checked `intensity >= 1` but after 4x scale increase, minimum intensity was 10 → Glasses never auto-toggled → Changed to time-based check (`hours >= 6 && hours < 18`)
2. **Glasses toggle immediately overridden by animation loop**: Toggle worked but next frame's time check reset it → Toggling felt broken → Added `lastShouldHaveGlasses` to only trigger on sunrise/sunset transitions
3. **Initial glasses state not set on page load**: `glassesVisible` defaulted to `true` regardless of time → Glasses showed at night on first load → Initialize from `getSunLighting().hours`

**Time wasted**: ~5 minutes iterating on glasses threshold - Could have been prevented by checking the intensity scale factor when changing the threshold logic.

## Decisions
- **Light intensity scale: 20.0x** (was 5.0x). Tested with slider 0-50, found 20 provided good dynamic range.
- **Glasses toggle on time, not intensity**: Hours 6-18 = daytime = glasses on. More intuitive than arbitrary intensity threshold.
- **Moonlight color: (0.85, 0.88, 0.95)**: Silvery white with subtle cool tint, replacing blue-ish (0.6, 0.7, 0.9).
- **Transition-based glasses toggle**: Only auto-toggle at sunrise/sunset boundaries, not every frame. Allows manual toggle between transitions.

## Implementation
- Changed `assets/hero.wireframe.js`:
  - Added debug slider (later removed) for testing intensity 0-50
  - Added debug time simulation (24h in 60s) with overlay display (later removed)
  - Changed intensity multiplier from 5.0 to 20.0
  - Changed glasses toggle from intensity-based to time-based (6am-6pm)
  - Added `lastShouldHaveGlasses` state tracking for transition detection
  - Initialize `glassesVisible` from current time on load
  - Changed night light color to silvery moonlight
- Changed `index.html`:
  - Added CSS for debug slider (later removed)
  - Added debug slider HTML (later removed)

## Lessons
- ✅ Debug slider approach effective for rapid iteration on visual parameters
- ✅ Time simulation (24h → 60s) excellent for testing time-dependent features
- ❌ Threshold checks must be updated when scaling underlying values
- 💡 State machines (lastState !== currentState) prevent rapid toggle conflicts

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies
| Tool | Issue | Better Approach |
|------|-------|-----------------|
| N/A | All tool calls successful | - |

**Wasted tool calls:** 0
**Sequential→Parallel opportunities:** 0 (edits were dependent)

### AI Agent Mistakes
1. **Didn't immediately check threshold when increasing scale**: When changing from 5x to 20x intensity, should have searched for all intensity comparisons.

### User Mistakes (Where AI Should Push Back)
None - user feedback was accurate and helpful.

### Times AI Correctly Pushed Back
- Suggested adding debug display to diagnose glasses mesh count issue.

## Knowledge Gaps
- Three.js PointLight intensity units not well documented (arbitrary, depends on scene scale)

## .claude Improvements

### CLAUDE.md
- No changes needed (under 200 lines, no universal patterns discovered)

## Project Enhancements (Code-Level Work)

### Tech Debt Discovered
None - code is clean after removing debug elements.

### Feature Ideas
- [ ] **User timezone detection**: Currently uses browser local time. Could detect and display timezone in debug mode. Priority: P2

### Refactoring Opportunities
None identified.

### Testing Gaps
- [ ] Time-based lighting: No automated tests for sunrise/sunset transitions

## Related Sessions
- 2025-12-11-3d-model-glasses-rotation-sunlight-compressed: Previous session added time-based lighting
- 2025-12-11-mouse-light-source-compressed: Added mouse-controlled lighting

## Artifacts
- Files modified: `assets/hero.wireframe.js`, `index.html`
- Debug features added then removed: intensity slider, time simulation display
- Final values: intensity 20x scale, moonlight RGB (0.85, 0.88, 0.95), glasses 6am-6pm
