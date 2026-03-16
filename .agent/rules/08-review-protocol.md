# Ì¥ç Rule: Code Review Protocol

## 1. Severity Levels (Mandatory)
Every review comment MUST be assigned a severity icon:
- Ì¥¥ **Critical**: Production failure, security breach, or data corruption. MUST fix.
- Ìø† **High**: Significant bugs or performance degradation. Should fix.
- Ìø° **Medium**: Deviation from best practices or technical debt.
- Ìø¢ **Low**: Minor stylistic issues (typos, formatting).

## 2. Review Criteria
1. **Correctness**: Logic errors, edge cases, race conditions.
2. **Security**: Injection, secrets exposure, insecure data.
3. **Svelte 5 Parity**: Ensure Runes ($state, $derived) are used correctly.
4. **Chalk Regime**: Ensure native CSS variables are used over hex/Tailwind.

## 3. Suggestion Format
Use the `suggestion` block for actionable code changes. Ensure suggestions are syntactically correct and match the indentation of the target file.
