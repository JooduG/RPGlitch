<script>
  let {
    label,
    variant = "primary", // primary | secondary | ghost | danger | glass
    size = "md", // sm | md
    class: className = "", // Allow local overrides
    children, // For icons/complex content
    ...restProps // Pass through onclick, disabled, etc.
  } = $props();

  let element;

  export function focus() {
    element?.focus();
  }
</script>

<button
  bind:this={element}
  class="btn btn-{variant} {size === 'sm' ? 'btn-sm' : ''} {className}"
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style lang="scss">
  /* 
     STRICT RULE: No local styles here. 
     All standard button styles live in src/mesmer/ui/_buttons.scss 
     This ensures a single source of truth for the design system.
  */
</style>
