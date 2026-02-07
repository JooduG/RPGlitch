<script>
    import Button from "@ui/atoms/Button.svelte"

    let {
        isEditing = $bindable(),
        isSaving,
        handleSave,
        handleDelete,
    } = $props()
</script>

<footer data-testid="profile-footer">
    {#if isEditing}
        <div class="footer-actions">
            <Button
                variant="danger"
                className="profile-btn"
                onclick={handleDelete}
                disabled={isSaving}
                data-testid="delete-btn"
            >
                Delete
            </Button>
            <Button
                variant="edit"
                className="profile-btn"
                onclick={handleSave}
                disabled={isSaving}
                data-testid="save-btn"
            >
                {isSaving ? "Saving..." : "Save"}
            </Button>
        </div>
    {:else}
        <Button
            variant="edit"
            className="profile-btn"
            onclick={() => {
                isEditing = true
            }}
            data-testid="edit-btn"
        >
            Edit
        </Button>
    {/if}
</footer>

<style lang="scss">
    @use "../../../theme/abstracts/placeholders" as *;

    footer {
        margin-top: auto;
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: var(--spacing-s);
        padding: var(--spacing-m) var(--spacing-l);
        background: color-mix(
            in srgb,
            rgba(0, 0, 0, 0.4),
            var(--signature-color) 12%
        );
        border-top: 0;
        z-index: 10;

        :global(.profile-btn.btn) {
            height: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: var(--spacing-s) var(--spacing-xl);
            transition: all 0.3s ease;
            width: 50%;
        }

        .footer-actions {
            grid-column: 2;
            display: flex;
            gap: var(--spacing-m);
            width: 100%;

            :global(.btn) {
                flex: 1;
                width: 100%;
            }

            :global(.btn-danger) {
                background: transparent;
                border-color: rgba(255, 255, 255, 0.1);
                color: var(--app-muted);
                box-shadow: none;
                transition: all 0.3s ease;

                &:hover {
                    background: var(--app-del);
                    border-color: var(--app-del);
                    color: white;
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
                    filter: brightness(1.2);
                }
            }
        }

        /* Readonly "Edit" Button - Target direct child of footer */
        > :global(.btn-edit) {
            grid-column: 2;
            /* Calculate 50% width minus half the gap, to match one of the two buttons */
            width: calc(50% - (var(--spacing-m) / 2));
            justify-self: end;

            background: var(--signature-color);
            color: white;
            box-shadow: 0 4px 15px
                color-mix(in oklab, var(--signature-color) 40%, transparent);

            &:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
                box-shadow: 0 6px 20px
                    color-mix(in oklab, var(--signature-color) 60%, transparent);
            }
        }

        /* Edit Button inside .footer-actions (Save) needs to just inherit flex */
        .footer-actions :global(.btn-edit) {
            background: var(--signature-color);
            color: white;
            box-shadow: 0 4px 15px
                color-mix(in oklab, var(--signature-color) 40%, transparent);
            /* Ensure it fills flex container */
            width: 100%;

            &:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
                box-shadow: 0 6px 20px
                    color-mix(in oklab, var(--signature-color) 60%, transparent);
            }
        }
    }
</style>
