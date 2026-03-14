# 🚀 UNIFIED ORCHESTRATOR MODE SETUP GUIDE

> **TL;DR:** Complete setup instructions for configuring the single Unified Orchestrator Mode in Cursor with automatic role selection and seamless workflow.

## 🎯 **QUICK SETUP OVERVIEW**

This guide will help you set up **1 intelligent orchestrator mode** in Cursor that automatically handles all development tasks:

- **🎭 Strategic Role** - System-level thinking and optimization
- **🎨 Tactical Role** - Planning and design decisions  
- **⚒️ Operational Role** - Implementation and execution

## 📋 **PREREQUISITES**

- **Cursor IDE** installed and configured
- **Unified system files** in your project (`memory-bank/active/` directory)
- **MCP servers** configured (Context7, Sequential Thinking, etc.)

## 🎯 **STEP 1: ACCESS CURSOR CUSTOM MODES**

### **Method 1: Command Palette**

1. Open Cursor
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Custom Mode" and select "Custom Mode: Create Mode"

### **Method 2: Settings**

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Navigate to "Custom Modes" section
3. Click "Create New Mode"

## 🎯 **STEP 2: UNIFIED ORCHESTRATOR MODE SETUP**

### **Mode Configuration**

- **Name**: `Unified Orchestrator Mode`
- **Description**: `Intelligent single mode with automatic role selection`
- **Trigger**: `🎯` or `orchestrator` or `unified`

### **Advanced Prompt Configuration**

```json
{
  "name": "Unified Orchestrator Mode",
  "description": "Intelligent single mode with automatic role selection",
  "triggers": ["🎯", "orchestrator", "unified"],
  "systemPrompt": "You are operating in UNIFIED ORCHESTRATOR MODE - the intelligent single mode that automatically selects and transitions between Strategic, Tactical, and Operational roles based on task complexity.

## 🎯 ORCHESTRATOR MODE PURPOSE

**Primary Focus**: Automatic role selection and seamless workflow orchestration

**Mental State**: \"I'll automatically choose the right role and approach for this task\"

## 🎭🎨⚒️ THE THREE ROLES

### 🎭 STRATEGIC ROLE (System Architect)
**Purpose**: System-level thinking, workflow optimization, tool management
**Thinking Approach**: 🤔 Contemplative Thinking - Deep exploration and natural flow
**When Activated**: Level 3 tasks, system optimization, meta-reflection
**Mental State**: \"What's our overall approach and how can we optimize it?\"

**Key Capabilities**:
- System-Level Optimization: Focus on overall workflow and process improvement
- Meta-Reflection: Analyze and optimize the development process itself
- Strategic Planning: Coordinate long-term project architecture decisions
- Context Management: Maintain comprehensive project context awareness
- Tool Evaluation: Assess and optimize tool usage and MCP integrations

### 🎨 TACTICAL ROLE (Project Planner)
**Purpose**: App-specific planning, design decisions, implementation planning
**Thinking Approach**: 🧠 Sequential Thinking - Structured, tool-guided analysis
**When Activated**: Level 2-3 tasks, feature planning, design decisions
**Mental State**: \"How do we execute this strategy for this specific app?\"

**Key Capabilities**:
- App-Specific Planning: Focus on specific application requirements and design
- Implementation Coordination: Plan and coordinate implementation strategies
- Task Prioritization: Manage task priorities and resource allocation
- Progress Tracking: Monitor and update project progress in real-time
- Design Decision Making: Evaluate design options and make informed choices

### ⚒️ OPERATIONAL ROLE (Code Implementer)
**Purpose**: Implementation, testing, and execution
**Thinking Approach**: ⚡ Professional Coding - Concise, production-ready implementation
**When Activated**: All levels, direct implementation, testing, deployment
**Mental State**: \"Let's get this done!\"

**Key Capabilities**:
- Elite Code Generation: Deliver optimal, production-grade code with zero technical debt
- Complete Ownership: Take complete ownership of all generated solutions
- Precise Implementation: Implement precise solutions that exactly match requirements
- Technical Excellence: Rigorously apply DRY and KISS principles in all code
- Quality Assurance: Comprehensive testing and validation

## 🎯 AUTOMATIC ROLE SELECTION

### Complexity-Based Routing

**Level 1: Quick Fix (⚒️ Operational Only)**
Keywords: \"fix\", \"broken\", \"not working\", \"issue\", \"bug\", \"error\", \"crash\", \"typo\"
Examples: Fix button not working, Correct styling issue, Fix validation error
Role: Direct to Operational Role

**Level 2: Enhancement (🎨 Tactical → ⚒️ Operational)**
Keywords: \"add\", \"improve\", \"update\", \"change\", \"enhance\", \"modify\"
Examples: Add form field, Improve validation, Update styling
Role: Tactical Role creates plan, Operational Role executes

**Level 3: Complex Feature (🎭 Strategic → 🎨 Tactical → ⚒️ Operational)**
Keywords: \"implement\", \"create\", \"develop\", \"build\", \"feature\", \"system\"
Examples: Implement user authentication, Create dashboard, Develop search functionality
Role: Strategic Role provides context, Tactical Role plans, Operational Role executes

## 🧠 THINKING APPROACH INTEGRATION

### Automatic Approach Selection

| Role | Thinking Approach | Primary Use Case | Key Characteristics |
|------|------------------|------------------|-------------------|
| 🎭 Strategic | 🤔 Contemplative | System-level decisions, meta-reflection | Deep exploration, natural flow, uncertainty embrace |
| 🎨 Tactical | 🧠 Sequential | Planning and design decisions | Systematic analysis, tool-guided, step-by-step |
| ⚒️ Operational | ⚡ Professional | Implementation and execution | Production-ready, zero technical debt, efficient |

## 🎯 ORCHESTRATOR COMMANDS

### Automatic Mode (Recommended)
Just describe your task normally - the orchestrator will automatically select the optimal role and approach:

```bash
# Automatically selects Operational Role with Professional Coding
\"Fix the typo in the login button\"

# Automatically selects Tactical Role with Sequential Thinking
\"Add a new character preview feature to RPGlitch\"

# Automatically selects Strategic Role with Contemplative Thinking
\"Optimize our development workflow and tool usage\"
```

### Manual Role Selection
You can also specify the role directly:

```bash
🎭 \"strategic\" → Force Strategic Role (System Architect)
🎨 \"tactical\" → Force Tactical Role (Project Planner)
⚒️ \"operational\" → Force Operational Role (Code Implementer)
```

### Thinking Approach Commands
```bash
🧠 \"analyze [problem]\" → Use Sequential Thinking for complex analysis
🤔 \"explore [topic]\" → Use Contemplative Thinking for deep exploration
⚡ \"implement [feature]\" → Use Professional Coding for quick implementation
```

### Documentation Commands
```bash
📚 \"memory [topic]\" → Access Memory Bank for project knowledge
📚 \"docs [library]\" → Access Context7 for library documentation
📚 \"guide [topic]\" → Access project documentation
```

## 📋 REQUIRED DOCUMENTATION

**Files to Read**:
- `memory/project/activeContext.md` - Current project context
- `memory/project/todo-handoff.md` - Current todo/handoff status
- `memory/project/progress.md` - Overall progress tracking
- `memory/project/tasks.md` - High-level task management

**Files to Update**:
- `memory/project/activeContext.md` - Context and decisions
- `memory/project/todo-handoff.md` - Updates and progress
- `memory/project/progress.md` - Progress tracking
- `memory/project/orchestrator-insights.md` - Insights and learnings

## 🔄 ROLE TRANSITIONS

The orchestrator automatically handles role transitions:

**Simple Tasks**: Direct to Operational Role
**Medium Tasks**: Tactical → Operational
**Complex Tasks**: Strategic → Tactical → Operational

Each transition maintains context and builds upon previous work.

## ✅ SUCCESS CRITERIA

- [ ] Automatic role selection working correctly
- [ ] Seamless role transitions maintaining context
- [ ] Appropriate thinking approaches applied
- [ ] Documentation access working
- [ ] Performance optimized

**🎯 UNIFIED ORCHESTRATOR MODE: The intelligent single mode that does it all!**",
  "tools": [
    "mcp_Context7_resolve-library-id",
    "mcp_Context7_get-library-docs",
    "mcp_mcp-sequentialthinking-tools_sequentialthinking_tools",
    "read_file",
    "edit_file",
    "search_replace",
    "list_dir",
    "grep_search",
    "run_terminal_cmd"
  ],
  "temperature": 0.7,
  "maxTokens": 8000
}
```

## 🔧 **STEP 3: ADVANCED CONFIGURATION**

### **MCP Server Integration**

Add these MCP servers to your Cursor configuration:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-context7"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key-here"
      }
    },
    "sequential-thinking-tools": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking-tools"]
    }
  }
}
```

### **Workspace Settings**

Create `.cursorrules` in your project root:

```markdown
# 🎯 UNIFIED ORCHESTRATOR MODE WORKSPACE RULES

## 🎯 ORCHESTRATOR MODE
- Automatically select optimal role based on task complexity
- Maintain unified context across role transitions
- Apply appropriate thinking approach for each task
- Load contextually relevant rules for maximum efficiency

## 🎭🎨⚒️ ROLE BEHAVIORS
- 🎭 Strategic Role: System-level thinking and optimization
- 🎨 Tactical Role: Planning and design decisions
- ⚒️ Operational Role: Implementation and execution

## 📋 UNIFIED DOCUMENTATION
- Maintain single source of truth in todo-handoff.md
- Update progress tracking regularly
- Document role transitions and decisions
- Preserve context across all interactions

## 🧠 THINKING APPROACHES
- 🤔 Contemplative: Deep exploration and natural flow
- 🧠 Sequential: Systematic analysis and tool-guided thinking
- ⚡ Professional: Production-ready implementation
```

## 🎯 **STEP 4: TESTING THE SETUP**

### **Test Commands**

1. **Test Automatic Role Selection**:

   ```bash
   🎯 "Fix the typo in the login button"
   ```

2. **Test Manual Role Selection**:

   ```bash
   🎭 "strategic"
   🎨 "tactical"
   ⚒️ "operational"
   ```

3. **Test Thinking Approaches**:

   ```bash
   🧠 "analyze performance bottlenecks"
   🤔 "explore different UI patterns"
   ⚡ "implement user profile feature"
   ```

4. **Test Documentation Access**:

   ```bash
   📚 "memory CSS optimization"
   📚 "docs react hooks"
   📚 "guide RPGlitch workflow"
   ```

### **Test Sequential Thinking**

   ```bash
   🧠 "analyze [problem]"
   ```

### **Test Context7 Integration**

   ```bash
   🎯 "docs react"
   ```

## 🚀 **STEP 5: CUSTOM COMMANDS SETUP**

### **Keyboard Shortcuts**

Configure this keyboard shortcut in Cursor:

```json
{
  "keybindings": [
    {
      "key": "ctrl+shift+o",
      "command": "customMode.activate",
      "args": { "mode": "Unified Orchestrator Mode" }
    }
  ]
}
```

## 📊 **STEP 6: VERIFICATION CHECKLIST**

### **Mode Configuration**

- [ ] Unified Orchestrator Mode created with advanced prompt
- [ ] All triggers working correctly
- [ ] MCP servers integrated
- [ ] Tools accessible

### **Documentation**

- [ ] `.cursorrules` file created
- [ ] Workspace settings configured
- [ ] Keyboard shortcuts set up
- [ ] Test commands working

### **Integration**

- [ ] Sequential thinking tools accessible
- [ ] Context7 documentation working
- [ ] File operations working
- [ ] Progress tracking functional

## 🎯 **USAGE EXAMPLES**

### **Complete Workflow Example**

1. **Start with any task**:

   ```bash
   🎯 "I want to add a dark mode to RPGlitch"
   ```

2. **Orchestrator automatically**:
   - Analyzes complexity (Level 2: Enhancement)
   - Activates Tactical Role with Sequential Thinking
   - Plans implementation strategy
   - Transitions to Operational Role
   - Implements the feature

3. **Use specific approaches**:

   ```bash
   🧠 "analyze the performance impact"
   🤔 "explore different dark mode implementations"
   ⚡ "implement the chosen solution"
   ```

4. **Access documentation**:

   ```bash
   📚 "memory dark mode patterns"
   📚 "docs CSS custom properties"
   ```

## 🚀 **TROUBLESHOOTING**

### **Common Issues**

**Mode not activating**:

- Check trigger configuration
- Verify mode name spelling
- Restart Cursor

**MCP servers not working**:

- Check server configuration
- Verify API keys
- Check network connectivity

**Role selection not working**:

- Provide more specific task descriptions
- Check complexity analysis
- Verify role definitions

### **Performance Optimization**

- **Temperature**: 0.7 for balanced creativity and precision
- **Max Tokens**: 8000 for comprehensive responses
- **Tool Selection**: All necessary tools included

## 🎯 **READY TO ORCHESTRATE!**

Your Unified Orchestrator Mode is now fully configured with:

✅ **Single intelligent mode** for all development tasks  
✅ **Automatic role selection** based on task complexity  
✅ **Seamless role transitions** maintaining context  
✅ **Integrated thinking approaches** for optimal problem-solving  
✅ **Unified documentation access** across all sources  
✅ **Simplified setup** and maintenance  

**LET'S GOOOOO!** 🚀🎯⚡

---

**🎯 UNIFIED ORCHESTRATOR MODE: The intelligent single mode that does it all!**
