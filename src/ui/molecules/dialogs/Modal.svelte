<script>
    let {
        on_close,
        variant = "standard", // 'standard' | 'profile' | 'preview'
        z_index = 9999,
        children,
    } = $props()

    import { quintOut } from "svelte/easing"
    import { fly } from "svelte/transition"
    import Backdrop from "./Backdrop.svelte"

    function handle_keydown(e) {
        if (e.key === "Escape") on_close()
    }
</script>

<svelte:window onkeydown={handle_keydown} />

<!-- Visual Layer -->
<Backdrop onclick={on_close} z_index={z_index - 1} />

<!-- Interaction & Layout Layer -->
<div
    class="modal-layout"
    style="z-index: {z_index};"
    role="button"
    tabindex="-1"
    onclick={(e) => {
        if (e.target === e.currentTarget) on_close()
    }}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            if (e.target === e.currentTarget) on_close()
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
                on_close()
            }
        }}
        onkeydown={(e) => {
            if (variant === "profile" && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                on_close()
            }
        }}
    >
        {@render children()}
    </div>
</div>

<style>
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
        background: var(--surface-raised);
        box-shadow:
            inset 0 0 0 1px var(--border-light),
            var(--shadow-xl);
        border-radius: var(--border-radius-l);
        padding: 0;
        max-width: 37.5rem; /* ~600px */
        width: auto;
        position: relative;
        max-height: 85vh;
        overflow: hidden;
    }

    .modal.variant-profile {
        align-self: center; /* Ensure top alignment for scrolling */
        margin: auto;

        /* Reset Standard constraints */
        max-height: none;
        width: max-content;
        max-width: 100vw;
        height: auto;
        min-height: auto; /* Prevents the modal from stretching to full height, which would block clicks on elements behind it. */
        /* If the Profile Card *needs* to be tall, it will define its own height. */
        /* If we need the modal container to be the scroll surface, .modal-layout does that. */

        border: none;
        background: transparent;
        box-shadow: none;
        overflow: visible;
        padding: 0;
    }

    .modal.variant-preview {
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

    .close-btn {
        position: absolute;
        top: var(--spacing-xs);
        right: var(--spacing-xs);
        background: none;
        border: none;
        color: var(--zinc-400);
        font-size: var(--font-size-xxl);
        width: var(--spacing-xl);
        height: var(--spacing-xl);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: var(--zinc-100);
    }
</style>
