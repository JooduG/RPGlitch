---
description: Workflow for starting new task when context window reaches 60%
author: https://github.com/cline
version: 1.0
tags: ["context-management", "new-task"]
globs: ["*"]
---

# Task Handoff Strategy Guide

**⚠️ CRITICAL INSTRUCTIONS ⚠️**

You **MUST** monitor the context window usage displayed in the environment details. When usage exceeds 60% of the available context window, you **MUST** initiate a task handoff using the `new_task` tool.

## Key Requirements
- Trigger handoff at 60% context usage
- Use concise summary in new task context
- Maintain essential project continuity
- Optimize file operations for efficiency
