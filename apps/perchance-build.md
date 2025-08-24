---
description: Build and deployment automation for Perchance applications.
globs:
  - "**/*.html"
  - "**/*.js"
  - "**/*.scss"
alwaysApply: false
---

# Perchance Build & Deployment

## Build Process

### Source Compilation

- **JavaScript Bundling:** Merge multiple JS files into single optimized bundle
- **CSS Processing:** Compile SCSS to optimized CSS
- **HTML Generation:** Create final HTML with embedded resources
- **Asset Optimization:** Minify and compress all assets

### Build Scripts

- **build-rpglitch.js:** Main build script for RPGlitch application
- **build-and-copy.js:** Builds RPGlitch and copies the HTML to clipboard
- **sync-*.js:** Helper scripts for combining docs, syncing configs, and hub generation

### Output Generation

- **Single HTML File:** Complete application in one file
- **Optimized Assets:** Minified CSS and JavaScript
- **Output Path (RPGlitch):** `build/output/RPGlitch.html`
- **Platform Ready:** Direct upload (copy/paste) to Perchance platform

## Deployment Workflow

### Pre-Deployment Checklist

- [ ] All source files are up to date
- [ ] Build process completes without errors
- [ ] Generated HTML is valid and functional
- [ ] All assets are properly embedded
- [ ] Performance optimization applied

### Deployment Steps

1. **Build Generation:** Run build script to create optimized output
2. **Validation:** Test generated HTML for functionality
3. **Upload:** Copy generated HTML to Perchance platform
4. **Testing:** Verify deployment on live platform
5. **Monitoring:** Check for any post-deployment issues

## Best Practices

- **Incremental Builds:** Only rebuild what has changed
- **Parallel Processing:** Use multiple cores for faster builds
- **Caching:** Cache build artifacts for faster rebuilds
- **Error Handling:** Graceful error handling and recovery
