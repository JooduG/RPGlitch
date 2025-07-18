---
# Active Context

> _This file captures the current session's context, focus, and any temporary notes. For persistent context and philosophy, see [coreContext.md](./coreContext.md)._ 

## Current Focus

- Incremental documentation improvement: reviewing and updating README.md and all memory-bank docs for accuracy, clarity, and completeness using IMPLEMENT MODE.

## Session Notes

- Following Memory Bank build methodology for documentation.
- Will update progress.md and tasks.md as changes are made.
- No blockers or major issues identified at session start.

## CRITICAL: RPGlitch Project File Structure & Commands

### Project Root: `C:\Users\johng\Documents\GitHub\default`
- **Build Script**: `build-perchance.js` (at project root)
- **Build Command**: `node build-perchance.js` (run from project root)
- **Build Output**: `Perchance/build/RPGlitch-perchance.html`

### Source Files: `Perchance/RPGlitch/`
- **Main HTML**: `Perchance/RPGlitch/RPGlitch.html`
- **Main SCSS**: `Perchance/RPGlitch/RPGlitch.scss`
- **Main JS**: `Perchance/RPGlitch/RPGlitch.js`
- **Components**: `Perchance/RPGlitch/ProfilePictureComponent.js`

### Correct Command Patterns:

**Option 1: Stay at Project Root (RECOMMENDED)**
```powershell
# Edit files with full paths
(Get-Content Perchance/RPGlitch/RPGlitch.scss) -replace 'pattern', 'replacement' | Set-Content Perchance/RPGlitch/RPGlitch.scss

# Build from project root
node build-perchance.js
```

**Option 2: CD to Directory First**
```powershell
# Navigate to source directory
cd Perchance/RPGlitch

# Edit files with local paths
(Get-Content RPGlitch.scss) -replace 'pattern', 'replacement' | Set-Content RPGlitch.scss

# Return to project root for build
cd ../..
node build-perchance.js
```

### Memory Bank Files: `memory-bank/`
- **Tasks**: `memory-bank/tasks.md`
- **Active Context**: `memory-bank/activeContext.md`
- **Progress**: `memory-bank/progress.md`

--- 