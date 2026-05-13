# UI Specification: [Component Name]

## 1. Description

{{A high-fidelity Svelte 5 component description. Mention the specific sensory impact and how it adheres to the Nordic Collection and Grounded Policy.}}

## 2. Architecture

- **Framework**: Svelte 5 (Runes exclusively).
- **Styling**: Native CSS via `<style>` block. Use Chalk Regime tokens.
- **Interactions**: Kinetic feedback focused on brightness and scale (min 0.3s). **Grounded Policy**: No `translateY` on hover.

## 3. Implementation Blueprint (Example: Button)

```svelte
<script lang="ts">
  let { 
    label = "Action", 
    onclick, 
    disabled = false,
    variant = "primary"
  } = $props();
</script>

<button 
  {onclick} 
  {disabled} 
  class="nordic-btn {variant}"
  aria-label={label}
>
  <span class="label">{label}</span>
</button>

<style>
  .nordic-btn {
    /* 1. Base Layer (Sunken) */
    background: var(--glass-s);
    color: var(--font-color-s);
    border: var(--border-l);
    
    /* 2. Physical Constants */
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--border-radius-m);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    
    /* 3. Kinetic Physics */
    transition: 
      background var(--motion-m) var(--motion-standard),
      transform var(--motion-s) var(--motion-elastic),
      filter var(--motion-m) var(--motion-standard);
    cursor: pointer;
    overflow: hidden;
    position: relative;
  }

  .nordic-btn.primary {
    background: var(--color-chalk);
    color: var(--color-white);
    border-color: transparent;
  }

  /* Grounded Policy: Scale and Brightness only. No translateY. */
  .nordic-btn:hover:not(:disabled) {
    filter: brightness(1.2);
    transform: scale(1.02);
  }

  .nordic-btn:active:not(:disabled) {
    transform: scale(var(--motion-click));
  }

  .nordic-btn:disabled {
    opacity: var(--opacity-s);
    cursor: not-allowed;
    filter: grayscale(1);
  }
</style>
```
