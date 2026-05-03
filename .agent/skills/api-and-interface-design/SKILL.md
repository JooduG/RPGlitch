---
name: api-and-interface-design
description: Guides stable API and interface design. Use when designing APIs, module boundaries, or any public interface (Rest, GraphQL, module types).
---

# API and Interface Design

> "Good interfaces make the right thing easy and the wrong thing hard. Stable boundaries protect the Engine from entropic decay."

## Overview

Design stable, well-documented interfaces that are hard to misuse. This applies to REST APIs, Svelte 5 Rune contracts, module boundaries, and any surface where one piece of logic interacts with another.

### Core Principles

#### Hyrum's Law

> With a sufficient number of users of an API, all observable behaviors of your system will be depended on by somebody, regardless of what you promise in the contract.

Be intentional about what you expose. Every observable behavior — including undocumented quirks and error message text — becomes a de facto contract once users depend on it.

#### 1. Contract First

Define the interface (types, schemas) before implementation. The contract is the specification.

#### 2. Consistent Error Semantics

Pick one error strategy (e.g. structured JSON errors with machine-readable codes) and use it everywhere. Don't mix patterns.

#### 3. Validate at Boundaries

Trust internal code. Strictly validate and sanitize at system edges where external or untrusted data (third-party APIs, user input, environment variables) enters the engine.

#### 4. Prefer Addition Over Modification

Extend interfaces by adding optional fields rather than changing existing ones to maintain backward compatibility.

## Usage

```bash
# Verify API types and boundary contracts
npm run audit:logic src/core/perchance-bridge.js
```

## Verification Checklist

- [ ] Every endpoint has typed input and output schemas.
- [ ] Error responses follow a single consistent format.
- [ ] Validation happens at system boundaries only.
- [ ] Naming follows consistent conventions across all endpoints.
- [ ] API documentation (JSDoc or Types) is committed with the implementation.
