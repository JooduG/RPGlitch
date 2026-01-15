<script>
  let {
    label,
    onclick,
    variant = "primary",
    children,
    class: className,
    ...restProps
  } = $props();
</script>

<button class="btn {variant} {className || ''}" {onclick} {...restProps}>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style lang="scss">
  .btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    border: none;
    background: transparent;

    /* VARIANTS */

    &.primary {
      background: #2563eb; /* Blue 600 */
      color: white;
      &:hover:not(:disabled) {
        background: #1d4ed8;
      }
    }

    &.secondary {
      background: #27272a; /* Zinc 800 */
      color: #e4e4e7;
      border: 1px solid #3f3f46;
      &:hover:not(:disabled) {
        background: #3f3f46;
      }
    }

    &.danger {
      background: rgba(220, 38, 38, 0.1);
      color: #f87171;
      border: 1px solid #7f1d1d;
      &:hover:not(:disabled) {
        background: rgba(220, 38, 38, 0.2);
      }
    }

    &.ghost {
      background: transparent;
      color: #a1a1aa;
      padding: 0.5rem;
      width: auto; /* Ghost buttons shrink to fit usually */
      &:hover:not(:disabled) {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }
    }

    /* Generic Disabled State */
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
</style>
