<script>
    let {
        label = "",
        variant = "primary", // primary | secondary | ghost | danger | glass
        size = "md", // sm | md
        className = "", // Allow local overrides (use className="..." when calling)
        children = null, // For icons/complex content
        onclick = null,
        ...restProps // Pass through disabled, etc.
    } = $props()

    let element

    export function focus() {
        element?.focus()
    }

    /**
     * Helper to apply an array of actions to the button element.
     * Actions can be: [action] or [action, params]
     */
    function applyActions(node, actions) {
        const destructors = []

        actions.forEach((item) => {
            const action = Array.isArray(item) ? item[0] : item
            const params = Array.isArray(item) ? item[1] : undefined

            if (typeof action === "function") {
                const result = action(node, params)
                if (result && result.destroy) {
                    destructors.push(result.destroy)
                }
            }
        })

        return {
            destroy() {
                destructors.forEach((d) => d())
            },
        }
    }
</script>

<button bind:this={element} class="btn btn-{variant} {size === 'sm' ? 'btn-sm' : ''} {className}" {...restProps} {onclick} use:applyActions={restProps.actions || []}>
    {#if children}
        {@render children()}
    {:else}
        {label}
    {/if}
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-m);
        min-height: var(--spacing-xxl);
        font-family: inherit;
        font-weight: var(--font-bold);
        font-size: var(--font-size-s);
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
        pointer-events: auto;
        border: none;
        border-radius: var(--border-radius);
        background: transparent;
        color: var(--font-color);
        transition: all var(--transition-speed, 0.2s) ease-out;
    }

    .btn.btn-sm {
        min-height: var(--spacing-xl);
        padding: var(--spacing-xxs) var(--spacing-s);
        font-size: var(--font-size-xs);
    }

    .btn:hover:not(:disabled, .disabled) {
        transform: translateY(var(--physics-btn-hover-y));
        filter: brightness(1.1);
    }

    .btn:active:not(:disabled, .disabled) {
        transform: scale(var(--physics-btn-active-scale));
    }

    .btn:disabled,
    .btn.disabled {
        opacity: var(--opacity-disabled);
        cursor: not-allowed;
        filter: grayscale(1);
        pointer-events: none;
        transform: none;
        transition: none;
        box-shadow: none;
    }

    .btn :global(.icon) {
        pointer-events: none;
        transition: transform 0.2s var(--physics-transition-elastic);
    }

    .btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--frisk);
    }

    /* Variants */
    .btn-primary {
        background: var(--frisk);
        color: var(--black);
        box-shadow: var(--shadow-m);
    }
    .btn-primary:hover:not(:disabled, .disabled) {
        background: color-mix(in srgb, var(--frisk), var(--white) 5%);
    }

    .btn-ghost {
        color: var(--font-muted);
    }
    .btn-ghost:hover:not(:disabled, .disabled) {
        background: var(--surface-sunken);
        color: var(--font-color);
    }

    .btn-outline {
        background: var(--border-light);
        color: var(--font-muted);
    }
    .btn-outline:hover:not(:disabled, .disabled) {
        color: var(--frisk);
        background: var(--surface-sunken);
    }

    .btn-glass {
        background: var(--surface-raised);
        color: var(--white);
    }
    .btn-glass:hover:not(:disabled, .disabled) {
        background: var(--surface-elevated);
    }

    .btn-secondary {
        background: var(--surface-raised);
        color: var(--font-color);
    }
    .btn-secondary:hover:not(:disabled, .disabled) {
        background: var(--surface-elevated);
    }

    .btn-security {
        background: var(--surface-sunken);
        color: var(--font-color);
        box-shadow: 0 0 0 1px var(--frisk);
    }
    .btn-security:hover:not(:disabled, .disabled) {
        box-shadow:
            0 0 15px var(--surface-sunken),
            0 0 0 1px var(--font-color);
    }

    /* Shapes */
    .btn-round {
        border-radius: var(--border-radius-full);
        padding: 0;
        width: var(--spacing-xxl);
        height: var(--spacing-xxl);
    }

    /* Button Groups Support (using :global to catch parent containers) */
    :global(.btn-group-joined) .btn {
        border-radius: 0;
    }
    :global(.btn-group-joined) .btn:first-child {
        border-radius: var(--border-radius) 0 0 var(--border-radius);
    }
    :global(.btn-group-joined) .btn:last-child {
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
    }
    :global(.btn-group-joined) .btn:not(:last-child) {
        border-right: 1px solid var(--tint-dark-surface);
    }

    :global(.btn-group-pill) .btn {
        border-radius: var(--border-radius-full);
        min-height: var(--spacing-xl);
    }
</style>
