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
    /* 
     STRICT RULE: No local styles here. 
     All standard button styles live in src/theme/components.css
     This ensures a single source of truth for the design system.
  */
</style>
