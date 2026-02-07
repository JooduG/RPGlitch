<script>
    /**
     * Warden Alert Modal
     * Simple informational dialog.
     */
    import Button from "@ui/atoms/Button.svelte"
    import { quintOut } from "svelte/easing"
    import { fade, scale } from "svelte/transition"

    let {
        title = "System Alert",
        message = "Notice",
        buttonLabel = "OK",
        onClose = () => {},
        open = $bindable(false),
    } = $props()

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
    <dialog
        bind:this={dialog}
        onclose={handleClose}
        onkeydown={handleKeydown}
        transition:scale={{ duration: 200, start: 0.95, easing: quintOut }}
    >
        <article class="warden-modal">
            <header>
                <h3>{title}</h3>
            </header>

            <div class="content">
                <p>{message}</p>
            </div>

            <footer>
                <Button
                    variant="primary"
                    onclick={handleClose}
                    bind:this={okBtn}
                    label={buttonLabel}
                />
            </footer>
        </article>
    </dialog>

    <!-- Backdrop -->
    <div
        class="backdrop"
        transition:fade={{ duration: 150 }}
        onclick={handleClose}
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
        width: 350px;
        color: inherit;
        z-index: z(modal);
        overflow: visible;

        &::backdrop {
            background: transparent;
        }
    }

    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: calc(z(modal) - 1);
    }

    .warden-modal {
        background: #1a1b26; /* Dark Navy/Black */
        /* Border purged */
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        header {
            padding: 1rem 1.5rem;
            /* Border-bottom purged */
            background: rgba(255, 255, 255, 0.02);

            h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 700;
                font-family: var(--font-heading);
                color: #e2e8f0;
                display: flex;
                align-items: center;
                gap: 0.5rem;

                &::before {
                    content: "ℹ";
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.5rem;
                    height: 1.5rem;
                    background: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                    border-radius: 50%;
                    font-size: 0.9rem;
                }
            }
        }

        .content {
            padding: 1.5rem;
            color: #94a3b8;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        footer {
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: flex-end;
            background: rgba(0, 0, 0, 0.2);
        }
    }

    /* button styles removed - utilizing Button component */
</style>
