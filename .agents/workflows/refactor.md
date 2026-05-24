---
name: /refactor
description: Universal SOTA Refactor & DOM Harmonization.
---

# SYSTEM DIRECTIVE: Universal SOTA Refactor & DOM Harmonization

## OBJECTIVE

Execute a Mariana Trench-level deep-dive analysis into the provided file. Deconstruct the entire file's content, optimize the architecture, and rebuild it from the ground up to achieve absolute clarity, unparalleled robustness, and an optimal logical flow (the "red thread").

## EXECUTION PROTOCOLS

### 1. Structural Deconstruction, Reassembly & Complexity Reduction

- **Persona Alignment**: Refactor for clarity and maintainability using the Simplification methodology to ensure long-term stability and legibility.
- **Complexity Assessment**: Target complex code blocks (deep nesting, long functions, generic names). Understand the purpose, callers, and edge cases of the target code before refactoring.
- **Technical Debt Reduction**: Reduce cyclomatic complexity without changing external behavior. Align code with Chalk Regime aesthetic standards and Svelte 5 patterns.
- **Incremental Extraction**: Rebuild the material as if starting from scratch with the optimal structure. Extract helpers or apply guard clauses one by one, maintaining all existing functionality.
- **Verification Loop**: Run tests after every atomic change to ensure no regressions. Ensure all refactors are 100% covered by existing tests.
- **Quality Gate**: Run `npm run verify` to ensure the project remains resonant and passes all quality checks.
- **Documentation**: Update any relevant ADRs or internal documentation if the architecture shifted.

### 2. DOM Flattening (Zero-Design-Drift)

- Audit the HTML/Markup for excessive nesting and over-complicated DOM trees.
- Aggressively flatten the markup by removing unnecessary wrapper nodes.
- **CRITICAL:** Maintain strict 1:1 visual parity. The flattened structure must not alter the application's existing UI/UX design or CSS layout integrity.

### 3. CSS Nomenclature Harmonization ("Ultra-Lean" Standard)

- Refactor all CSS classes and HTML identifiers to follow an "Ultra-Lean", flat, and functional naming convention.
- Eliminate random, highly unique, or overly complex naming schemes.
- Implement generic, semantic class names that mirror the component's internal structure (e.g., standardizing around terms like `.wrapper`, `.header`, `.body`, `.actions`, `.status`, `.primary`, etc., based on the file's context).
- Harmonize the nomenclature across the entire file to ensure internal consistency and maximum readability.

### 4. Style De-Duplication & Bloat Elimination (The Lean Regime)

- **Eliminate Redundant Local CSS**: Audit `<style>` blocks for custom overrides that duplicate standard components' built-in layout or typography physics. Trust atomic UI components (e.g., `<Button>`) to handle their own padding, alignment, cursor behavior, and click scales natively.
- **Enforce Design Token Sovereignty**: Scan all styles and replace hardcoded values or local custom declarations with standard Nordic tokens from `DESIGN.md` (e.g., --radius-standard, --duration-fast, --ease-standard, --signature-color).
- **Standardize Visual Elements**: If a visual element is custom-styled but closely matches a standard pattern registry element (e.g., `.glass-elevated`, `.interactable`, `.font-mono`), standard CSS classes from `DESIGN.md` MUST be leveraged directly in the markup rather than re-implementing them via custom classes.
- **Forbid Prop Hallucinations**: Ensure custom utility classes on components are applied via standard Svelte `class` prop binding. Never use React-style `className` attributes which fail to bind to Svelte component custom class scopes.
- **Remove Bloat & Avoid Unnecessary Local Styling**:
  - **Zero-Redundancy Directive**: Do not override global or inherited class styles within a local `<style>` block using identical property values. If the global styling already achieves the look, let inheritance do its job without redundant rules.
  - **No Custom Overrides for standard styles**: If a component has standard attributes (e.g. `size`, `variant`), use them instead of custom local styles. For example, do not customize `<Button>` borders or scales inside a parent Svelte file.
  - **Aggressive Class Auditing**: When editing Svelte files, perform an active class audit. Identify any custom CSS rules that can be entirely replaced by utilizing global helper classes or standard theme classes from `DESIGN.md`, and delete the custom CSS rules.
  - **Proximity Standardisation**: If local styling is close enough to a standard pattern registry element, migrate to the standard pattern immediately and purge the custom declarations.

## ANTI-PATTERNS

- **Refactor-Features**: Changing behavior while simplifying or refactoring (creates unknown regressions).
- **Monolithic Simplification/Refactoring**: Changing 100 lines at once without intermediate test runs.

## REQUIRED OUTPUT

1.  Output the fully refactored, production-ready code.
2.  Provide a concise changelog detailing the logical improvements, DOM nodes flattened, and the newly established generic CSS mapping system.
