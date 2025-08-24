---
alwaysApply: true
---
# MCP Ecosystem Overview

## Overview

The Model Context Protocol (MCP) ecosystem provides a standardized way for AI assistants to interact with external tools, data sources, and services. This guide provides a high-level overview of available MCP servers and their integration with the 3-mode development system.

## Where To Configure MCP

- Authoritative config: `build/config/mcp.master.json` (single source of truth).
- Avoid editing ad-hoc `mcp.json` files; examples refer to the master config.

## Setup

- context7: `npx -y @context7/mcp` (requires `CONTEXT7_API_KEY` in `.env`).
- basic-memory: `uvx basic-memory mcp` or `python -m basic_memory.mcp` with `BASIC_MEMORY_PROJECT_ROOT=./memory-bank`.
- time (recommended): `npx -y @modelcontextprotocol/server-time`.
- sequential thinking tools: `npx -y mcp-sequentialthinking-tools`.

Note: A Python time server (`mcp_server_time`) exists, but we standardize on the Node server in examples for consistency.

## 🎯 **CORE MCP SERVERS**

### **1. context7 MCP Server** ⭐ **PRIMARY**

- **Purpose**: Real-time documentation access for libraries, frameworks, and technologies
- **Features**:
  - Resolves library IDs to Context7-compatible identifiers
  - Fetches up-to-date documentation with code examples
  - Supports topic-specific queries and token limits
  - Comprehensive coverage of modern web technologies
- **Use Cases**:
  - Getting current documentation for libraries
  - Code examples and best practices
  - API reference lookups
  - Framework-specific guidance
- **Status**: ✅ Working (requires API key)
- **Integration**: Detailed Context7 Guide

### **2. Basic Memory MCP Server** ⭐ **PRIMARY**

- **Purpose**: Knowledge management system with persistent semantic graph and long-term storage
- **Features**:
  - Semantic knowledge management with automatic graph building
  - Obsidian integration for existing workflows
  - Multi-project support for mode-specific knowledge bases
  - Real-time synchronization with watch mode
  - Markdown storage for human-readable knowledge
- **Use Cases**:
  - Project-specific knowledge retention
  - Learning from past interactions
  - Decision tracking and documentation
  - Progress monitoring across sessions
- **Status**: ✅ Working
- **Integration**: Detailed Basic Memory Guide

### **3. Time MCP Server** ⭐ **CRITICAL**

- **Purpose**: Mandatory date standardization and timezone handling
- **Features**:
  - Consistent date formatting across all documentation
  - Timezone-aware timestamp generation
  - Integration with all system components
  - Prevents hardcoded dates
- **Use Cases**:
  - Document headers and metadata
  - Progress tracking and timestamps
  - Handoff documentation
  - Archive timestamps
- **Status**: ✅ Working
- **Integration**: Detailed Time MCP Guide

## 🔄 **INTEGRATION WITH 3-MODE SYSTEM**

### **🎭 Strategic Mode**

- **Context7**: Access current best practices and documentation
- **Basic Memory**: Store strategic insights and meta-patterns
- **Time MCP**: Track planning dates and timelines

### **🎨 Tactical Mode**

- **Context7**: Get implementation guidance and API references
- **Basic Memory**: Store design decisions and planning templates
- **Time MCP**: Track milestone dates and schedules

### **⚒️ Operational Mode**

- **Context7**: Access implementation details and code examples
- **Basic Memory**: Store implementation patterns and solutions
- **Time MCP**: Track completion dates and durations

## 📋 **MCP SERVER SELECTION GUIDE**

### **For Documentation Access**

**Primary Choice**: context7 MCP Server

- Real-time access to current documentation
- Comprehensive library coverage
- Code examples and best practices

### **For Memory Management**

**Primary Choice**: Basic Memory MCP Server

- Semantic knowledge management
- Obsidian integration
- Multi-project support
- Markdown storage

### **For Date Standardization**

**Primary Choice**: Time MCP Server

- Mandatory for all date formatting
- Timezone-aware handling
- Consistent across all components

## 🔧 **QUICK START CONFIGURATION**

### **Essential MCP Servers**

Configuration is centrally managed in `build/config/mcp.master.json`. Enable/disable servers, set `autoStart`, and configure env there.

## 📚 **DETAILED GUIDES**

- context7 MCP Server Guide - Complete usage guide
- Basic Memory MCP Server Guide - Integration and setup
- Time MCP Server Guide - Date standardization
- System Documentation - Unified system integration

## 🎯 **NEXT STEPS**

1. **Choose your primary MCP servers** based on your needs
2. **Configure the servers** using the provided configurations
3. **Read the detailed guides** for each server you plan to use
4. **Integrate with your 3-mode system** for enhanced capabilities

---

**Last Updated**: 2025-07-23  
**Version**: 1.0  
**Status**: Complete overview with 3-mode system integration
