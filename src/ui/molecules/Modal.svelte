<script>
    let {
        onclose,
        variant = "standard", // 'standard' | 'profile' | 'preview'
        children,
    } = $props()

    import { quintOut } from "svelte/easing"
    import { fly } from "svelte/transition"
    import Backdrop from "./Backdrop.svelte"

    function handleKeydown(e) {
        if (e.key === "Escape") onclose()
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Visual Layer -->
<Backdrop onclick={onclose} zIndex={9998} />

<!-- Interaction & Layout Layer -->
<div
    class="modal-layout"
    role="button"
    tabindex="-1"
    onclick={(e) => {
        if (e.target === e.currentTarget) onclose()
    }}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            if (e.target === e.currentTarget) onclose()
        }
    }}
>
    <!-- 
        The Modal Container 
        Note: For variant-profile, we check click on this element explicitly 
        if it happens to be the one capturing the click due to sizing.
    -->
    <div
        class="modal variant-{variant}"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        transition:fly={{ y: 20, duration: 400, easing: quintOut }}
        onclick={(e) => {
            if (variant === "profile" && e.target === e.currentTarget) {
                onclose()
            }
        }}
        onkeydown={(e) => {
            if (
                variant === "profile" &&
                e.target === e.currentTarget &&
                (e.key === "Enter" || e.key === " ")
            ) {
                onclose()
            }
        }}
    >
        {@render children()}
    </div>
</div>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;

    .modal-layout {
        position: fixed;
        inset: 0;
        z-index: 9999; /* Above backdrop */
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto; /* Allow scrolling */
        padding: var(--spacing-m);
    }

    .modal {
        display: flex;
        flex-direction: column;

        /* Standard Styles */
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-xl);
        padding: 0;
        max-width: 600px;
        width: auto;
        position: relative;
        max-height: 85vh;
        overflow: hidden;

        &.variant-profile {
            align-self: center; /* Ensure top alignment for scrolling */
            margin: auto;

            /* Reset Standard constraints */
            max-height: none;
            width: max-content;
            max-width: 100vw;
            height: auto;
            min-height: auto; /* Remove 100% min-height to fix click blocking, or verify behavior */

            /* If the Profile Card *needs* to be tall, it will define its own height. */
            /* If we need the modal container to be the scroll surface, .modal-layout does that. */

            border: none;
            background: transparent;
            box-shadow: none;
            overflow: visible;
            padding: 0;
        }

        &.variant-preview {
            background: transparent;
            width: auto;
            height: auto;
            max-width: 95vw;
            max-height: 95vh;
            border: none;
            box-shadow: none;
            position: relative;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: visible;
        }
    }
</style>
