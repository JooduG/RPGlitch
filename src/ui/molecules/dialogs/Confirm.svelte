<script>
    /**
     * Security Confirm Modal
     * A promise-based confirmation dialog.
     */
    import Button from "@ui/atoms/Button.svelte"
    import { quintOut } from "svelte/easing"
    import { fade, scale } from "svelte/transition"
    let { title = "Confirm Action", message = "Are you sure?", confirm_label = "Confirm", cancel_label = "Cancel", on_confirm = () => {}, on_cancel = () => {}, open = $bindable(false) } = $props()
    let dialog = $state()
    let confirm_btn = $state()
    $effect(() => {
        if (open && dialog) {
            dialog.showModal()
            confirm_btn?.focus()
        } else if (!open && dialog) {
            dialog.close()
        }
    })
    function handle_confirm() {
        on_confirm()
        open = false
    }
    function handle_cancel() {
        on_cancel()
        open = false
    }
    function handle_keydown(e) {
        if (e.key === "Escape") {
            handle_cancel()
        }
    }
</script>

{#if open}
    <dialog bind:this={dialog} onclose={handle_cancel} onkeydown={handle_keydown} transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}>
        <article class="security-modal">
            <header>
                <h3>{title}</h3>
                <Button variant="ghost" className="icon-only" onclick={handle_cancel} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </Button>
            </header>
            <div class="content">
                <p>{message}</p>
            </div>
            <footer>
                <Button variant="ghost" onclick={handle_cancel} label={cancel_label} />
                <Button variant="danger" onclick={handle_confirm} bind:this={confirm_btn} label={confirm_label} />
            </footer>
        </article>
    </dialog>
    <!-- Backdrop -->
    <div class="backdrop" transition:fade={{ duration: 150 }} onclick={handle_cancel} role="presentation"></div>
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
        background: var(--surface-void);
        z-index: calc(var(--z-modal) - 1);
    }
    .security-modal {
        background: var(--surface-raised);
        box-shadow:
            inset 0 0 0 1px var(--border-light),
            var(--shadow-xxl);
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
        background: var(--surface-raised);
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
        background: var(--surface-sunken);
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
