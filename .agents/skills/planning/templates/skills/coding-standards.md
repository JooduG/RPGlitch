---
name: coding-standards
description: Universal coding principles and quality standards for all project contributions.
---

# General Code Style Principles

This document outlines general coding principles that apply across all languages and frameworks used in this project.

## ⚖️ Local Project Sovereignty

> [!IMPORTANT]
> When operating within this repository, local project rules supersede the generic guidelines in this document. In the event of a conflict, the authoritive [rules/](../../../../rules/) are absolute, like in these cases (but not limited to):
> 1. **Lexical & Workflow**: Naming conventions and process logic defined in [05-intelligence.md](../../../../../.agents/rules/05-intelligence.md) take precedence. (e.g., Use `snake_case` for variables and `kebab-case` for files regardless of generic language standards).
> 2. **Aesthetics & UI**: Design tokens and visual laws defined in [04-aesthetics.md](../../../../../.agents/rules/04-aesthetics.md) take precedence. Never use raw CSS values (`px`, `#`, `rem`) when tokens are available.
> 3. **Framework Logic**: If this project uses **Svelte**, all UI and state logic must adhere to [03-infrastructure.md](../../../../../.agents/rules/03-infrastructure.md).
> 4. **General Precedence**: Any and all information found in [rules/](../../../../rules/) is master above the information found in this file.

## 1. Readability
- Code should be easy to read and understand by humans.
- Avoid overly clever or obscure constructs.

## 2. Consistency
- Follow existing patterns in the codebase.
- Maintain consistent formatting, naming, and structure.

## 3. Simplicity
- Prefer simple solutions over complex ones.
- Break down complex problems into smaller, manageable parts.

## 4. Maintainability
- Write code that is easy to modify and extend.
- Minimize dependencies and coupling.

## 5. Documentation
- Document *why* something is done, not just *what*.
- Keep documentation up-to-date with code changes.
