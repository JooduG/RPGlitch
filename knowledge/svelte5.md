# Svelte 5 Essentials

## Runes Overview

Runes are symbols that Svelte uses to control reactivity. They are available in `.svelte` components and `.svelte.js` (or `.svelte.ts`) files.

### $state

The `$state` rune creates reactive state.

```js
let count = $state(0)
```

Deep reactivity is supported for objects and arrays. Svelte uses Proxies to track changes.

### $derived

The `$derived` rune creates reactive state that depends on other state.

```js
let doubled = $derived(count * 2)
```

### $effect

The `$effect` rune runs code when reactive state changes. It replaces `onMount`, `afterUpdate`, and `$:`.

```js
$effect(() => {
    console.log("Count is now", count)
    return () => console.log("Cleanup before next run or on destroy")
})
```

### $props

The `$props` rune is how components receive data.

```js
let { name, color = "blue" } = $props()
```

### $bindable

Allows a prop to be bound (two-way data flow).

```js
let { value = $bindable() } = $props()
```

### $inspect

Debugging rune to track state changes.

```js
$inspect(count)
```

## Snippets and Render

Snippets replace slots for more flexible component composition.

```svelte
{#snippet mySnippet(name)}
    <div>Hello {name}</div>
{/snippet}

{@render mySnippet("World")}
```

## Event Handlers

Svelte 5 uses standard attributes for events (`onclick` instead of `on:click`).

```svelte
<button onclick={() => count++}>Click me</button>
```

## Context API

Context is still used for deep prop drilling avoidance.

```js
import { setContext, getContext } from "svelte"
setContext("key", value)
let value = getContext("key")
```
