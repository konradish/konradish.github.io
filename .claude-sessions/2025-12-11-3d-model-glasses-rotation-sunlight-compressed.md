# 3D Model Glasses Toggle, Rotation & Sunlight - 2025-12-11

## Context
Added interactive features to the 3D GLB hero model: glasses toggle button, slow continuous rotation, and time-based lighting that simulates sun color/intensity throughout the day with blue-shift effect.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **Auto-toggle overriding manual clicks**: Initially implemented auto-glasses removal based on light intensity without tracking manual overrides → Users couldn't keep glasses off during daytime → Added `glassesManualOverride` flag to disable auto-behavior after manual click
2. **Light too dim initially**: Started with intensity curve `0.3-1.0 × 2.5` which was too dark → Required multiple iterations → Should have started with higher baseline values

**Time wasted**: ~2 iterations adjusting light intensity - Could have been prevented by starting with original intensity (2.5) as minimum rather than maximum

## Decisions
- **Manual override disables auto-toggle**: Once user clicks glasses button, auto-removal based on light stops. Respects user intent.
- **Glasses auto-remove at intensity < 1**: Simulates taking off sunglasses at dusk/night (when not manually overridden).
- **Blue-shift during daytime**: Simulates atmospheric scattering - cooler light midday, warmer at sunrise/sunset.
- **Slow rotation speed**: `t * 0.1` radians = ~63 seconds per full rotation. Plus subtle wobble for organic feel.

## Implementation
- Changed `index.html`: Added `.glasses-toggle` button styles and `.hero-container` wrapper around canvas
- Changed `index.html`: Added glasses toggle button with eye icon SVG inside hero container
- Changed `assets/hero.wireframe.js`: Added `getSunLighting()` function for time-based color/intensity
- Changed `assets/hero.wireframe.js`: Track `glassesMeshes[]` array and `glassesVisible` + `glassesManualOverride` flags
- Changed `assets/hero.wireframe.js`: Glasses toggle click handler with mesh name detection (glass/lens/spectacle/eyewear/frame)
- Changed `assets/hero.wireframe.js`: Slow rotation `baseRotation = t * 0.1` with wobble overlay
- Changed `assets/hero.wireframe.js`: Light updates every ~1 second with auto-glasses logic (when not overridden)

### Sun Lighting Algorithm
```javascript
// Time periods:
// 6-8am: Sunrise golden (r:1.0, g:0.7→0.9, b:0.4→0.8)
// 8am-4pm: Blue-shifted daylight (r:0.85-0.95, g:0.95, b:1.0)
// 4-6pm: Sunset orange (r:1.0, g:0.9→0.7, b:0.8→0.4)
// Night: Cool blue moonlight (r:0.6, g:0.7, b:0.9)

// Intensity: cosine curve, noon=peak, midnight=lowest
// Range: 0.5-1.0 × 5.0 = 2.5-5.0 final intensity
// Ambient: 0.6 (boosted from 0.3 for baseline brightness)
```

## Lessons
- ✅ Puppeteer testing caught the auto-toggle bug immediately
- ✅ Mesh name detection with multiple keywords (glass/lens/frame) worked for unknown GLB structure
- ❌ Initial light intensity too conservative - cell-shaded models need more light
- 💡 Always add manual override flag when implementing auto-behavior that affects user-visible state

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| Read | Tried to read GLB binary file (6.6MB) | GLB files can't be read as text - just implement with flexible mesh name detection |
| Navigate | Port 8080 showed Traefik dashboard | Check which port has the actual site before testing |

**Wasted tool calls:** 2 (GLB read attempt, wrong port navigation)
**Sequential→Parallel opportunities:** None significant - work was appropriately sequential

### AI Agent Mistakes
1. **Conservative lighting values**: Started with low intensity assuming dramatic lighting was desired, but cell-shaded model needed more brightness. Should ask user preference first or start brighter.

### User Mistakes (Where AI Should Push Back)
- None - user feedback was accurate about brightness being too dim

### Times AI Correctly Pushed Back
- N/A - straightforward implementation session

## Knowledge Gaps
- **GLB mesh naming conventions**: No standard for how 3D artists name glasses meshes. Used broad keyword matching as workaround.

## .claude Improvements

### REFERENCE.md (detailed technical info)
- [ ] Add to Three.js patterns: Time-based lighting algorithm with blue-shift
- [ ] Add to Three.js patterns: Mesh visibility toggle with manual override pattern

## Project Enhancements (Code-Level Work)

### Tech Debt Discovered
| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Console.log debugging left in | `hero.wireframe.js:152-153, 185` | low | Remove after confirming glasses mesh names |

### Feature Ideas
- [ ] **Time simulation slider**: Let users scrub through 24hr cycle to see lighting changes - Priority: P2
- [ ] **Reset to auto-mode**: Button to re-enable auto-glasses after manual override - Priority: P2

## Related Sessions
- 2025-12-11-mouse-light-source-compressed: Previous session that added mouse-controlled lighting
- 2025-12-09-glb-3d-model-hero-compressed: Initial GLB model integration

## Artifacts
- Files modified: `index.html`, `assets/hero.wireframe.js`
- Files updated (binary): `assets/me-cellshaded.glb` (new mesh from Matt)
