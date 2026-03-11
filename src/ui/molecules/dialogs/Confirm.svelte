<script>
    /**
     * Security Confirm Modal
     * A promise-based confirmation dialog.
     */

    import Button from "@ui/atoms/Button.svelte"
    import { quintOut } from "svelte/easing"
    import { fade, scale } from "svelte/transition"

    let { title = "Confirm Action", message = "Are you sure?", confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm = () => {}, onCancel = () => {}, open = $bindable(false) } = $props()

    let dialog = $state()
    let confirmBtn = $state()

    $effect(() => {
        if (open && dialog) {
            dialog.showModal()
            confirmBtn?.focus()
        } else if (!open && dialog) {
            dialog.close()
        }
    })

    function handleConfirm() {
        onConfirm()
        open = false
    }

    function handleCancel() {
        onCancel()
        open = false
    }

    function handleKeydown(e) {
        if (e.key === "Escape") {
            handleCancel()
        }
    }
</script>

{#if open}
    <dialog bind:this={dialog} onclose={handleCancel} onkeydown={handleKeydown} transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}>
        <article class="security-modal">
            <header>
                <h3>{title}</h3>
                <Button variant="ghost" class="icon-only" onclick={handleCancel} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </Button>
            </header>

            <div class="content">
                <p>{message}</p>
            </div>

            <footer>
                <Button variant="ghost" onclick={handleCancel} label={cancelLabel} />
                <Button variant="danger" onclick={handleConfirm} bind:this={confirmBtn} label={confirmLabel} />
            </footer>
        </article>
    </dialog>

    <!-- Backdrop -->
    <div class="backdrop" transition:fade={{ duration: 150 }} onclick={handleCancel} role="presentation"></div>
{/if}

<style>
    dialog {
        background: transparent;
        border: none;
        padding: 0;
        margin: auto;
        max-width: 90vw;
        width: 400px;
        color: inherit;
        z-index: var(--z-modal);
        overflow: visible;
    }

    dialog::backdrop {
        background: transparent; /* Handled by our custom backdrop div */
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .security-modal h3 {
        margin: 0;
        font-size: var(--font-size-l);
        font-weight: 700;
        font-family: var(--font-heading);
        color: var(--font-color);
    }

    .security-modal .content {
        padding: var(--spacing-xl);
        color: var(--font-muted);
        font-size: var(--font-size-m);
        line-height: var(--line-height-relaxed);
    }

    .security-modal footer {
        padding: var(--spacing-m) var(--spacing-xl);
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-s);
        background: rgb(var(--pure-black-rgb) / var(--opacity-s));
    }

    /* Button styling delegated to Button component */
    :global(.security-modal .icon-only.btn) {
        padding: var(--spacing-xxs);
        display: flex;
        align-items: center;
        justify-content: center;
        width: auto;
    }

    :global(.security-modal .icon-only .icon) {
        width: var(--spacing-l);
        height: var(--spacing-l);
    }
</style>
