<script>
    /**
     * Security Alert Modal
     * Simple informational dialog.
     */
    import Button from "@ui/atoms/Button.svelte"
    import { quintOut } from "svelte/easing"
    import { fade, scale } from "svelte/transition"

    let { title = "System Alert", message = "Notice", buttonLabel = "OK", onClose = () => {}, open = $bindable(false) } = $props()

    let dialog = $state()
    let okBtn = $state()

    $effect(() => {
        if (open && dialog) {
            dialog.showModal()
            // Manual focus management to clear a11y warning
            okBtn?.focus()
        } else if (!open && dialog) {
            dialog.close()
        }
    })

    function handleClose() {
        onClose()
        open = false
    }

    function handleKeydown(e) {
        if (e.key === "Escape") handleClose()
    }
</script>

{#if open}
    <dialog bind:this={dialog} onclose={handleClose} onkeydown={handleKeydown} transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}>
        <article class="security-modal">
            <header>
                <h3>{title}</h3>
            </header>

            <div class="content">
                <p>{message}</p>
            </div>

            <footer>
                <Button variant="primary" onclick={handleClose} bind:this={okBtn} label={buttonLabel} />
            </footer>
        </article>
    </dialog>

    <!-- Backdrop -->
    <div class="backdrop" transition:fade={{ duration: 150 }} onclick={handleClose} role="presentation"></div>
{/if}

<style>
    dialog {
        background: transparent;
        border: none;
        padding: 0;
        margin: auto;
        max-width: 90vw;
        width: 350px;
        color: inherit;
        z-index: var(--z-modal);
        overflow: visible;
    }

    dialog::backdrop {
        background: transparent;
    }

    .backdrop {
        position: fixed;
        inset: 0;
        background: rgb(var(--pure-black-rgb) / var(--opacity-xl));
        backdrop-filter: blur(var(--blur-s));
        z-index: calc(var(--z-modal) - 1);
    }

    .security-modal {
        background: var(--bg-card);
        box-shadow: var(--shadow-xxl);
        border-radius: var(--border-radius-l);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .security-modal header {
        padding: var(--spacing-m) var(--spacing-xl);
        background: rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .security-modal h3 {
        margin: 0;
        font-size: var(--font-size-l);
        font-weight: 700;
        font-family: var(--font-heading);
        color: var(--app-color);
        display: flex;
        align-items: center;
        gap: var(--spacing-s);
    }

    .security-modal h3::before {
        content: "ℹ";
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--spacing-xl);
        height: var(--spacing-xl);
        background: rgb(var(--brand-accent-rgb, 59 130 246) / var(--opacity-s));
        color: var(--app-info);
        border-radius: var(--border-radius-full);
        font-size: var(--font-size-s);
    }

    .security-modal .content {
        padding: var(--spacing-xl);
        color: var(--app-muted);
        font-size: var(--font-size-m);
        line-height: var(--line-height-relaxed);
    }

    .security-modal footer {
        padding: var(--spacing-m) var(--spacing-xl);
        display: flex;
        justify-content: flex-end;
        background: rgb(var(--pure-black-rgb) / var(--opacity-s));
    }

    /* button styles removed - utilizing Button component */
</style>
