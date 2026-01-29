<script>
    let {
        onclose,
        variant = "standard", // 'standard' | 'profile' | 'preview'
        children,
    } = $props()

    function handleKeydown(e) {
        if (e.key === "Escape") onclose()
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="backdrop"
    onclick={(e) => {
        // Close if clicking the backdrop itself or the empty space around the modal
        // The .backdrop is the fixed overlay.
        if (e.target === e.currentTarget) onclose()
    }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <div class="modal variant-{variant}" role="presentation">
        {@render children()}
    </div>
</div>

<style lang="scss">
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fade-in 0.2s ease-out;
    }

    .modal {
        display: flex;
        flex-direction: column;
        animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);

        /* Default (standard) modal styles */
        width: 30rem;
        max-width: 100%;
        max-height: 85vh;
        overflow-y: auto;

        &.variant-profile {
            display: flex;
            align-items: flex-start; /* Start from top if overflowing */
            justify-content: center;
            border-radius: 0;
            width: max-content;
            max-width: 100vw;
            height: max-content;
            min-height: 100%;
            padding: var(--spacing-xxl) var(--spacing-lg); /* Vertical breathing room */
            position: relative;
            background: transparent;
            box-shadow: none;
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
        }
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes scale-in {
        from {
            transform: scale(0.98);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
