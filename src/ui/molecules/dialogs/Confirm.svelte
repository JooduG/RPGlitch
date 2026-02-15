<script>
    /**
     * Security Confirm Modal
     * A promise-based confirmation dialog.
     */

    import Button from "@ui/atoms/Button.svelte"
    import { quintOut } from "svelte/easing"
    import { fade, scale } from "svelte/transition"

    let {
        title = "Confirm Action",
        message = "Are you sure?",
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        onConfirm = () => {},
        onCancel = () => {},
        open = $bindable(false),
    } = $props()

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
    <dialog
        bind:this={dialog}
        onclose={handleCancel}
        onkeydown={handleKeydown}
        transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}
    >
        <article class="security-modal">
            <header>
                <h3>{title}</h3>
                <Button
                    variant="ghost"
                    class="icon-only"
                    onclick={handleCancel}
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="icon"
                    >
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                    </svg>
                </Button>
            </header>

            <div class="content">
                <p>{message}</p>
            </div>

            <footer>
                <Button
                    variant="ghost"
                    onclick={handleCancel}
                    label={cancelLabel}
                />
                <Button
                    variant="danger"
                    onclick={handleConfirm}
                    bind:this={confirmBtn}
                    label={confirmLabel}
                />
            </footer>
        </article>
    </dialog>

    <!-- Backdrop -->
    <div
        class="backdrop"
        transition:fade={{ duration: 150 }}
        onclick={handleCancel}
        role="presentation"
    ></div>
{/if}

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    dialog {
        background: transparent;
        border: none;
        padding: 0;
        margin: auto;
        max-width: 90vw;
        width: 400px;
        color: inherit;
        z-index: z(modal);
        overflow: visible;

        &::backdrop {
            background: transparent; /* Handled by our custom backdrop div */
        }
    }

    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: calc(z(modal) - 1);
    }

    .security-modal {
        background: var(--bg-card);
        /* Border purged */
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        header {
            padding: 1rem 1.5rem;
            /* Border-bottom purged */
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.02);

            h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 700;
                font-family: var(--font-heading);
                color: var(--app-color);
            }
        }

        .content {
            padding: 1.5rem;
            color: var(--app-muted);
            font-size: 0.95rem;
            line-height: 1.5;
        }

        footer {
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            background: rgba(0, 0, 0, 0.2);
        }
    }

    /* Button styling delegated to Button component */
    :global(.security-modal .icon-only.btn) {
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: auto;

        .icon {
            width: 1.25rem;
            height: 1.25rem;
        }
    }
</style>
