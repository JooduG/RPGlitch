# 🛡️ Security Protocols

## Data Handling

- **No Secrets:** Never commit API keys, passwords, or credentials to the codebase. Use `.env` files.
- **Sanitization:** Always sanitize user input before rendering to the DOM to prevent XSS. Svelte handles this by default, but be wary of `{@html ...}`.
- **Validation:** Use Zod schemas to validate all data entering the application boundary (API responses, form inputs).

## Logic Safety

- **Zero Trust:** Assume all external data is malformed or malicious until validated.
- **Error Handling:** Fail gracefully. Do not expose stack traces to the user.
- **State Isolation:** Ensure user-specific state does not leak into global scope (especially in SSR contexts).

## Operational Security

- **Dependencies:** Audit `package.json` for known vulnerabilities.
- **Scripts:** independent review of any scripts in `.agent/scripts` before execution (already enforced by the Agent's operation mode).
