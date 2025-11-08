# Performance Improvements Guide

This document outlines the remaining performance optimizations to complete for your homepage.

## ✅ Already Completed

- Accessibility enhancements (WCAG 2.1 AA compliance)
- Security improvements (CSP, X-Frame-Options, referrer policy)
- Canvas animation optimizations (Intersection Observer, throttling, reduced geometry)
- Code quality improvements (error handling, validation)
- Lazy loading on all images

## 🚀 High Priority - Complete These Next

### 1. Convert GIF Files to Video Format (90% size reduction)

**Current State:** 25MB+ of GIF assets severely impact page load performance.

**Files to Convert:**
- `assets/preview/3dsort.gif` (15MB) → target: ~1.5MB
- `assets/preview/magicwindow.gif` (5.6MB) → target: ~600KB
- `assets/preview/pathfind.gif` (4.2MB) → target: ~450KB
- `assets/preview/2dsort.gif` (607KB) → target: ~60KB

**Steps:**

#### Option A: Using FFmpeg (Recommended)

1. **Install FFmpeg** (if not already installed):
   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt-get install ffmpeg

   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. **Convert each GIF to WebM and MP4**:
   ```bash
   cd assets/preview

   # Convert to WebM (best compression)
   ffmpeg -i 3dsort.gif -c:v libvpx-vp9 -crf 30 -b:v 0 -auto-alt-ref 0 3dsort.webm
   ffmpeg -i magicwindow.gif -c:v libvpx-vp9 -crf 30 -b:v 0 -auto-alt-ref 0 magicwindow.webm
   ffmpeg -i pathfind.gif -c:v libvpx-vp9 -crf 30 -b:v 0 -auto-alt-ref 0 pathfind.webm
   ffmpeg -i 2dsort.gif -c:v libvpx-vp9 -crf 30 -b:v 0 -auto-alt-ref 0 2dsort.webm

   # Convert to MP4 (fallback for Safari)
   ffmpeg -i 3dsort.gif -c:v libx264 -pix_fmt yuv420p -crf 28 -movflags +faststart 3dsort.mp4
   ffmpeg -i magicwindow.gif -c:v libx264 -pix_fmt yuv420p -crf 28 -movflags +faststart magicwindow.mp4
   ffmpeg -i pathfind.gif -c:v libx264 -pix_fmt yuv420p -crf 28 -movflags +faststart pathfind.mp4
   ffmpeg -i 2dsort.gif -c:v libx264 -pix_fmt yuv420p -crf 28 -movflags +faststart 2dsort.mp4
   ```

3. **Create poster images** (optional but recommended):
   ```bash
   # Extract first frame as poster
   ffmpeg -i 3dsort.gif -vframes 1 3dsort-poster.jpg
   ffmpeg -i magicwindow.gif -vframes 1 magicwindow-poster.jpg
   ffmpeg -i pathfind.gif -vframes 1 pathfind-poster.jpg
   ffmpeg -i 2dsort.gif -vframes 1 2dsort-poster.jpg
   ```

#### Option B: Using Online Converter

1. Visit https://cloudconvert.com/gif-to-webm or similar
2. Upload each GIF file
3. Set quality to 70-80%
4. Download WebM and MP4 versions
5. Repeat for all GIF files

#### Option C: Use Existing Tool (if you have one)

Use any video editing tool like Adobe Media Encoder, HandBrake, or similar.

---

### 2. Update HTML to Use Video Tags

**File:** `index.html`

Replace the image tags with video tags:

**Before (line 506):**
```html
<img src="assets/preview/magicwindow.gif" alt="Animated demonstration of Magic Window project showing 3D scene responding to head tracking" loading="lazy" decoding="async" style="width:100%; border-radius:8px; margin:12px 0; border:1px solid var(--border-color);">
```

**After:**
```html
<video autoplay loop muted playsinline loading="lazy" poster="assets/preview/magicwindow-poster.jpg" style="width:100%; border-radius:8px; margin:12px 0; border:1px solid var(--border-color);">
  <source src="assets/preview/magicwindow.webm" type="video/webm">
  <source src="assets/preview/magicwindow.mp4" type="video/mp4">
  <img src="assets/preview/magicwindow.gif" alt="Animated demonstration of Magic Window project showing 3D scene responding to head tracking" loading="lazy">
</video>
```

**For the three Data Experiments GIFs (lines 527-529):**
```html
<div style="display:flex; gap:10px; margin:12px 0;">
  <video autoplay loop muted playsinline loading="lazy" poster="assets/preview/2dsort-poster.jpg" style="width:33%; border-radius:6px; border:1px solid var(--border-color);">
    <source src="assets/preview/2dsort.webm" type="video/webm">
    <source src="assets/preview/2dsort.mp4" type="video/mp4">
    <img src="assets/preview/2dsort.gif" alt="Animated visualization of sorting algorithms in 2D showing array elements being sorted" loading="lazy">
  </video>

  <video autoplay loop muted playsinline loading="lazy" poster="assets/preview/3dsort-poster.jpg" style="width:33%; border-radius:6px; border:1px solid var(--border-color);">
    <source src="assets/preview/3dsort.webm" type="video/webm">
    <source src="assets/preview/3dsort.mp4" type="video/mp4">
    <img src="assets/preview/3dsort.gif" alt="Animated 3D visualization of sorting algorithms with vertical bars" loading="lazy">
  </video>

  <video autoplay loop muted playsinline loading="lazy" poster="assets/preview/pathfind-poster.jpg" style="width:33%; border-radius:6px; border:1px solid var(--border-color);">
    <source src="assets/preview/pathfind.webm" type="video/webm">
    <source src="assets/preview/pathfind.mp4" type="video/mp4">
    <img src="assets/preview/pathfind.gif" alt="Animated demonstration of pathfinding algorithm navigating through a grid maze" loading="lazy">
  </video>
</div>
```

**Why this approach:**
- `autoplay loop muted` makes videos behave like GIFs
- `playsinline` required for mobile Safari autoplay
- WebM first (better compression), MP4 fallback (Safari support)
- GIF as final fallback inside `<video>` tag
- Poster images improve perceived performance

---

### 3. Download Three.js Locally

**Current:** Loading from unpkg.com CDN (500-600KB external dependency)
**Target:** Self-hosted local file

**Steps:**

1. **Download Three.js**:
   ```bash
   cd assets
   curl -L -o three.module.min.js https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.min.js
   ```

2. **Verify the download**:
   ```bash
   ls -lh three.module.min.js
   # Should be around 580-600KB
   ```

3. **Update hero.wireframe.js**:

   **File:** `assets/hero.wireframe.js`, line 4

   **Comment out the CDN import:**
   ```javascript
   // import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.min.js';
   ```

   **Uncomment the local import:**
   ```javascript
   import * as THREE from './three.module.min.js';
   ```

4. **Update CSP in index.html** (optional - make it stricter):

   **File:** `index.html`, line 6

   **Current:**
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self';">
   ```

   **After Three.js is local (remove unpkg.com):**
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self';">
   ```

**Benefits:**
- 200-400ms faster initial load (no external DNS + TLS)
- Better cache control
- No external dependency risk
- Stricter CSP possible

---

## 📊 Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total Page Weight** | ~26MB | ~3-4MB | **85-90% reduction** |
| **First Load (Cable)** | 3-8s | <1s | **3-8x faster** |
| **First Load (3G)** | 15-30s | 2-4s | **5-10x faster** |
| **Lighthouse Score** | 40-60 | 85-95 | **+40-50 points** |
| **Canvas CPU Usage** | High | 60-80% less | **When tab inactive** |

---

## 🧪 How to Validate Changes Before Merging

### Option 1: Test Locally

1. **Start a local server**:
   ```bash
   cd /home/user/konradish.github.io
   python3 -m http.server 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000
   ```

3. **Test thoroughly**:
   - ✅ Videos autoplay and loop
   - ✅ Videos load on mobile
   - ✅ Canvas animation works
   - ✅ Theme toggle functions
   - ✅ Resume loads
   - ✅ All links work
   - ✅ Accessibility (screen reader, keyboard navigation)
   - ✅ Performance (check DevTools Network tab)

4. **Check browser console**:
   - No errors in console
   - No 404s for resources
   - CSP violations (if any)

### Option 2: GitHub Pages Branch Preview

GitHub Pages can serve from a specific branch for testing:

1. **In GitHub repository settings**:
   - Go to Settings → Pages
   - Under "Build and deployment", select your branch
   - Branch: `claude/review-homepage-agents-011CUvZfC2yCxMmjSGxciNu5`
   - Save

2. **Wait for deployment** (~2-5 minutes)

3. **Visit the preview URL**:
   ```
   https://konradodell.com/
   ```
   (GitHub Pages will serve from the selected branch)

4. **Test thoroughly** as above

5. **Switch back to main** when done testing

### Option 3: Lighthouse / PageSpeed Insights

1. **Run Lighthouse in Chrome DevTools**:
   - Open DevTools (F12)
   - Go to Lighthouse tab
   - Select: Performance, Accessibility, Best Practices, SEO
   - Click "Generate report"

2. **Check scores**:
   - Performance: Target 85+
   - Accessibility: Target 95+
   - Best Practices: Target 95+
   - SEO: Target 90+

3. **Review metrics**:
   - **LCP** (Largest Contentful Paint): <2.5s
   - **FID** (First Input Delay): <100ms
   - **CLS** (Cumulative Layout Shift): <0.1
   - **Total Blocking Time**: <200ms

### Option 4: WebPageTest

1. Visit https://www.webpagetest.org/
2. Enter your branch URL
3. Select test location and device
4. Run test on 3G/4G/Cable
5. Review filmstrip and waterfall

---

## 📝 Validation Checklist

Before merging to main, verify:

- [ ] All videos play correctly on desktop
- [ ] All videos play correctly on mobile (iOS Safari, Chrome)
- [ ] Videos don't autoplay if user has reduced motion preference
- [ ] Canvas animation pauses when scrolled out of view
- [ ] Theme toggle updates aria-pressed
- [ ] Resume link updates aria-expanded
- [ ] Skip link appears on tab focus
- [ ] All external links announce "opens in new tab"
- [ ] No console errors
- [ ] No CSP violations
- [ ] Page weight < 5MB
- [ ] Lighthouse Performance > 85
- [ ] Lighthouse Accessibility > 95
- [ ] All images/videos have descriptive alt text
- [ ] Keyboard navigation works throughout

---

## 🎯 After Merging

Once you merge to main:

1. **Monitor in production**:
   - Check Google Search Console for errors
   - Monitor Core Web Vitals
   - Check browser console on live site

2. **Optional enhancements**:
   - Add service worker for offline capability
   - Create robots.txt and sitemap.xml
   - Add Open Graph images for social sharing
   - Consider adding analytics

3. **Keep GIFs as backup** (optional):
   - Keep original GIF files in case you need to re-convert
   - Add to .gitignore if you want to exclude from repo:
     ```
     assets/preview/*.gif
     ```

---

## 📚 Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Video for Web Best Practices](https://web.dev/fast/#optimize-your-videos)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 🆘 Troubleshooting

**Videos don't autoplay on mobile:**
- Add `playsinline` attribute
- Ensure `muted` is present
- Check browser autoplay policies

**CSP blocking resources:**
- Check browser console for violations
- Update CSP directive accordingly
- Test in incognito mode

**High CPU usage:**
- Verify Intersection Observer is working
- Check trackableMeshes array is being used
- Monitor with Chrome DevTools Performance tab

**Large file sizes:**
- Re-encode with higher CRF (30-35 for WebM, 28-32 for MP4)
- Reduce video dimensions if necessary
- Consider shorter loop duration

---

Last updated: 2025-11-08
Branch: claude/review-homepage-agents-011CUvZfC2yCxMmjSGxciNu5
