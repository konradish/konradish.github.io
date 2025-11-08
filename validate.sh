#!/bin/bash

# Homepage Validation Script
# Run this before merging your branch to main

set -e

echo "🔍 Homepage Validation Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "📁 File Structure Checks"
echo "------------------------"

# Check if required files exist
if [ -f "index.html" ]; then
    pass "index.html exists"
else
    fail "index.html not found"
fi

if [ -f "assets/hero.wireframe.js" ]; then
    pass "assets/hero.wireframe.js exists"
else
    fail "assets/hero.wireframe.js not found"
fi

if [ -f "resume.json" ]; then
    pass "resume.json exists"
else
    fail "resume.json not found"
fi

echo ""
echo "🎥 Video/GIF Asset Checks"
echo "------------------------"

# Check for video conversions
VIDEO_COUNT=$(find assets/preview -name "*.webm" 2>/dev/null | wc -l)
if [ "$VIDEO_COUNT" -gt 0 ]; then
    pass "Found $VIDEO_COUNT WebM video files"
else
    warn "No WebM videos found - GIFs not yet converted (25MB+ page weight)"
fi

MP4_COUNT=$(find assets/preview -name "*.mp4" 2>/dev/null | wc -l)
if [ "$MP4_COUNT" -gt 0 ]; then
    pass "Found $MP4_COUNT MP4 video files"
else
    warn "No MP4 videos found - consider adding for Safari compatibility"
fi

# Check GIF sizes
if [ -f "assets/preview/3dsort.gif" ]; then
    SIZE=$(du -h assets/preview/3dsort.gif | cut -f1)
    warn "3dsort.gif still present ($SIZE) - convert to video for 90% size reduction"
fi

echo ""
echo "📦 Dependency Checks"
echo "-------------------"

# Check if Three.js is local
if [ -f "assets/three.module.min.js" ]; then
    SIZE=$(du -h assets/three.module.min.js | cut -f1)
    pass "Three.js downloaded locally ($SIZE)"

    # Check if it's being used
    if grep -q "import.*'./three.module.min.js'" assets/hero.wireframe.js; then
        pass "hero.wireframe.js using local Three.js"
    else
        warn "hero.wireframe.js still using CDN - update import statement"
    fi
else
    warn "Three.js not downloaded locally - still using CDN"
fi

echo ""
echo "♿ Accessibility Checks"
echo "---------------------"

# Check for accessibility features
if grep -q '<main' index.html; then
    pass "Main landmark element present"
else
    fail "Missing <main> landmark element"
fi

if grep -q 'Skip to main content' index.html; then
    pass "Skip navigation link present"
else
    fail "Missing skip navigation link"
fi

if grep -q 'aria-pressed' index.html; then
    pass "Theme toggle has aria-pressed"
else
    fail "Theme toggle missing aria-pressed"
fi

if grep -q 'aria-expanded' index.html; then
    pass "Resume link has aria-expanded"
else
    fail "Resume link missing aria-expanded"
fi

if grep -q 'aria-hidden="true"' index.html; then
    pass "Decorative SVGs have aria-hidden"
else
    fail "SVG icons missing aria-hidden"
fi

if grep -q 'loading="lazy"' index.html; then
    pass "Images have lazy loading"
else
    fail "Images missing lazy loading"
fi

echo ""
echo "🔒 Security Checks"
echo "-----------------"

if grep -q 'Content-Security-Policy' index.html; then
    pass "Content Security Policy present"
else
    fail "Missing Content Security Policy"
fi

if grep -q 'X-Frame-Options' index.html; then
    pass "X-Frame-Options present"
else
    fail "Missing X-Frame-Options"
fi

if grep -q 'safeLocalStorage' index.html; then
    pass "Safe localStorage implementation"
else
    fail "Missing safe localStorage wrapper"
fi

echo ""
echo "⚡ Performance Checks"
echo "--------------------"

if grep -q 'IntersectionObserver' assets/hero.wireframe.js; then
    pass "Canvas uses Intersection Observer"
else
    fail "Canvas missing Intersection Observer"
fi

if grep -q 'mouseUpdateScheduled' assets/hero.wireframe.js; then
    pass "Mouse events are throttled"
else
    fail "Mouse events not throttled"
fi

if grep -q 'trackableMeshes' assets/hero.wireframe.js; then
    pass "Mesh references cached"
else
    fail "Missing mesh cache optimization"
fi

# Check geometry segments
if grep -q 'detail = pixelRatio > 1.5 ? 64 : 48' assets/hero.wireframe.js; then
    pass "Geometry complexity reduced"
else
    warn "Geometry might not be optimized"
fi

echo ""
echo "🧪 Code Quality Checks"
echo "---------------------"

if grep -q 'validateResumeData' index.html; then
    pass "Resume data validation present"
else
    fail "Missing resume data validation"
fi

if grep -q 'console.error' index.html; then
    pass "Error logging implemented"
else
    warn "Limited error logging"
fi

if grep -q 'scrollBehavior.*in.*document.documentElement.style' index.html; then
    pass "Smooth scroll feature detection"
else
    fail "Missing smooth scroll feature detection"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ Validation failed - fix errors before merging${NC}"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with warnings - consider addressing them${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed - ready to merge!${NC}"
    exit 0
fi
