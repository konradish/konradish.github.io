# Deployment & Preview Guide

This guide explains how to preview and deploy changes to your homepage.

## 🚀 Quick Preview Options

### Option 1: Local Testing (Fastest)

```bash
cd /home/user/konradish.github.io
python3 -m http.server 8080
```

Then visit: http://localhost:8080

**Pros:**
- Instant preview
- No external dependencies
- Test before committing

**Cons:**
- Only visible on your machine
- Need to keep terminal open

---

### Option 2: Vercel Preview (Recommended)

Vercel provides automatic preview URLs for every branch and pull request.

#### Setup (One-time):

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link your repository:**
   ```bash
   cd /home/user/konradish.github.io
   vercel link
   ```
   - Select your GitHub account
   - Link to existing project or create new

4. **Deploy current branch:**
   ```bash
   vercel
   ```

#### Deploy Your Branch:

```bash
# From your branch
vercel

# Or deploy a specific branch
vercel --prod  # Deploy to production (careful!)
```

**Preview URL:** Vercel will give you a unique URL like:
```
https://konradish-github-io-abc123.vercel.app
```

**Pros:**
- Automatic preview URLs for each branch
- Free for personal projects
- HTTPS enabled
- Can share URL with others
- Automatic deployments on push

**Cons:**
- Requires Vercel account (free)
- Additional setup

#### GitHub Integration:

After connecting Vercel to your GitHub repo:
- Every push to any branch gets a preview URL
- Pull requests automatically get preview deployments
- Comments are added to PRs with preview links

**Setup GitHub Integration:**
1. Go to https://vercel.com/new
2. Import your `konradish/konradish.github.io` repo
3. Configure:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty)
   - Output Directory: ./
4. Deploy!

---

### Option 3: Netlify Preview

Similar to Vercel, Netlify offers automatic preview deployments.

#### Setup (One-time):

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Initialize site:**
   ```bash
   cd /home/user/konradish.github.io
   netlify init
   ```

4. **Deploy:**
   ```bash
   netlify deploy
   ```

#### Deploy Your Branch:

```bash
# Preview deployment
netlify deploy

# Production deployment
netlify deploy --prod
```

**Pros:**
- Similar to Vercel
- Free for personal projects
- Automatic preview URLs
- Easy rollback

**Cons:**
- Requires Netlify account

---

### Option 4: GitHub Pages with Temporary Branch Switch

⚠️ **Warning:** This temporarily changes your live site!

You can temporarily point GitHub Pages to your test branch:

1. Go to repo Settings → Pages
2. Under "Build and deployment", select:
   - Source: Deploy from a branch
   - Branch: `claude/review-homepage-agents-011CUvZfC2yCxMmjSGxciNu5`
   - Folder: / (root)
3. Save
4. Wait ~2-5 minutes
5. Visit https://konradodell.com (will show your test branch)
6. **Remember to switch back to `main` when done!**

**Pros:**
- Uses existing GitHub Pages setup
- Real domain testing

**Cons:**
- Temporarily overwrites live site
- Easy to forget to switch back
- Takes ~5 minutes to deploy

---

### Option 5: Create a Fork

Create a fork of your repo for testing:

1. Fork `konradish/konradish.github.io` to `konradish/konradish-preview`
2. Push your test branch to the fork
3. Enable GitHub Pages on the fork
4. It will deploy to `https://konradish.github.io/konradish-preview/`

**Pros:**
- Doesn't affect main site
- Persistent preview environment

**Cons:**
- Assets might need path adjustments for subdirectory
- More setup required

---

## 📊 Comparison Table

| Method | Speed | Setup | URL Type | Live Updates | Cost |
|--------|-------|-------|----------|--------------|------|
| **Local** | ⚡ Instant | None | localhost | Manual | Free |
| **Vercel** | 🚀 ~30s | One-time | Unique URL | Auto | Free |
| **Netlify** | 🚀 ~30s | One-time | Unique URL | Auto | Free |
| **GitHub Pages** | 🐌 ~5min | None | Your domain | Manual | Free |
| **Fork** | 🐌 ~5min | Medium | Subdirectory | Manual | Free |

---

## ✅ Recommended Workflow

### For Quick Iteration:
1. Use **local server** (`python3 -m http.server 8080`)
2. Make changes
3. Refresh browser to see updates
4. Run `./validate.sh` when ready

### For Sharing with Others:
1. Use **Vercel** or **Netlify**
2. Get shareable preview URL
3. Share with team/stakeholders
4. Merge when approved

### For Final Validation:
1. Test locally first
2. Deploy to Vercel/Netlify preview
3. Run full validation:
   - `./validate.sh`
   - Lighthouse audit
   - Cross-browser testing
   - Mobile testing
4. Merge to main
5. GitHub Pages auto-deploys to production

---

## 🔧 Testing Checklist

Before deploying to production:

- [ ] Local server runs without errors
- [ ] `./validate.sh` passes all checks
- [ ] Lighthouse scores meet targets:
  - Performance: 85+
  - Accessibility: 95+
  - Best Practices: 90+
  - SEO: 90+
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested on mobile device
- [ ] All videos/images load correctly
- [ ] Canvas animation works and pauses
- [ ] Theme toggle functions
- [ ] Resume loads
- [ ] No console errors

---

## 🚨 Emergency Rollback

If something breaks after deploying to main:

### GitHub Pages:
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to previous commit
git reset --hard <previous-commit-sha>
git push origin main --force
```

### Vercel/Netlify:
- Dashboard → Deployments → Select previous working deployment → Promote to Production

---

## 📝 Current Setup

Your repository includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `netlify.toml` - Netlify configuration
- ✅ `validate.sh` - Pre-deployment validation script

All configurations preserve your security headers (CSP, X-Frame-Options, Referrer-Policy).

---

## 🆘 Troubleshooting

**Preview URL shows blank page:**
- Check browser console for errors
- Verify CSP isn't blocking resources
- Check that all asset paths are correct

**Videos/images not loading:**
- Check network tab for 404s
- Verify files are committed to git
- Check file names match exactly (case-sensitive)

**Canvas animation not working:**
- Check console for Three.js errors
- Verify module import is working
- Check CSP allows scripts from unpkg.com (or local Three.js)

**Build fails on Vercel/Netlify:**
- Ensure no build command is needed (static site)
- Check that all files are committed
- Verify vercel.json/netlify.toml syntax

---

Last updated: 2025-11-08
Branch: claude/review-homepage-agents-011CUvZfC2yCxMmjSGxciNu5
