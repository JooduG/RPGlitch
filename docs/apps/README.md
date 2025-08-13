# 📱 Applications Directory

## 🎯 **Overview**

This directory contains the main applications in the Perchance/Glitch development system. Each application follows the unified 3-mode architecture and Perchance platform guidelines.

## 📁 **Structure**

` ext
apps/
├── rpglitch/                        # RPG character profile generator with glitch effects
├── imageglitch/                     # Image glitch effect application
├── shared/                          # Shared components and assets
└── README.md                        # This documentation
`

## 🎮 **Applications**

### RPGlitch

**A minimal, robust RPG character generator and editor with glitch effects.**

- **Live App**: [https://perchance.org/rpglitch](https://perchance.org/rpglitch)
- **Main Entry Point**:
pglitch/RPGlitch.html`n- **Build Output**: build/output/RPGlitch-perchance.html (deployment ready)
- **Features**:
  - Character profile creation and editing
  - Glitch effects and visual customization
  - Plugin system for extensibility
  - Session storage for data persistence
  - Responsive design with Pico CSS framework

### ImageGlitch

**A component-based image glitching tool with modern UI.**

- **Live App**: [https://perchance.org/imageglitch](https://perchance.org/imageglitch)
- **Main Entry Point**: imageglitch/ImageGlitch.html`n- **Build Output**: build/output/ImageGlitch-perchance.html (deployment ready)
- **Features**:
  - Image upload and processing
  - Multiple glitch effect algorithms
  - Real-time preview and adjustment
  - Export functionality
  - Minimal, grouped controls interface

## 🏗️ **Architecture Principles**

### **Perchance Platform Compliance**

- **Single File Output**: Each app compiles to a single HTML file for deployment
- **No External Dependencies**: All libraries and assets embedded in output
- **Platform Constraints**: Optimized for Perchance platform limitations
- **Client-Side Execution**: Full functionality without server-side requirements

### **3-Mode System Integration**

- **Strategic Mode**: System-level optimization and architecture decisions
- **Tactical Mode**: App-specific planning and design coordination
- **Operational Mode**: Implementation and feature development

### **Development Guidelines**

- **Modular Organization**: Component-based architecture during development
- **Plugin System**: Extensible functionality via global App objects
- **Memory Bank Integration**: All decisions tracked in memory-bank/projects/
- **Incremental Development**: Small, reviewable changes only

## 🔧 **Build Process**

### **Automated Build System**

- **Build Scripts**: Located in build/ directory
- **CSS Processing**: Automatic merging of base.css, layout.css, and components.css
- **Asset Optimization**: Minification and compression of all assets
- **Output Generation**: Single HTML file with embedded resources

### **Build Commands**

`bash

## Build RPGlitch

node build-perchance.js

## Build ImageGlitch

node build-imageglitch.js

## Build all applications

node build-all.js
`

### **Output Structure**

- **Deployment Files**: build/output/`AppName`-perchance.html (ready for Perchance)
- **CSS Archives**: build/output/archive/`AppName`-perchance.css (with source maps)
- **Asset Optimization**: All images, scripts, and styles embedded and optimized

## 📊 **Quality Assurance**

### **Code Quality**

- **Linting**: ESLint, Stylelint, HTMLHint, and MarkdownLint configurations
- **Testing**: Automated browser testing and diagnostic tools
- **Performance**: Build optimization and asset compression
- **Accessibility**: WCAG compliance and semantic HTML structure

### **Development Workflow**

- **Memory Bank Tracking**: All development decisions documented in memory-bank/
- **Rule Compliance**: All 39 rules in .cursor/rules/ applied consistently
- **Incremental Changes**: Small, reviewable modifications only
- **Quality First**: Zero technical debt and production-ready code

## 🔄 **Recent Updates**

### **RPGlitch Enhancements**

- **Session Storage Fix**: Resolved data persistence issues during page refreshes
- **UI Modernization**: Unified chin cards with storyboard cards through semantic HTML
- **CSS Architecture**: ONE SOURCE ONE TRUTH principle for maintainable styling
- **Error Handling**: Comprehensive null checks and graceful degradation

### **Build System Improvements**

- **Dependency Loading**: Reverted to reliable inlining approach
- **CSS Processing**: Automated merging with source map generation
- **Asset Optimization**: Enhanced compression and minification
- **Error Recovery**: Graceful handling of build failures

## 🎹 **Keyboard Interactions for Chin Controls**

The top bar chin buttons support basic keyboard navigation:

- **Tab/Shift+Tab** to move focus between chin buttons.
- **Enter** or **Space** to toggle the associated chin section.
- When a chin is opened, the active button has `aria-expanded="true"` and focuses on its content region.
- Press **Escape** or click outside the chin to close it.

## 📚 **Related Documentation**

- **[Technical Architecture](../.cursor/rules/technical-architecture.mdc)**: Complete 3-mode system overview
- **[Perchance Architecture](../.cursor/rules/perchance-architecture.mdc)**: Platform-specific guidelines
- **[Build & Deployment](../.cursor/rules/perchance-build-deployment.mdc)**: Build process documentation
- **[Memory Bank](../memory-bank/)**: Project knowledge and decision tracking

---

**Last Updated**: 2025-07-24  
**Version**: 2.0  
**Status**: Updated for unified 3-mode system and current project structure

**📱 Applications ready for development with automatic intelligence and zero technical debt!**
