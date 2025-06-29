# RPGlitch Build Script for Perchance

This build script automatically combines your separate RPGlitch files into a single file ready for deployment to the Perchance platform.

## 🚀 Quick Start

### 1. Install Dependencies (Optional)
```bash
npm install
```

### 2. Build for Perchance
```bash
npm run build
```

### 3. Deploy to Perchance
1. Copy the contents of `build/RPGlitch-perchance.html`
2. Paste into the **right panel** of your Perchance project
3. Copy `RPGlitch/RPGlitch-left-panel.html` to the **left panel**

## 📁 File Structure

```
Perchance/
├── RPGlitch/
│   ├── RPGlitch.html              # Main HTML structure
│   ├── RPGlitch-style-block.html  # CSS styles
│   ├── RPGlitch-script-block.html # JavaScript logic
│   └── RPGlitch-left-panel.html   # Left panel (copy manually)
├── build/
│   └── RPGlitch-perchance.html    # Generated combined file
├── build-perchance.js             # Build script
├── package.json                   # Project configuration
└── README-build.md               # This file
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the combined file for Perchance |
| `npm run build:watch` | Build and watch for changes (requires nodemon) |
| `npm run validate` | Check if all source files exist |
| `npm run clean` | Remove the build directory |
| `npm run deploy` | Build and show deployment instructions |

## 🔧 Manual Build

If you prefer to run the script directly:

```bash
node build-perchance.js
```

## 📋 What the Build Script Does

1. **Validates** all source files exist
2. **Reads** the three separate files:
   - `RPGlitch.html` (HTML structure)
   - `RPGlitch-style-block.html` (CSS styles)
   - `RPGlitch-script-block.html` (JavaScript)
3. **Combines** them in the correct order
4. **Adds** helpful comments and section markers
5. **Outputs** a single file: `build/RPGlitch-perchance.html`

## 🎯 Development Workflow

### During Development
- Edit the separate files in `RPGlitch/`
- Use `npm run build:watch` to auto-rebuild on changes
- Test your changes locally

### For Perchance Deployment
- Run `npm run build`
- Copy the generated file to Perchance
- Test on the Perchance platform

## 🔍 Troubleshooting

### "File not found" Error
Make sure all these files exist:
- `RPGlitch/RPGlitch.html`
- `RPGlitch/RPGlitch-style-block.html`
- `RPGlitch/RPGlitch-script-block.html`

### Build Fails
Check the console output for specific error messages. Common issues:
- Missing source files
- File permission issues
- Invalid file paths

### Perchance Issues
If the combined file doesn't work on Perchance:
1. Check that the file size isn't too large
2. Verify all script tags are properly closed
3. Ensure the left panel file is also copied

## 📊 Build Information

The build script adds helpful metadata to the output file:
- Build timestamp
- Source file information
- Platform-specific instructions
- Section markers for easy navigation

## 🤝 Contributing

To modify the build process:
1. Edit `build-perchance.js`
2. Test with `npm run build`
3. Update this README if needed

## 📝 Notes

- The build script preserves all original functionality
- No minification is performed (Perchance handles this)
- Source files remain unchanged
- Build output is in the `build/` directory

---

**Happy building! 🎭** 