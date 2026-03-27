# 🛡️ Svelte 5 Security Protocols

## 1. Input Sanitization

- **Risk**: `{@html ...}` tag.
- **Rule**: NEVER use `{@html user_content}` directly.
- **Protocol**:
    - **Bad**: `{@html post.content}`
    - **Good**: `{@html DOMPurify.sanitize(post.content)}`
    - **Best**: Use a secure markdown renderer (e.g., `marked` with sanitization enabled).

## 2. Reactivity & State

- **Risk**: `$effect` loops causing browser freeze.
- **Rule**: Avoid updating the state triggering the effect _inside_ the effect.
- **Audit**: Check for `$state` mutations inside `$effect` without conditionals.

## 3. Server-Side Rendering (SSR) Leaks

- **Risk**: Leaking session data between users on the server.
- **Rule**: Never store user-specific data in global variables outside of the component scope or request context.
- **Check**: Ensure stores are initialized _per request_ or _per component_, not globally in module scope.
