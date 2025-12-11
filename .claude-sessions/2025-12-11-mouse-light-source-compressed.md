# Mouse Light Source for 3D Hero - 2025-12-11

## Context
User requested changing 3D model interaction from mouse-driven rotation to mouse-controlled lighting. The model should stay stationary while the mouse acts as a dynamic light source illuminating the scene.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**: None significant - session was straightforward.

**Time wasted**: Minimal. Initial Glob search for `*.html` returned too many results from node_modules/venv. Could have used more specific path.

## Decisions
- **Replace multi-light setup with single point light**: Simplifies code while creating more dramatic effect. Point light follows mouse position in 3D space.
- **Lower ambient light intensity**: Reduced from 1.2 to 0.3 to make mouse-controlled light more impactful.
- **Keep subtle fill light**: Blue-tinted directional light from below/behind prevents total darkness when mouse is at edges.

## Implementation
- Changed `assets/hero.wireframe.js`:
  - Removed 4 directional lights (key, fill, rim, top)
  - Added `mouseLight` PointLight (intensity 2.5, range 10)
  - Reduced AmbientLight from 1.2 to 0.3
  - Added subtle blue fill light (0x4488cc, 0.4) from below
  - Removed mouse-based rotation (`mouse.x * 0.3`, `mouse.y * 0.15`)
  - Added mouseLight position tracking in animation loop:
    ```javascript
    mouseLight.position.x = mouse.x * 2.5;
    mouseLight.position.y = mouse.y * 2.0;
    mouseLight.position.z = 2.5;
    ```

## Lessons
- PointLight with mouse tracking creates natural "flashlight" effect
- Lower ambient + dynamic point light = more dramatic lighting contrast
- Keeping subtle fill light prevents model from going completely dark at screen edges

## Tool Call Efficiency

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| Glob | `**/*.{html,js}` returned too many node_modules results | Use `path` parameter to limit to root |

**Sequential→Parallel opportunities:** Git status, diff, and log were run in parallel - good.

## Related Sessions
- 2025-12-09-glb-3d-model-hero-compressed: Previous 3D model work

## Artifacts
- Files modified: `assets/hero.wireframe.js`
- Lighting changed from: 4 directional lights → 1 point light + 1 fill
- Model interaction: rotation tracking → stationary with light tracking
