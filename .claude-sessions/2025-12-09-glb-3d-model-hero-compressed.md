# GLB 3D Model Hero Implementation - 2025-12-09

## Context
Continuation of website refresh session. User created a 3D low-poly bust model using Windows Copilot and wanted to replace the depth-mapped photo effect with an actual 3D GLB model. Initially used untextured model with custom materials, then swapped to cell-shaded textured GLB (`me-cellshaded.glb`) that renders with embedded textures.

## Mistakes Are Learnings (Read This First)

**Key mistakes in this session**:
1. **Overwrote GLB textures with custom material**: Initially replaced all materials with custom MeshStandardMaterial → Lost embedded textures → GLB files can contain textures; preserve original materials unless intentionally replacing
2. **MeshPhysicalMaterial with transmission invisible without env map**: Used transmission: 0.95 for glass effect → Model completely invisible → Transmission-based glass requires environment map to show refraction
3. **Deprecated Three.js API**: Used `outputEncoding = THREE.sRGBEncoding` (deprecated in r152+) → Use `outputColorSpace = THREE.SRGBColorSpace` for Three.js 0.164+

**Time wasted**: ~15 minutes iterating on glass material settings that were fundamentally incompatible with no-env-map setup

## Decisions
- **Flat shading with emissive**: Chosen over glass/transmission because it works without environment maps and emphasizes the low-poly aesthetic
- **MeshStandardMaterial over MeshPhysicalMaterial**: Physical material's advanced features (transmission, ior, thickness) require env map to be visible
- **Teal color scheme (0x4db8cc/0x1a6680)**: Matches site's existing teal gradient branding

## Implementation
- Changed `assets/hero.wireframe.js`:
  - Updated import to use `GLTFLoader` from Three.js addons
  - Fixed deprecated `outputEncoding` → `outputColorSpace`
  - Increased lighting intensity (ambient 1.2, key 1.5, fill 1.0) with additional top light
  - Added blue-tinted fill light (0x88ccff) for subtle color variation
  - Applied `flatShading: true` for low-poly look
  - Used emissive material (0x1a6680, intensity 0.5) for visibility without env map
  - Called `geometry.computeVertexNormals()` for proper flat shading

## Lessons
- ✅ `flatShading: true` + emissive gives great low-poly look without env map complexity
- ✅ GLTFLoader works well with import maps for ES module resolution
- ❌ MeshPhysicalMaterial transmission is nearly invisible without environment map
- ❌ Glass/crystal effects in Three.js require env map or careful material tuning
- 💡 When model appears as dark silhouette, lighting isn't reaching faces - try emissive or flip normals
- 💡 For stylized 3D on web, prefer emissive + flat shading over physically accurate materials

## Mistakes & Efficiency Improvements

### Tool Call Failures & Inefficiencies

| Tool | Issue | Better Approach |
|------|-------|-----------------|
| puppeteer_evaluate | Illegal return statement error | Wrap in IIFE: `(function() { return ... })()` |
| puppeteer_evaluate | Variable redeclaration error | Each eval shares context - use unique var names or IIFE |
| Multiple screenshot attempts | Model not loading in time | Use longer wait (3s+) or explicit load detection |

**Wasted tool calls:** 3 screenshot attempts before model visible, 2 failed evaluate calls
**Sequential→Parallel opportunities:** Good - reload + wait done efficiently

### AI Agent Mistakes
1. **Started with transmission-based glass**: Assumed MeshPhysicalMaterial transmission would work like MeshStandardMaterial opacity - it doesn't without env map
2. **Tried clearcoat before emissive**: Clearcoat also depends on reflections; should have gone straight to emissive for guaranteed visibility

### Times AI Correctly Pushed Back
- Identified that puppeteer/headless browser might have WebGL issues and waited appropriately

## Knowledge Gaps
- Missing: Clear documentation on which MeshPhysicalMaterial properties require environment maps
- Missing: Best practices for stylized 3D materials without env maps in Three.js

## .claude Improvements

### REFERENCE.md (detailed technical info)
- [ ] Add to global CLAUDE.md or three-js skill: Three.js material visibility without env map:
  - transmission, clearcoat, metalness all look best with env map
  - For no-env-map scenes: use emissive + low metalness + flatShading
  - outputColorSpace replaces outputEncoding in r152+

## Project Enhancements (Code-Level Work)

### Tech Debt Discovered

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Orphaned depth map assets | `assets/depth-lowpoly.png`, `assets/depth.png` | low | Remove - no longer used with GLB model |
| Old portrait images unused | `assets/me.jpg`, `assets/me-figurine.png`, `assets/me-pixar.png` | low | Keep me-lowpoly.png, consider removing others |

### Feature Ideas
- [ ] **Environment map for true glass effect**: Add simple gradient env map for better reflections - Priority: P2
- [ ] **Dark mode material variant**: Adjust emissive/colors for dark theme - Priority: P2

## Related Sessions
- 2025-12-08-website-refresh-nanobanana: Initial low-poly image generation, CSS 3D tilt (replaced by this)

## Artifacts
- Files modified: `assets/hero.wireframe.js`
- Commands run: Puppeteer navigation/screenshot for testing
- Model used: `assets/me-cellshaded.glb` (cell-shaded textured GLB with embedded textures)
- Previous model: `assets/me-lowpoly.glb` (untextured, used with custom materials)
