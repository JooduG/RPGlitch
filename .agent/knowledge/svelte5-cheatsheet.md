# Svelte 5 Runes Cheat Sheet

> Quick reference for Svelte 5 reactivity patterns. For details, see [Official Docs](https://svelte.dev/docs/runes).

---

## State Runes

### `$state()` — Reactive State

```svelte
<script>
    let count = $state(0)
    let user = $state({ name: "Alice", age: 30 }) // Deep reactive proxy
</script>

<button onclick={() => count++}>Count: {count}</button>
```

**Key Points:**

- Returns a deeply reactive proxy for objects/arrays
- Mutations like `array.push()` trigger updates
- Use `$state.raw()` to disable deep reactivity

### `$state.raw()` — Shallow State

```javascript
let items = $state.raw([1, 2, 3])
items = [...items, 4] // Must reassign to trigger update
```

---

## Derived Values

### `$derived()` — Computed Values

```svelte
<script>
    let count = $state(0)
    let doubled = $derived(count * 2)
    let message = $derived(`Count is ${count}`)
</script>
```

### `$derived.by()` — Complex Derivations

```javascript
let total = $derived.by(() => {
    let sum = 0
    for (const item of items) sum += item.price
    return sum
})
```

---

## Side Effects

### `$effect()` — Reactive Effects

```svelte
<script>
    let count = $state(0)

    $effect(() => {
        console.log(`Count changed to ${count}`)

        return () => {
            console.log("Cleanup on dependency change")
        }
    })
</script>
```

**Key Points:**

- Runs after DOM updates
- Automatically tracks dependencies
- Return function for cleanup
- Only runs in browser (not SSR)

### `$effect.pre()` — Pre-DOM Effects

```javascript
$effect.pre(() => {
    // Runs BEFORE DOM update
})
```

---

## Component Props

### `$props()` — Receiving Props

```svelte
<script>
    /** @type {{ name: string, count?: number }} */
    let { name, count = 0 } = $props()
</script>

<p>Hello {name}! Count: {count}</p>
```

### Spread Props

```svelte
<script>
    let { class: className, ...rest } = $props()
</script>

<button class={className} {...rest}>Click</button>
```

### `$props.id()` — Unique Component ID

```svelte
<script>
    const uid = $props.id()
</script>

<label for="{uid}-input">Name:</label>
<input id="{uid}-input" type="text" />
```

---

## Event Binding

### Modern Event Syntax

```svelte
<!-- ✅ Svelte 5 -->
<button onclick={() => count++}>Click</button>
<input oninput={(e) => (name = e.target.value)} />

<!-- ❌ Legacy (BANNED) -->
<button on:click={() => count++}>Click</button>
```

---

## Snippets (Replaces Slots)

### Defining & Rendering Snippets

```svelte
<script>
    let { header, children } = $props()
</script>

{#snippet defaultHeader()}
    <h1>Default Header</h1>
{/snippet}

{@render (header ?? defaultHeader)()}
{@render children?.()}
```

### Passing Snippets to Components

```svelte
<!-- Parent -->
<Card>
    {#snippet header()}
        <h2>Custom Header</h2>
    {/snippet}
    <p>Body content</p>
</Card>
```

---

## Migration Quick Reference

| Svelte 4 (Legacy)         | Svelte 5 (Runes)                      |
| :------------------------ | :------------------------------------ |
| `export let prop;`        | `let { prop } = $props();`            |
| `let x = 0;` (reactive)   | `let x = $state(0);`                  |
| `$: doubled = x * 2;`     | `let doubled = $derived(x * 2);`      |
| `$: { console.log(x); }`  | `$effect(() => { console.log(x); });` |
| `<slot />`                | `{@render children?.()}`              |
| `<slot name="header" />`  | `{@render header?.()}`                |
| `on:click={fn}`           | `onclick={fn}`                        |
| `createEventDispatcher()` | Callback props                        |
| `writable()` store        | `.svelte.js` with `$state`            |

---

## Debugging

```javascript
$inspect(count) // Logs changes
$inspect(count).with(fn) // Custom logger
```

---

## File Extensions

| Extension    | Contains                                                  |
| :----------- | :-------------------------------------------------------- |
| `.svelte`    | Components with `$state`, `$derived`, `$effect`, `$props` |
| `.svelte.js` | Reactive modules (classes with `$state`)                  |
| `.svelte.ts` | TypeScript reactive modules                               |

---

_Source: Svelte 5 MCP Documentation_
