# MCP Server Configuration Guide

## Overview

This guide provides detailed configuration instructions for setting up MCP servers in your development environment, specifically for use with the Unified Orchestrator Mode and 3-mode development system.

## 🎯 **ESSENTIAL MCP SERVERS**

### **1. Context7 MCP Server**

**Purpose**: Real-time documentation access for libraries, frameworks, and technologies

**Installation**:

```bash
npm install -g @context7/mcp
```

**Configuration**:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**API Key Setup**:

1. Visit [Context7](https://context7.com)
2. Create an account and generate an API key
3. Add the key to your environment variables

**Usage Examples**:

```javascript
// Resolve library ID
const libraryId = await context7.resolveLibraryId("react");

// Get documentation
const docs = await context7.getLibraryDocs({
  context7CompatibleLibraryID: "/context7/react_dev",
  topic: "hooks",
  tokens: 5000
});
```

### **2. Basic Memory MCP Server**

**Purpose**: Knowledge management system with persistent semantic graph

**Installation**:

```bash
pip install basic-memory-mcp
```

**Configuration**:

```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "python",
      "args": ["-m", "basic_memory.mcp"],
      "env": {
        "BASIC_MEMORY_PROJECT_ROOT": "./memory-bank"
      }
    }
  }
}
```

**Project Structure**:

```md
memory-bank/
├── active/             # Active project context
├── strategic/          # Strategic planning and analysis
├── tactical/           # Tactical planning and coordination
├── operational/        # Operational implementation
├── archives/           # Archived content
└── projects/           # Project-specific memory
```

**Usage Examples**:

```javascript
// Read project context
const context = await memoryBank.memory_bank_read({
  project: "rpglitch",
  file: "activeContext.md"
});

// Update progress
await memoryBank.memory_bank_update({
  project: "rpglitch",
  file: "progress.md",
  content: "✅ Feature implementation completed"
});
```

### **3. Time MCP Server**

**Purpose**: Mandatory date standardization and timezone handling

**Installation**:

```bash
npm install -g @modelcontextprotocol/server-time
```

**Configuration**:

```json
{
  "mcpServers": {
    "time": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    }
  }
}
```

**Usage Examples**:

```javascript
// Get current time
const currentTime = await time.getCurrentTime({
  timezone: "Europe/Berlin"
});

// Convert time between timezones
const convertedTime = await time.convertTime({
  sourceTimezone: "Europe/Berlin",
  targetTimezone: "America/New_York",
  time: "14:30"
});
```

### **4. Sequential Thinking Tools**

**Purpose**: Advanced problem-solving with structured thinking

**Installation**:

```bash
npm install -g @modelcontextprotocol/server-sequential-thinking-tools
```

**Configuration**:

```json
{
  "mcpServers": {
    "sequential-thinking-tools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking-tools"]
    }
  }
}
```

**Usage Examples**:

```javascript
// Start sequential thinking process
const thinkingProcess = await sequentialThinkingTools.start({
  problem: "Analyze performance bottlenecks in React app",
  context: { projectContext, performanceData },
  tools: ["playwright", "context7", "memory_bank"]
});

// Continue thinking process
const nextStep = await sequentialThinkingTools.continue({
  thought: "Based on the analysis, I need to investigate the component rendering",
  nextThoughtNeeded: true,
  thoughtNumber: 3,
  totalThoughts: 5
});
```

## 🔧 **COMPLETE CONFIGURATION**

### **Full MCP Configuration**

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key-here"
      }
    },
    "basic-memory": {
      "command": "python",
      "args": ["-m", "basic_memory.mcp"],
      "env": {
        "BASIC_MEMORY_PROJECT_ROOT": "./memory-bank"
      }
    },
    "time": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    },
    "sequential-thinking-tools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking-tools"]
    }
  }
}
```

### **Environment Variables**

Create a `.env` file in your project root:

```env
# Context7 API Key
CONTEXT7_API_KEY=your-api-key-here

# Basic Memory Project Root
BASIC_MEMORY_PROJECT_ROOT=./memory-bank

# Time Zone (optional, defaults to Europe/Berlin)
DEFAULT_TIMEZONE=Europe/Berlin
```

## 🎯 **INTEGRATION WITH UNIFIED ORCHESTRATOR MODE**

### **Tool Integration**

The Unified Orchestrator Mode automatically uses these MCP servers:

```javascript
// Automatic tool selection based on task complexity
const tools = [
  "mcp_Context7_resolve-library-id",
  "mcp_Context7_get-library-docs",
  "mcp_mcp-sequentialthinking-tools_sequentialthinking_tools",
  "read_file",
  "edit_file",
  "search_replace",
  "list_dir",
  "grep_search"
];
```

### **Role-Based MCP Usage**

**🎭 Strategic Role**:

- Context7: Access current best practices
- Basic Memory: Store strategic insights
- Time MCP: Track planning dates
- Sequential Thinking: Complex system analysis

**🎨 Tactical Role**:

- Context7: Get implementation guidance
- Basic Memory: Store design decisions
- Time MCP: Track milestone dates
- Sequential Thinking: Feature planning

**⚒️ Operational Role**:

- Context7: Access implementation details
- Basic Memory: Store implementation patterns
- Time MCP: Track completion dates
- Sequential Thinking: Implementation planning

## 🚀 **TESTING MCP SERVERS**

### **Test Commands**

1. **Test Context7**:

   ```bash
   🎯 "docs react hooks"
   ```

2. **Test Basic Memory**:

   ```bash
   🎯 "memory project context"
   ```

3. **Test Time MCP**:

   ```bash
   🎯 "current time"
   ```

4. **Test Sequential Thinking**:

   ```bash
   🧠 "analyze performance bottlenecks"
   ```

### **Verification Checklist**

- [ ] Context7 resolves library IDs correctly
- [ ] Basic Memory reads and writes project data
- [ ] Time MCP provides current timestamps
- [ ] Sequential Thinking processes complex problems
- [ ] All servers integrate with Unified Orchestrator Mode
- [ ] Error handling works correctly
- [ ] Performance is acceptable

## 🎯 **TROUBLESHOOTING**

### **Common Issues**

**Context7 Not Working**:

- Check API key is valid and active
- Verify network connectivity
- Check rate limits

**Basic Memory Errors**:

- Verify project root path is correct
- Check Python environment and dependencies
- Ensure memory-bank directory exists

**Time MCP Issues**:

- Verify timezone names are valid
- Check date/time format requirements
- Test with different timezones

**Sequential Thinking Problems**:

- Check tool availability
- Verify context data is valid
- Monitor token usage

### **Debug Commands**

```bash
# Test MCP server connectivity
🎯 "test mcp servers"

# Check server status
🎯 "mcp status"

# Verify configuration
🎯 "mcp config"
```

## 📚 **ADDITIONAL RESOURCES**

- [MCP Ecosystem](../../rules/mcp-ecosystem.md) - Complete MCP reference
- [Unified Orchestrator Mode Setup](./unified-orchestrator-mode.md) - Mode configuration
- [Context7 Documentation](https://context7.com/docs) - Official Context7 docs
- [Basic Memory Documentation](https://github.com/basic-memory/mcp) - Basic Memory docs
- [MCP Protocol Documentation](https://modelcontextprotocol.io/) - Official MCP docs

---

**Last Updated**: 2025-07-24  
**Version**: 1.0  
**Status**: Complete MCP server configuration guide
