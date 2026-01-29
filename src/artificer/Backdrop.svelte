<script>
    /**
     * Backdrop.svelte
     * The standard darkening layer for Modals, Drawers, and Overlays.
     */
    let { onclick, zIndex = 100, blur = true, children = undefined } = $props() // Rely on inference or use standard JS props for now to avoid complexity in this file

    import { fade } from "svelte/transition"
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="backdrop"
    style:z-index={zIndex}
    class:blur
    {onclick}
    transition:fade={{ duration: 300 }}
>
    {#if children}
        {@render children()}
    {/if}
</div>

<style lang="scss">
    @use "../mesmer/scss/abstracts/variables" as *;

    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, var(--opacity-l)); /* Standard dark overlay */
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        /* Blur is optional (performance) */
        &.blur {
            backdrop-filter: blur(var(--blur-s));
        }
    }
</style>
