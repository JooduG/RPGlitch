---
description: Template for project setup and configuration in the memory bank system.
alwaysApply: false
---

# **📁 PROJECT TEMPLATE: Structured project organization!**

> **TL;DR:** Template for setting up new projects in the memory bank system with proper structure and metadata.

## 📁 **PROJECT STRUCTURE**

### **Basic Project File**

```markdown
---
tags:
- [project-name]
- [category]
- [technology-stack]
permalink: projects-[project-name]
---

# [Project Name]

## Context

[Brief description of what this project is and its purpose]

## Purpose

[Detailed explanation of the project's goals and objectives]

## Observations

- [category] [Observation about the project] #tag
- [type] [Another observation] #tag
- [aspect] [Key insight or decision] #tag

## Relations

- part_of [[Parent Project]]
- uses [[Technology/Tool]]
- implements [[Architecture Pattern]]
- contains [[Sub-component]]

## Created

**Date**: [Date] (from Time MCP)
**Purpose**: [Brief creation purpose]
```

## 📁 **PROJECT CATEGORIES**

### **Development Projects**

```markdown
tags:
- development
- [language/framework]
- [project-type]
```

### **Documentation Projects**

```markdown
tags:
- documentation
- [doc-type]
- [audience]
```

### **Infrastructure Projects**

```markdown
tags:
- infrastructure
- [platform]
- [tool-category]
```

### **Research Projects**

```markdown
tags:
- research
- [domain]
- [methodology]
```

## 📁 **OBSERVATION PATTERNS**

### **Technical Observations**

```markdown
- [architecture] System uses modular design pattern #modularity
- [performance] Optimized for speed with caching layer #optimization
- [security] Implements OAuth2 authentication #security
- [scalability] Designed for horizontal scaling #scalability
```

### **Process Observations**

```markdown
- [workflow] Uses CI/CD pipeline for deployment #automation
- [testing] Comprehensive test coverage implemented #quality
- [documentation] Well-documented API and usage #maintainability
- [collaboration] Team-based development approach #teamwork
```

### **Business Observations**

```markdown
- [value] Reduces manual work by 80% #efficiency
- [impact] Improves user experience significantly #ux
- [cost] Reduces operational costs #economics
- [time] Accelerates development cycle #speed
```

## 📁 **RELATION PATTERNS**

### **Hierarchical Relations**

```markdown
- part_of [[Parent System]]
- contains [[Sub-module]]
- implements [[Interface]]
- extends [[Base Class]]
```

### **Dependency Relations**

```markdown
- depends_on [[External Service]]
- uses [[Library/Framework]]
- requires [[Configuration]]
- integrates_with [[Third-party API]]
```

### **Workflow Relations**

```markdown
- follows [[Process]]
- triggers [[Action]]
- produces [[Output]]
- consumes [[Input]]
```

## 📁 **PROJECT TYPES**

### **Application Projects**

```markdown
## Context
[App name] is a [type] application that [primary function].

## Purpose
- Provide [core functionality]
- Serve [target users]
- Integrate with [external systems]

## Observations
- [frontend] Built with [framework] #frontend
- [backend] Uses [technology] for API #backend
- [database] Stores data in [database type] #data
```

### **Library/Tool Projects**

```markdown
## Context
[Tool name] is a [type] tool that [primary function].

## Purpose
- Simplify [complex task]
- Automate [manual process]
- Provide [utility function]

## Observations
- [utility] Provides [specific functionality] #utility
- [integration] Works with [other tools] #integration
- [performance] Optimized for [specific use case] #performance
```

### **Documentation Projects**

```markdown
## Context
Documentation for [subject] covering [scope].

## Purpose
- Guide [target audience]
- Document [processes/APIs]
- Provide [reference material]

## Observations
- [coverage] Comprehensive coverage of [topics] #completeness
- [format] Uses [documentation format] #format
- [maintenance] Regularly updated #maintenance
```

## 📁 **BEST PRACTICES**

### **Naming Conventions**

- **Project Names**: Use kebab-case (my-project-name)
- **Tags**: Use lowercase with hyphens
- **Permalinks**: Format as `projects-[name]`

### **Tag Strategy**

- **Primary Tag**: Project name or main identifier
- **Category Tag**: Type of project (development, documentation, etc.)
- **Technology Tags**: Specific technologies used
- **Domain Tags**: Business domain or area

### **Observation Guidelines**

1. **Be Specific**: Detailed, actionable observations
2. **Use Categories**: Prefix with [category] for organization
3. **Add Tags**: Include relevant hashtags
4. **Stay Current**: Update observations as project evolves

### **Relation Guidelines**

1. **Link Related**: Connect to related projects and components
2. **Show Dependencies**: Document what the project depends on
3. **Indicate Hierarchy**: Show parent-child relationships
4. **Update Links**: Keep relations current as project changes

## 📁 **EXAMPLE PROJECTS**

### **Web Application Example**

```markdown
---
tags:
- rpglitch
- web-application
- javascript
- perchance
permalink: projects-rpglitch
---

# RPGlitch

## Context
RPGlitch is a web-based RPG character and world management tool built for the Perchance platform.

## Purpose
- Provide intuitive character creation and management
- Enable world-building with interconnected elements
- Support story development and campaign planning

## Observations
- [frontend] Built with vanilla JavaScript for Perchance compatibility #frontend
- [styling] Uses SCSS with BEM methodology #styling
- [architecture] Modular design with separated concerns #architecture
- [storage] Uses localStorage for data persistence #storage

## Relations
- part_of [[Perchance Platform]]
- uses [[JavaScript]]
- uses [[SCSS]]
- implements [[BEM Methodology]]
```

### **Documentation Example**

```markdown
---
tags:
- unified-orchestrator-guide
- documentation
- system-architecture
permalink: projects-unified-orchestrator-guide
---

# Unified Orchestrator Mode Guide

## Context
Comprehensive documentation for the Unified Orchestrator Mode system.

## Purpose
- Guide users through system setup and usage
- Document architecture and design decisions
- Provide troubleshooting and best practices

## Observations
- [coverage] Complete coverage of all system components #completeness
- [format] Structured markdown with clear examples #format
- [maintenance] Regularly updated with system changes #maintenance

## Relations
- documents [[Unified Orchestrator Mode]]
- part_of [[System Documentation]]
- uses [[Markdown]]
```
