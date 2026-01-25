---
name: clean-code
description: Pragmatic coding standards - concise, direct, no over-engineering, no unnecessary comments.
allowed-tools: Read, Write, Edit
version: 2.1
priority: CRITICAL
---

# Clean Code - Pragmatic AI Coding Standards

> **CRITICAL SKILL** - Be **concise, direct, and solution-focused**. Also governs **Code Simplification**.

---

## Core Principles

| Principle      | Rule                                                       |
| -------------- | ---------------------------------------------------------- |
| **SRP**        | Single Responsibility - each function/class does ONE thing |
| **DRY**        | Don't Repeat Yourself - extract duplicates, reuse          |
| **KISS**       | Keep It Simple - simplest solution that works              |
| **Refinement** | Readability > Brevity. Explicit > Clever.                  |
| **Boy Scout**  | Leave code cleaner than you found it                       |

---

## Code Simplification Protocol

When acting as a **Code Simplifier**, follow these rules:

1.  **Preserve Functionality**: Never change _what_ the code does, only _how_.
2.  **Explicit is Better**: Avoid nested ternaries. Use `if/else` or `switch`.
3.  **Remove Noise**: Delete comments that explain "what" (e.g., `// loop through items`). Keep comments that explain "why".
4.  **Modernize**: Use ES Modules, Arrow Functions (where appropriate), and `const`/`let`.

---

## Naming Rules

| Element       | Convention                                            |
| ------------- | ----------------------------------------------------- |
| **Variables** | Reveal intent: `userCount` not `n`                    |
| **Functions** | Verb + noun: `getUserById()` not `user()`             |
| **Booleans**  | Question form: `isActive`, `hasPermission`, `canEdit` |
| **Constants** | SCREAMING_SNAKE: `MAX_RETRY_COUNT`                    |

> **Rule:** If you need a comment to explain a name, rename it.

---

## Function Rules

| Rule                | Description                           |
| ------------------- | ------------------------------------- |
| **Small**           | Max 20 lines, ideally 5-10            |
| **One Thing**       | Does one thing, does it well          |
| **One Level**       | One level of abstraction per function |
| **Few Args**        | Max 3 arguments, prefer 0-2           |
| **No Side Effects** | Don't mutate inputs unexpectedly      |

---

## Anti-Patterns (DON'T)

| ❌ Pattern               | ✅ Fix                  |
| ------------------------ | ----------------------- |
| Comment every line       | Delete obvious comments |
| Helper for one-liner     | Inline the code         |
| Factory for 2 objects    | Direct instantiation    |
| utils.ts with 1 function | Put code where used     |
| Nested Ternaries         | `if/else` or `switch`   |
| Deep nesting             | Guard clauses           |
| Magic numbers            | Named constants         |
| God functions            | Split by responsibility |

---

## 🔴 Before Editing ANY File (THINK FIRST!)

**Before changing a file, ask yourself:**

| Question                        | Why                      |
| ------------------------------- | ------------------------ |
| **What imports this file?**     | They might break         |
| **What does this file import?** | Interface changes        |
| **What tests cover this?**      | Tests might fail         |
| **Is this a shared component?** | Multiple places affected |

> 🔴 **Rule:** Edit the file + all dependent files in the SAME task.
> 🔴 **Never leave broken imports or missing updates.**

---

## Summary

| Do                     | Don't                      |
| ---------------------- | -------------------------- |
| Write code directly    | Write tutorials            |
| Let code self-document | Add obvious comments       |
| Fix bugs immediately   | Explain the fix first      |
| Simplify logic         | Create "clever" one-liners |
| Name things clearly    | Use abbreviations          |

> **Remember: The user wants working, maintainable code.**

---

## 🔴 Self-Check Before Completing (MANDATORY)

**Before saying "task complete", verify:**

| Check                     | Question                          |
| ------------------------- | --------------------------------- |
| ✅ **Goal met?**          | Did I do exactly what user asked? |
| ✅ **Files edited?**      | Did I modify all necessary files? |
| ✅ **Code works?**        | Did I test/verify the change?     |
| ✅ **No errors?**         | Lint and TypeScript pass?         |
| ✅ **Nothing forgotten?** | Any edge cases missed?            |

> 🔴 **Rule:** If ANY check fails, fix it before completing.
