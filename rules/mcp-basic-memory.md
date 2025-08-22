---
alwaysApply: true
---
# Basic Memory MCP Server Integration

## Overview

Basic Memory is a knowledge management system that builds persistent semantic graphs and long-term storage from conversations. It integrates with Obsidian.md and provides native MCP server capabilities for the 3-mode development system.

## 🎯 **WHY BASIC MEMORY?**

### **Perfect for 3-Mode System**

- **Semantic Knowledge Management**: Automatic graph building from conversations
- **Obsidian Integration**: Works with existing Obsidian workflows
- **Multi-Project Support**: Separate knowledge bases for each mode
- **Real-time Sync**: Automatic file synchronization with watch mode
- **Markdown Storage**: Human-readable knowledge files
- **Full Control**: You own all your data
- **High Trust Score**: 8.0/10 reliability
- **MCP Server**: Native MCP server integration

## 🔧 **INSTALLATION & SETUP**

### **Step 1: Install Basic Memory**

```bash
# Using pip (recommended for Windows)
pip install basic-memory

# Verify installation
python -c "import basic_memory; print(basic_memory.__version__)"
```

### **Step 2: Configure MCP Server**

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "python",
      "args": [
        "-m",
        "basic_memory.mcp"
      ],
      "env": {
        "BASIC_MEMORY_PROJECT_ROOT": "./memory-bank"
      },
      "autoApprove": [
        "list_projects",
        "list_project_files",
        "memory_bank_read",
        "memory_bank_write",
        "memory_bank_update"
      ],
      "autoStart": true,
      "description": "Basic Memory MCP server for semantic knowledge management with Obsidian integration."
    }
  }
}
```

### **Step 3: Set Up Projects**

Create mode-specific projects:

```bash
# Create strategic project
mkdir -p memory-bank/strategic
echo "# Strategic Knowledge Base" > memory-bank/strategic/README.md

# Create tactical project  
mkdir -p memory-bank/tactical
echo "# Tactical Knowledge Base" > memory-bank/tactical/README.md

# Create operational project
mkdir -p memory-bank/operational
echo "# Operational Knowledge Base" > memory-bank/operational/README.md
```

## 🔄 **3-MODE SYSTEM INTEGRATION**

### **🎭 STRATEGIC MODE + Basic Memory**

**Knowledge Categories**:

- **System Architecture**: Workflow optimization insights
- **Tool Configurations**: Successful tool setups and configurations
- **Meta-Patterns**: Patterns across multiple projects
- **Strategic Decisions**: Planning decisions and rationales

**Usage Patterns**:

```bash
# Store strategic insights
basic-memory store "workflow-optimization" --content "Hierarchical rule loading reduces context usage by 40%"

# Search for strategic patterns
basic-memory search "workflow" --project strategic --limit 10

# Link related concepts
basic-memory link "workflow-optimization" "rule-loading" "performance-improvement"
```

### **🎨 TACTICAL MODE + Basic Memory**

**Knowledge Categories**:

- **Design Decisions**: UI/UX design decisions and rationales
- **Requirements Patterns**: Common requirement structures
- **Architecture Templates**: Reusable architectural patterns
- **Planning Templates**: Planning approaches and methodologies

**Usage Patterns**:

```bash
# Store design decisions
basic-memory store "ui-pattern-decision" --content "Using Pico CSS for minimal, modern UI design"

# Search for design patterns
basic-memory search "ui" --project tactical --limit 5

# Create planning templates
basic-memory store "sprint-planning-template" --content "Standard sprint planning approach with user stories"
```

### **⚒️ OPERATIONAL MODE + Basic Memory**

**Knowledge Categories**:

- **Implementation Patterns**: Code patterns and solutions
- **Debug Solutions**: Problem resolution approaches
- **Performance Optimizations**: Performance improvement techniques
- **Deployment Configs**: Deployment and configuration setups

**Usage Patterns**:

```bash
# Store implementation patterns
basic-memory store "react-hook-pattern" --content "Custom hook for form state management"

# Search for solutions
basic-memory search "debug" --project operational --limit 10

# Store performance optimizations
basic-memory store "css-optimization" --content "Consolidating CSS reduces bundle size by 30%"
```

## 🔍 **KNOWLEDGE MANAGEMENT**

### **Semantic Search**

```bash
# Search across all projects
basic-memory search "workflow" --limit 20

# Search specific project
basic-memory search "react" --project operational --limit 10

# Search with filters
basic-memory search "optimization" --project strategic --type pattern --limit 5
```

### **Knowledge Relationships**

Basic Memory automatically builds semantic connections:

```bash
# Store related concepts
basic-memory store "react-hooks" --content "React Hooks for state management"
basic-memory store "useState" --content "useState hook for component state"
basic-memory store "useEffect" --content "useEffect hook for side effects"

# Basic Memory automatically connects these concepts
```

### **Multi-Project Knowledge Sharing**

```bash
# Share knowledge between projects
basic-memory link --from strategic --to tactical "workflow-patterns"
basic-memory link --from tactical --to operational "implementation-patterns"
```

### **Knowledge Export/Import**

```bash
# Export knowledge for backup
basic-memory export --project strategic --format markdown

# Import knowledge from backup
basic-memory import --project strategic --file backup.md
```

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **Installation Problems**

   ```bash
   # Check Python version
   python --version
   
   # Reinstall if needed
   pip uninstall basic-memory
   pip install basic-memory
   ```

2. **MCP Server Not Starting**

   ```bash
   # Check if Basic Memory is installed
   python -c "import basic_memory; print('Basic Memory installed')"
   
   # Test MCP server directly
   python -m basic_memory.mcp
   ```

3. **File Permission Issues**

   ```bash
   # Check directory permissions
   ls -la memory-bank/
   
   # Fix permissions if needed
   chmod 755 memory-bank/
   ```

### **Verification Commands**

```bash
# Test Basic Memory installation
basic-memory --version

# Test MCP server
python -m basic_memory.mcp --help

# List available projects
basic-memory list-projects

# Test file operations
basic-memory store "test" --content "Test knowledge entry"
basic-memory search "test" --limit 1
```

## 📚 **REFERENCES**

- [Basic Memory Documentation](https://docs.basicmemory.com/)
- [Basic Memory GitHub Repository](https://github.com/basicmachines-co/basic-memory)
- MCP Ecosystem Overview
- System Documentation
- Memory Bank Workflow

## 🎯 **NEXT STEPS**

1. **Install Basic Memory** using the provided commands
2. **Configure MCP server** in your `mcp.json`
3. **Set up mode-specific projects** in your memory-bank directory
4. **Start using Basic Memory** with your 3-mode system
5. **Integrate with Obsidian** for enhanced visualization

---

**Last Updated**: 2025-07-23  
**Version**: 1.0  
**Status**: Complete Basic Memory integration guide
