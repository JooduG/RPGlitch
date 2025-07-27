# 🕐 Time MCP Usage Example

**Date**: 2025-07-22 (from Time MCP)
**Generated**: 2025-07-22T02:06:33+02:00 (from Time MCP)
**Timezone**: Europe/Berlin

## 📝 **CORRECT TIME MCP USAGE**

### **Document Headers**

```markdown
# Project Documentation

**Date**: 2025-07-22 (from Time MCP)
**Last Updated**: 2025-07-22 (from Time MCP)
**Generated**: 2025-07-22T02:06:33+02:00 (from Time MCP)
**Timezone**: Europe/Berlin
```

### **File Metadata**

```yaml
---
date: 2025-07-22 (from Time MCP)
created: 2025-07-22T02:06:33+02:00 (from Time MCP)
last_updated: 2025-07-22T02:06:33+02:00 (from Time MCP)
timezone: Europe/Berlin
---
```

### **Progress Tracking**

```markdown
## Project Progress

**Phase**: Phase 3A - Foundation Enhancement
**Started**: 2025-07-22 (from Time MCP)
**Last Updated**: 2025-07-22 (from Time MCP)
**Duration**: 0 days (calculated from Time MCP timestamps)
```

### **Task Management**

```markdown
## Current Tasks

### CSS Performance Optimization
- **Status**: In Progress
- **Started**: 2025-07-22 (from Time MCP)
- **Estimated Completion**: 2025-07-24 (calculated from Time MCP)
- **Duration**: 2 days (calculated from Time MCP timestamps)

### AI Rule Selection Integration
- **Status**: Planned
- **Planned Start**: 2025-07-24 (calculated from Time MCP)
- **Estimated Duration**: 3 days (calculated from Time MCP timestamps)
```

## ❌ **INCORRECT USAGE (DO NOT DO THIS)**

### **Hardcoded Dates**

```markdown
# Project Documentation

**Date**: 2025-01-03  ❌ HARDCODED
**Last Updated**: 2025-01-02  ❌ HARDCODED
**Generated**: 2025-01-03T14:30:00+01:00  ❌ HARDCODED
```

### **Manual Date Entry**

```yaml
---
date: 2025-01-03  ❌ MANUALLY TYPED
created: 2025-01-02  ❌ MANUALLY TYPED
last_updated: 2025-01-03  ❌ MANUALLY TYPED
---
```

## 🔧 **IMPLEMENTATION WORKFLOW**

### **Step 1: Get Current Time**

```javascript
// ALWAYS start by getting current time
const currentTime = await mcp_time_get_current_time({ timezone: 'Europe/Berlin' });

// Result:
// {
//   timezone: "Europe/Berlin",
//   datetime: "2025-07-22T02:06:33+02:00",
//   is_dst: true
// }
```

### **Step 2: Extract Date Components**

```javascript
// Extract date for documentation
const date = currentTime.datetime.split('T')[0]; // "2025-07-22"

// Extract full datetime for timestamps
const datetime = currentTime.datetime; // "2025-07-22T02:06:33+02:00"

// Extract timezone
const timezone = currentTime.timezone; // "Europe/Berlin"
```

### **Step 3: Apply to Documentation**

```markdown
**Date**: ${date} (from Time MCP)
**Generated**: ${datetime} (from Time MCP)
**Timezone**: ${timezone}
```

## 📊 **TIME MCP INTEGRATION BENEFITS**

### **✅ Consistency**

- All dates use the same format
- Same timezone across all documents
- Consistent timestamp precision

### **✅ Accuracy**

- Always current and up-to-date
- No manual date entry errors
- Automatic timezone handling

### **✅ Maintainability**

- No need to manually update dates
- Automatic timestamp generation
- Easy to track document age

### **✅ Professionalism**

- Standardized date formatting
- Timezone awareness
- Professional documentation standards

## 🎯 **ENFORCEMENT CHECKLIST**

### **Before Writing Documentation**

- [ ] Time MCP called and working
- [ ] Current date retrieved
- [ ] Timezone confirmed (Europe/Berlin)
- [ ] No hardcoded dates in content

### **After Writing Documentation**

- [ ] All dates sourced from Time MCP
- [ ] No hardcoded date patterns found
- [ ] Timezone information included
- [ ] Format consistency verified

### **Quality Assurance**

- [ ] Scan for hardcoded date patterns
- [ ] Verify Time MCP integration
- [ ] Test date accuracy
- [ ] Validate timezone handling

## 🚨 **CRITICAL REMINDERS**

1. **NEVER hardcode dates** - Always use Time MCP
2. **ALWAYS include timezone** - Default to Europe/Berlin
3. **MAINTAIN consistency** - Use same format everywhere
4. **VALIDATE accuracy** - Verify Time MCP is working
5. **DOCUMENT exceptions** - If Time MCP fails, note it

---

**🕐 TIME MCP EXAMPLE: Demonstrating proper date handling with real-time accuracy!**
