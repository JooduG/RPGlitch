# 🔄 Svelte 4 to 5 Migration Protocol

| Feature         | Svelte 4 (Banned)        | Svelte 5 Runes (Required)            |
| :-------------- | :----------------------- | :----------------------------------- |
| **State**       | `let count = 0;`         | `let count = $state(0);`             |
| **Derived**     | `$: double = count * 2;` | `let double = $derived(count * 2);`  |
| **Props**       | `export let data;`       | `let { data } = $props();`           |
| **Effects**     | `$: console.log(count);` | `$effect(() => console.log(count));` |
| **Slots**       | `<slot />`               | `{@render children()}`               |
| **Events**      | `dispatch('save')`       | `props.onSave()`                     |
| **HTML Events** | `on:click={fn}`          | `onclick={fn}`                       |
