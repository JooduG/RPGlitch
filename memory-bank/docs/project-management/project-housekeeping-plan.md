# 🧹 Project-Wide Housekeeping Plan

## 🎯 **EXECUTIVE SUMMARY**

This comprehensive housekeeping plan addresses additional optimization opportunities identified across the entire project structure, beyond the memory-bank reorganization already completed.

**Date**: 2025-01-03  
**Status**: 📋 **PLANNING**  
**Scope**: **PROJECT-WIDE** - All directories and files

---

## 📊 **CURRENT STATE ANALYSIS**

### **✅ Already Optimized**

- **Memory-bank**: ✅ Complete reorganization completed
- **Root structure**: ✅ Good overall organization
- **Configuration files**: ✅ Well organized

### **🔧 Areas Needing Housekeeping**

#### **1. Apps Directory (MEDIUM Priority)**

**Current State**: All files in single directories
**Issues**:

- No separation of concerns (HTML, CSS, JS mixed)
- No component organization
- No asset management

#### **2. Tools Directory (LOW Priority)**

**Current State**: Some directories have timestamped folders
**Issues**:

- Old diagnostic reports cluttering directories
- No cleanup of old timestamped folders

#### **3. Build Directory (LOW Priority)**

**Current State**: Output files mixed with scripts
**Issues**:

- Large output files in repository
- No clear separation of build artifacts

#### **4. Root Level Files (LOW Priority)**

**Current State**: Some files could be better organized
**Issues**:

- `gemini.md` - unclear purpose
- Multiple optimization plan files

---

## 🎯 **HOUSEKEEPING STRATEGY**

### **Phase 1: Apps Organization (MEDIUM Priority)**

#### **New Apps Structure**

```
apps/
├── rpglitch/
│   ├── src/                   # Source files
│   │   ├── components/        # React components
│   │   │   └── ProfilePictureComponent.js
│   │   ├── styles/           # CSS/SCSS files
│   │   │   └── RPGlitch.scss
│   │   ├── scripts/          # JavaScript files
│   │   │   └── RPGlitch.js
│   │   └── templates/        # HTML templates
│   │       ├── RPGlitch.html
│   │       └── RPGlitch-left-panel.html
│   └── README.md             # App documentation
├── imageglitch/
│   ├── src/                  # Source files
│   │   ├── styles/           # CSS files
│   │   │   └── ImageGlitch-style-block.html
│   │   └── templates/        # HTML templates
│   │       ├── ImageGlitch.html
│   │       └── ImageGlitch-left-panel.html
│   └── README.md             # App documentation
└── shared/                   # Shared resources
    ├── assets/               # Shared assets
    └── components/           # Shared components
```

#### **File Migration Plan**

**RPGlitch App**:

- `ProfilePictureComponent.js` → `apps/rpglitch/src/components/`
- `RPGlitch.scss` → `apps/rpglitch/src/styles/`
- `RPGlitch.js` → `apps/rpglitch/src/scripts/`
- `RPGlitch.html` → `apps/rpglitch/src/templates/`
- `RPGlitch-left-panel.html` → `apps/rpglitch/src/templates/`

**ImageGlitch App**:

- `ImageGlitch-style-block.html` → `apps/imageglitch/src/styles/`
- `ImageGlitch.html` → `apps/imageglitch/src/templates/`
- `ImageGlitch-left-panel.html` → `apps/imageglitch/src/templates/`

### **Phase 2: Tools Cleanup (LOW Priority)**

#### **Cleanup Actions**

1. **Remove old diagnostic reports**: Delete timestamped folders in `tools/diagnostics/`
2. **Archive old reports**: Move important reports to `tools/archives/`
3. **Organize current tools**: Add README files to each tool directory

#### **New Tools Structure**

```
tools/
├── diagnostics/              # Current diagnostic tools
│   ├── automation-collect-diagnostics.js
│   ├── atomic-class-generator.js
│   ├── css-cleanup.js
│   ├── css-performance-analyzer.js
│   └── README.md
├── ai-rule-selection/        # AI rule selection tools
│   ├── context-analyzer.js
│   ├── intelligent-rule-selector.js
│   ├── performance-optimizer.js
│   ├── task-classifier.js
│   └── README.md
├── browser-tools/            # Browser automation tools
├── test-globs/               # Testing utilities
├── archives/                 # Archived tools and reports
└── README.md                 # Tools overview
```

### **Phase 3: Build Directory Cleanup (LOW Priority)**

#### **Cleanup Actions**

1. **Move output files**: Move build outputs to `.gitignore` or separate directory
2. **Organize scripts**: Add documentation to build scripts
3. **Clean up archives**: Organize build archives

#### **New Build Structure**

```
build/
├── scripts/                  # Build scripts
│   ├── build-and-copy.js
│   ├── build-perchance.js
│   └── README.md
├── output/                   # Build outputs (gitignored)
│   ├── rpglitch/
│   ├── imageglitch/
│   └── archives/
└── README.md                 # Build documentation
```

### **Phase 4: Root Level Cleanup (LOW Priority)**

#### **Cleanup Actions**

1. **Organize documentation**: Move optimization plans to `docs/`
2. **Clarify file purposes**: Add comments or move unclear files
3. **Update .gitignore**: Ensure proper file exclusions

---

## 🚀 **IMPLEMENTATION PLAN**

### **Step 1: Apps Organization**

```bash
# Create new app structure
mkdir -p apps/rpglitch/src/{components,styles,scripts,templates}
mkdir -p apps/imageglitch/src/{styles,templates}
mkdir -p apps/shared/{assets,components}

# Move RPGlitch files
mv apps/rpglitch/ProfilePictureComponent.js apps/rpglitch/src/components/
mv apps/rpglitch/RPGlitch.scss apps/rpglitch/src/styles/
mv apps/rpglitch/RPGlitch.js apps/rpglitch/src/scripts/
mv apps/rpglitch/RPGlitch.html apps/rpglitch/src/templates/
mv apps/rpglitch/RPGlitch-left-panel.html apps/rpglitch/src/templates/

# Move ImageGlitch files
mv apps/imageglitch/ImageGlitch-style-block.html apps/imageglitch/src/styles/
mv apps/imageglitch/ImageGlitch.html apps/imageglitch/src/templates/
mv apps/imageglitch/ImageGlitch-left-panel.html apps/imageglitch/src/templates/
```

### **Step 2: Tools Cleanup**

```bash
# Create tools archives directory
mkdir -p tools/archives

# Move old diagnostic reports
mv tools/diagnostics/2025-07-03T* tools/archives/

# Create README files
touch tools/README.md
touch tools/diagnostics/README.md
touch tools/ai-rule-selection/README.md
```

### **Step 3: Build Cleanup**

```bash
# Update .gitignore to exclude build outputs
echo "build/output/" >> .gitignore

# Create build documentation
touch build/README.md
```

### **Step 4: Root Level Cleanup**

```bash
# Move optimization plans to docs
mkdir -p docs/project-management
mv directory-optimization-plan.md docs/project-management/
mv directory-optimization-complete.md docs/project-management/
mv project-housekeeping-plan.md docs/project-management/
```

---

## 📋 **VERIFICATION CHECKLIST**

### **Apps Organization**

- [ ] New app structure created
- [ ] All files moved to appropriate locations
- [ ] README files created for each app
- [ ] Shared resources organized

### **Tools Cleanup**

- [ ] Old diagnostic reports archived
- [ ] README files created for each tool
- [ ] Tools overview documentation created

### **Build Cleanup**

- [ ] Build outputs properly gitignored
- [ ] Build documentation created
- [ ] Scripts documented

### **Root Level Cleanup**

- [ ] Documentation organized
- [ ] File purposes clarified
- [ ] .gitignore updated

---

## 🎯 **EXPECTED OUTCOMES**

### **Immediate Benefits**

- **Better App Organization**: Clear separation of concerns in apps
- **Cleaner Tools Directory**: No clutter from old reports
- **Proper Build Management**: Build outputs properly managed
- **Clearer Documentation**: Better organization of project docs

### **Long-term Benefits**

- **Improved Maintainability**: Easier to find and manage files
- **Better Scalability**: Structure supports app growth
- **Cleaner Repository**: No unnecessary files in version control
- **Enhanced Developer Experience**: Clearer project structure

---

## ⚠️ **RISK MITIGATION**

### **Backup Strategy**

- Create full backup before starting
- Move files incrementally
- Test each step before proceeding
- Keep original structure until verification complete

### **Rollback Plan**

- Maintain backup of original structure
- Document all changes for potential rollback
- Test functionality after each major step

---

**🎯 This housekeeping plan will complete the optimization of the entire project structure!**
