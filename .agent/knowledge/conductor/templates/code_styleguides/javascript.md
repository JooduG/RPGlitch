# JavaScript Style Guide

## Syntax & Structure

- **ES Modules**: Use `import` / `export`. No `require()`.
- **Variables**: `const` by default. `let` only if reassignment is needed. No `var`.
- **Formatting**: 2 spaces for indentation. Prettier default settings.
- **Semicolons**: Always use semicolons.

## Naming Conventions

- **Files**: `kebab-case.js`
- **Classes**: `PascalCase`
- **Functions/Vars**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` (only for true constants)

## Modern Practices

- Use arrow functions for callbacks.
- Use destructuring for objects and arrays.
- Use optional chaining (`?.`) and nullish coalescing (`??`).
- Use `async`/`await` over `.then()`.

## Documentation

- Use JSDoc for public functions and complex logic.
