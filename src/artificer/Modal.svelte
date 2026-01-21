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
        background: rgba(0, 0, 0, 0.7);
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
            align-items: center;
            justify-content: center;
            border-radius: 0;
            width: max-content; /* Allow content to define width (for wings) */
            max-width: 98vw;
            height: auto;
            max-height: 98vh;
            position: relative;
            background: transparent; /* Let children handle background */
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
