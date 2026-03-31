# Svelte 5 Runes & State Management

## Overview

Runes are keywords in Svelte 5 that control the compiler. They have a `$` prefix and enable fine-grained reactivity.

## $state

- Creates deeply reactive state proxies for objects and arrays.
- Classes can use `$state` in fields.
- Use `$state.raw` for non-deep reactivity (reassignment only).
- Use `$state.snapshot` to get a non-proxy version of state.

## $derived

- Computed state that automatically updates when its dependencies change.
- Side-effect free. Use `$derived.by` for complex logic.

## $effect

- Handles side effects (DOM, network, timers).
- Use sparingly; prefer `$derived` for state synchronization.
- `$effect.pre` runs before DOM updates.

## $props and $bindable

- `$props()` receives data from parents.
- `$bindable()` allows two-way binding for specific props.

## Migration Guide

- Replace `export let` with `$props()`.
- Replace `$`:`statements with`$derived` or `$effect`.
- Replace Svelte stores with universal reactivity (`.svelte.js` files).
