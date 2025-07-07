# Agent 1 (Primary) Startup Instructions

## 🎯 Your Role: JavaScript Logic & System Coordinator

### **Primary Mode (Working Alone)**
- **Full Ownership**: You own ALL files (RPGlitch.js, RPGlitch.html, RPGlitch.css)
- **Complete Development**: Handle all aspects of development
- **Standard Rules**: Follow all existing rules normally

### **Multi-Agent Mode (Working with Agent 2)**
- **Your Ownership**: RPGlitch.js + coordination
- **Agent 2 Ownership**: RPGlitch.html + RPGlitch.css
- **Coordination**: You're the primary coordinator

---

## 🚀 Startup Process

### 1. **Check Session State**
Read `multi-agent/session-state.md` to understand current situation:
- **Single Agent**: You're working alone
- **Multi-Agent Active**: Agent 2 is working on UI files
- **Handoff Pending**: Agent 2 needs handoff prompt
- **Handback Pending**: Agent 2 is returning work to you

### 2. **Check Current Ownership**
Read `multi-agent/current-ownership.md`:
- **Your Files**: Always RPGlitch.js
- **Shared Files**: What you can/cannot touch right now
- **Agent 2 Files**: What Agent 2 currently owns

### 3. **Execute Appropriate Mode**
- **Single Agent**: Proceed with full development
- **Multi-Agent**: Respect file boundaries, coordinate via Git
- **Handoff Mode**: Prepare handoff prompt when user requests
- **Handback Mode**: Process returned work and resume full control

---

## 🔄 Handoff Process (When User Says "handoff")

### **Step 1: Prepare Handoff**
1. **Commit Current Work**: Ensure RPGlitch.js is committed
2. **Document Current State**: What you're working on, next steps
3. **Identify UI Requirements**: What Agent 2 needs to work on
4. **Create Handoff Prompt**: Use template below

### **Step 2: Generate Handoff Prompt**
```markdown
# HANDOFF TO AGENT 2

## Current Feature: [FEATURE NAME]
- **Status**: [Current status]
- **Next Steps**: [What Agent 2 should work on]

## File Ownership Transfer
- **Agent 1 (You) Own**: RPGlitch.js only
- **Agent 2 (New) Own**: RPGlitch.html + RPGlitch.css
- **DO NOT EDIT**: Agent 2's files until handback

## Technical Requirements
- **DOM Elements Needed**: [List specific IDs/classes needed]
- **CSS Classes Required**: [List classes your JS expects]
- **Data Attributes**: [List data-* attributes your JS uses]
- **Event Targets**: [List elements that need event handlers]

## Coordination Points
- **Your Recent Changes**: [What you just modified in JS]
- **Integration Notes**: [How JS and UI connect]
- **Testing Requirements**: [What needs testing]

## Git Communication
- Use format: `[JS] your changes` and `[UI] your changes`
- Commit frequently with clear messages
- Signal when UI work is ready for integration testing

## Session State
- **Mode**: Multi-Agent Active
- **Primary Agent**: Agent 1 (JavaScript Logic)
- **Secondary Agent**: Agent 2 (UI/Design)
- **Handoff Date**: [DATE]
```

### **Step 3: Update Session State**
Update `multi-agent/session-state.md`:
- **Status**: Multi-Agent Active
- **Agent 1**: JavaScript Logic (RPGlitch.js)
- **Agent 2**: UI/Design (RPGlitch.html, RPGlitch.css)

### **Step 4: Stop Editing UI Files**
- **DO NOT EDIT**: RPGlitch.html or RPGlitch.css
- **Focus Only**: RPGlitch.js and coordination
- **Communicate**: Via Git commits and issues

---

## 🔙 Handback Process (When Agent 2 Returns Work)

### **Step 1: Receive Handback**
Agent 2 will provide handback prompt with:
- **Work Completed**: What they accomplished
- **Files Modified**: Changes made to HTML/CSS
- **Integration Notes**: How their work connects to your JS
- **Issues Found**: Any problems or questions

### **Step 2: Integration Testing**
1. **Review Changes**: Check Agent 2's HTML/CSS modifications
2. **Test Integration**: Ensure JS still works with UI changes
3. **Validate Functionality**: Test complete feature workflow
4. **Fix Integration Issues**: Address any JS/UI mismatches

### **Step 3: Resume Full Ownership**
1. **Update Session State**: Back to Single Agent mode
2. **Update Ownership**: You now own all files again
3. **Continue Development**: Resume normal development workflow

---

## 🚨 Recovery Process (Agent 2 Unavailable)

### **If Agent 2 Quits Mid-Development**
1. **Check Current State**: Read `multi-agent/session-state.md`
2. **Review Agent 2 Work**: Check their last commits
3. **Assess Completion**: Determine what's finished/unfinished
4. **Resume Full Control**: Take back HTML/CSS ownership
5. **Update Session State**: Back to Single Agent mode
6. **Continue Development**: Complete any unfinished UI work

### **Recovery Checklist**
- [ ] Reviewed Agent 2's last commits
- [ ] Identified incomplete UI work
- [ ] Tested current JS/UI integration
- [ ] Updated session state to Single Agent
- [ ] Resumed full file ownership
- [ ] Continued development normally

---

## 📋 File Ownership Rules

### **Single Agent Mode**
- **Your Files**: RPGlitch.js, RPGlitch.html, RPGlitch.css, build-perchance.js
- **Your Responsibility**: Complete development workflow

### **Multi-Agent Mode**
- **Your Files**: RPGlitch.js only
- **Agent 2 Files**: RPGlitch.html, RPGlitch.css
- **Shared Files**: build-perchance.js (coordinate changes)
- **Coordination**: Git commits, clear communication

### **Handoff/Handback Mode**
- **During Handoff**: Prepare work, create handoff prompt
- **During Multi-Agent**: Respect boundaries, coordinate via Git
- **During Handback**: Integrate work, test, resume full control

---

## 🎯 Success Criteria

### **Successful Handoff**
- [ ] Agent 2 understands current feature requirements
- [ ] File ownership clearly transferred
- [ ] Integration points documented
- [ ] Session state updated correctly

### **Successful Handback**
- [ ] Agent 2 work integrated successfully
- [ ] All functionality tested and working
- [ ] Session state returned to Single Agent
- [ ] Full file ownership resumed

### **Successful Recovery**
- [ ] Agent 2 work assessed and continued
- [ ] No functionality lost
- [ ] Development resumed normally
- [ ] Session state corrected

---

## 🔧 Current Rules Integration

**All existing rules still apply:**
- Enhanced Error Handling
- Code Quality Standards
- Perchance Best Practices
- Communication Style
- Context Management
- Basic Security

**Additional Multi-Agent Rules:**
- Respect file ownership boundaries
- Communicate via Git commits
- Coordinate integration points
- Maintain session state accuracy 