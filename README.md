# 🚀 Perchance/Glitch Development System - Unified 3-Mode Architecture

Welcome to the **Perchance/Glitch Development System** - a comprehensive, modern web development framework built with the Perchance/Glitch design system. This project features a unified 3-mode architecture with integrated thinking approaches, memory bank management, and automated workflows.

## 🎯 **System Overview**

This development system provides:

- **🎭🎨⚒️ Unified 3-Mode Architecture**: Strategic, Tactical, and Operational modes with automatic complexity-based routing
- **🧠 Integrated Thinking Framework**: Contemplative, Sequential, and Professional coding approaches
- **📚 Memory Bank System**: Persistent context and knowledge management with Obsidian integration
- **🔧 MCP Ecosystem**: Real-time documentation access and tool integration
- **⚡ Context-Aware Optimization**: Intelligent rule loading for maximum efficiency
- **🚀 Automated Workflows**: Build, deployment, and development automation

## 📚 Documentation

Full documentation lives in the [memory-bank/docs/](memory-bank/docs/) directory. Key guides:

- [Protocols](memory-bank/docs/protocols) - operational and agent protocols
- [Build System](memory-bank/docs/build/README.md)
- [Applications](memory-bank/docs/apps/README.md)
- [Development Tools](memory-bank/docs/tools/README.md)
- Memory bank documentation remains under [memory-bank/](memory-bank/).

## 📱 **Live Applications**

### RPGlitch

- **Live App**: [https://perchance.org/rpglitch](https://perchance.org/rpglitch)
- **Source**: [apps/rpglitch/RPGlitch.html](apps/rpglitch/RPGlitch.html)
- **Description**: Minimal, robust RPG character generator and editor with glitch effects

### ImageGlitch

- **Live App**: [https://perchance.org/imageglitch](https://perchance.org/imageglitch)
- **Source**: [apps/imageglitch/ImageGlitch.html](apps/imageglitch/ImageGlitch.html)
- **Description**: Component-based image glitching tool with modern UI

## 🏗️ **System Architecture**

### **🎭 Strategic Mode** (System Architect)

- **Purpose**: System-level thinking, workflow optimization, tool management
- **Thinking Approach**: Contemplative thinking with deep exploration
- **When Activated**: Level 3 tasks, system optimization, meta-reflection

### **🎨 Tactical Mode** (Project Planner)

- **Purpose**: App-specific planning, design decisions, implementation planning
- **Thinking Approach**: Sequential thinking with systematic analysis
- **When Activated**: Level 2-3 tasks, feature planning, design decisions

### **⚒️ Operational Mode** (Code Implementer)

- **Purpose**: Implementation, testing, and execution
- **Thinking Approach**: Professional coding with zero technical debt
- **When Activated**: All levels, direct implementation, testing, deployment

## 📋 **Core Rules & Guidelines**

### **Essential Documentation**

- **[System Architecture](.cursor/rules/technical-architecture.mdc)**: Complete 3-mode system architecture
- **[Unified Orchestrator Mode](.cursor/rules/orchestration-mode.mdc)**: Automatic mode routing and role selection
- **[Thinking Framework](.cursor/rules/thinking-framework.mdc)**: Integrated thinking approaches
- **[Memory Bank Overview](.cursor/rules/memory-bank-overview.mdc)**: Knowledge management system
- **[MCP Ecosystem](.cursor/rules/mcp-ecosystem.mdc)**: Model Context Protocol integration
- **[Perchance Architecture](.cursor/rules/perchance-architecture.mdc)**: Platform-specific guidelines
- **[JavaScript Development](.cursor/rules/js-development.mdc)**: Modern JS best practices
- **[SCSS Advanced Patterns](.cursor/rules/scss-advanced-patterns.mdc)**: Advanced styling patterns

### **Development Principles**

- **Minimal, grouped controls**: No icons, only text labels
- **Atomic/component CSS**: All CSS in one file, no @import, no repeated !important
- **Incremental changes**: Small, reviewable modifications only
- **Protocol-driven workflows**: Structured development processes
- **Modular architecture**: Extensible plugin system and component design
- **Zero technical debt**: Production-ready code from the start

## 📁 **Project Structure**

```mermaid
/
├── apps/                   # Application source code
│   ├── rpglitch/           # RPGlitch application
│   ├── imageglitch/        # ImageGlitch application
│   └── shared/             # Shared components and assets
├── build/                  # Build system and automation
│   ├── scripts/            # Build scripts and utilities
│   └── output/             # Build artifacts and deployment files
├── memory-bank/            # Knowledge management system
│   ├── active/             # Active project context
│   ├── strategic/          # Strategic planning and analysis
│   ├── tactical/           # Tactical planning and coordination
│   ├── operational/        # Operational implementation
│   ├── archives/           # Archived content and history
│   └── projects/           # Project-specific memory
├── tools/                  # Development tools and utilities
│   ├── diagnostics/        # Diagnostic and testing tools
│   ├── ai-rule-selection/  # AI rule selection tools
│   ├── browser-tools/      # Browser automation tools
│   └── test-globs/         # Testing utilities
├── .cursor/                # Cursor editor configuration
│   └── rules/              # 39 comprehensive rule files
├── linting/                # Code quality and linting
│   ├── eslint.config.mjs   # ESLint configuration
│   └── stylelint.config.js # Stylelint configuration
├── .vscode/                # VSCode configuration
├── package.json            # Node.js dependencies
└── README.md               # This comprehensive guide
```

## 🚀 **Quick Start Guide**

### **For New Developers**

1. **Review System Architecture**: Start with [technical-architecture.mdc](.cursor/rules/technical-architecture.mdc)
2. **Understand 3-Mode System**: Read [orchestration-mode.mdc](.cursor/rules/orchestration-mode.mdc)
3. **Explore Memory Bank**: Check [memory-bank-overview.mdc](.cursor/rules/memory-bank-overview.mdc)
4. **Review Project Rules**: Browse all 39 rules in [.cursor/rules/](.cursor/rules/)

### **For Active Development**

1. **Automatic Mode Selection**: The system automatically routes tasks based on complexity
2. **Memory Bank Integration**: All decisions and progress are tracked in memory-bank/
3. **Build Automation**: Use build scripts for deployment-ready output
4. **Quality Assurance**: Comprehensive linting and testing tools available

## 🔧 **Build & Deployment**

### **RPGlitch Build Process**

- **Build Script**: `node build-perchance.js` (from project root)
- **Setup**: Run `npm install` first to install optional minifier packages
- **Output**: `build/output/RPGlitch-perchance.html` (deployment ready)
- **CSS Archive**: `build/output/archive/RPGlitch-perchance.css` (with source map)
- **No Manual CSS**: Build script handles all CSS merging automatically

### **CSS Architecture**

- **base.css**: Atomic/utility classes, variables, resets
- **layout.css**: Layout, centering, width, and flex rules
- **components.css**: Visual/component styles for UI elements
- **ONE SOURCE ONE TRUTH**: Each class defined only once in appropriate file

### **Deployment**

- **Perchance Platform**: Direct upload of generated HTML files
- **Single File Output**: Complete applications in single HTML files
- **Optimized Assets**: Minified CSS, JavaScript, and HTML embedded via PostCSS, Terser, and html-minifier
- **Platform Ready**: No external dependencies required

## 📊 **System Features**

### **🎯 Automatic Intelligence**

- **Complexity Assessment**: Automatic task complexity detection (Level 1-3)
- **Mode Routing**: Smart routing to appropriate modes based on task type
- **Role Selection**: Automatic role activation (System Architect, Project Planner, Code Implementer)
- **Thinking Approach**: Optimal thinking method selection for each task

### **🧠 Memory Management**

- **Persistent Context**: No lost context between development sessions
- **Knowledge Graph**: Automatic semantic relationship building
- **Obsidian Integration**: Works with existing Obsidian workflows
- **Multi-Project Support**: Separate knowledge bases for different projects

### **⚡ Performance Optimization**

- **Context-Aware Rules**: Intelligent rule loading based on task context
- **Token Efficiency**: Optimal rule selection for maximum performance
- **Lazy Loading**: Specialized rules loaded only when needed
- **Rule Caching**: Intelligent caching for frequently used rules

### **🔧 MCP Integration**

- **Context7**: Real-time access to current library documentation
- **Time MCP**: Date standardization and timezone handling
- **Basic Memory**: Local knowledge management with MCP server
- **Sequential Thinking**: Tool-guided problem solving with MCP integration

## 📚 **Documentation Structure**

### **Rules System (39 Files)**

- **System & Architecture**: 9 rules covering system design and orchestration
- **Memory Bank**: 3 rules for knowledge management
- **MCP Integration**: 4 rules for external tool integration
- **JavaScript Development**: 9 rules for modern JS practices
- **SCSS & Styling**: 3 rules for advanced styling patterns
- **Perchance Platform**: 3 rules for platform-specific development
- **HTML Development**: 1 rule for semantic HTML
- **Development Tools**: 7 rules for various development aspects

### **Memory Bank Organization**

- **Active Context**: Current project state and decisions
- **Strategic Planning**: Long-term planning and system optimization
- **Tactical Coordination**: Implementation planning and coordination
- **Operational Execution**: Implementation details and progress tracking
- **Archives**: Historical decisions and completed work
- **Projects**: Project-specific knowledge and context

## 🎯 **Development Workflow**

### **Task Processing Pipeline**

1. **Complexity Assessment**: Automatic level detection (1-3)
2. **Mode Routing**: Strategic → Tactical → Operational
3. **Thinking Approach**: Contemplative → Sequential → Professional
4. **Role Activation**: System Architect → Project Planner → Code Implementer
5. **Execution**: Implementation with quality assurance
6. **Reflection**: Strategic optimization and learning

### **Quality Assurance**

- **Comprehensive Linting**: ESLint, Stylelint, HTMLHint, MarkdownLint
- **Lint Commands**: Run `npm run lint` to check and `npm run lint:fix` to automatically fix issues
- **Automated Testing**: Browser automation and diagnostic tools
- **Jest Environment**: `jest-environment-jsdom@^29.7.0` pinned due to incompatibilities with some DOM libraries. Upgrading to v30+ is planned once those dependencies are updated.
- **Jest Permissions**: Ensure `node_modules/.bin/jest` is executable (`chmod +x node_modules/.bin/jest`) before running tests, especially on fresh installs.
- **Performance Monitoring**: Build optimization and asset compression
- **Error Handling**: Robust error handling and graceful degradation

## 🧠 Codex / AI Agent Quickstart

1. Open Codex → Environments → set env vars:
   - `MCP_FILESYSTEM_ROOT=/workspace/default`
   - (Optional) `TOOLBOX_API_KEY`, `TOOLBOX_PROFILE` if you use Toolbox.
2. Ensure `.env` exists locally (not committed) with API keys; the repo includes `.env.example`.
3. In a Codex terminal:

   ```bash
   node -v && npm -v
   npm ci
   npm run check
   npm run build
   ´´´

## 🔄 **Recent Updates (July 2025)**

### **System Architecture Enhancements**

- **Unified 3-Mode System**: Complete implementation of Strategic, Tactical, and Operational modes
- **Integrated Thinking Framework**: Contemplative, Sequential, and Professional coding approaches
- **Memory Bank Optimization**: Token efficiency and hierarchical rule structure
- **MCP Ecosystem Integration**: Context7, Time MCP, and Basic Memory integration

### **Rules System Refinement**

- **Rule Validation**: All 39 rules verified and updated
- **Link Verification**: All documentation links validated
- **Consistency Checks**: Unified terminology across all rules
- **Performance Optimization**: Token efficiency improvements

### **Project Structure Optimization**

- **Memory Bank Reorganization**: Clear categorization (active, strategic, tactical, operational, archives, projects)
- **Apps Directory Structure**: Organized with proper src/ subdirectories
- **Documentation Consolidation**: Centralized project management documentation
- **Tools Cleanup**: Organized tools directory and archived dated reports

### **Build System Improvements**

- **Dependency Loading Fix**: Reverted to original inlining approach for reliable library loading
- **Database Safety**: Comprehensive null checks throughout applications
- **Error Handling**: Improved error handling with better timeout messages
- **CSS Architecture**: ONE SOURCE ONE TRUTH principle for maintainable styling
- **Offline Mode**: Run `npm run build:offline` to use cached libraries and skip network downloads

## 📞 **Support & Resources**

### **Documentation**

- **All Rules**: [.cursor/rules/](.cursor/rules/) (39 comprehensive rule files)
- **Memory Bank**: [memory-bank/](memory-bank/) (Knowledge management system)
- **Build System**: [build/](build/) (Automation and deployment tools)
- **Development Tools**: [tools/](tools/) (Diagnostic and testing utilities)

### **Quick References**

- **System Architecture**: [technical-architecture.mdc](.cursor/rules/technical-architecture.mdc)
- **3-Mode System**: [orchestration-mode.mdc](.cursor/rules/orchestration-mode.mdc)
- **Thinking Framework**: [thinking-framework.mdc](.cursor/rules/thinking-framework.mdc)
- **Memory Bank**: [memory-bank-overview.mdc](.cursor/rules/memory-bank-overview.mdc)

---

**Last Updated**: 2025-07-30  
**Version**: 3.0  
**Status**: Complete unified 3-mode system with 39 rules and memory bank integration

**🚀 Ready for production development with automatic intelligence and zero technical debt!**
