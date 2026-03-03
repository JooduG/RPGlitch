<script>
    import { db } from "@data/db.js"
    import { app } from "@state/app.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Toggle from "@ui/atoms/Toggle.svelte"
    import Modal from "@ui/molecules/dialogs/Modal.svelte"

    /**
     * 🕹️ ControlPanel (UI)
     * Main system interface for settings and prologue configuration.
     * Follows the [Polish Protocol] v1.0.0
     */

    function handleAction(action) {
        app.log(`Control Panel: ${action}`, "system")
    }

    async function handleReset() {
        if (confirm("This will wash away all memories. Are you sure?")) {
            await db.delete()
            window.location.reload()
        }
    }

    /* --- STATE HELPERS --- */
    let isStoryboard = $derived(app.view === "lobby")
    let isStoryMode = $derived(app.view === "game")
</script>

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
    <article class="cockpit-panel" data-testid="cockpit-panel">
        <!-- HEADER: System Toggles -->
        <header class="panel-header">
            <div class="status-toggles">
                <Toggle label="CALL MODE" bind:value={app.settings.call_mode} onchange={() => app.saveSettings()} />
                <Toggle label="NOTIFICATIONS" bind:value={app.settings.sound} onchange={() => app.saveSettings()} />
            </div>
        </header>

        <!-- BODY: Prologue (Lobby Only) -->
        {#if isStoryboard}
            <section class="prologue-setup">
                <div class="input-wrapper">
                    <textarea class="prologue-field" placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'" bind:value={app.prologue}></textarea>
                </div>
            </section>
        {/if}

        <!-- BODY: Actions (Story Mode Only) -->
        {#if isStoryMode}
            <nav class="action-grid">
                <Button label="GHOSTWRITE" variant="secondary" size="sm" onclick={() => handleAction("Ghostwrite")} />
                <Button label="PHOTO" variant="secondary" size="sm" onclick={() => handleAction("Photo")} />
                <Button label="END STORY" variant="secondary" size="sm" onclick={() => handleAction("EndStory")} />
            </nav>
        {/if}

        <!-- FOOTER: Navigation & Meta -->
        <footer class="panel-footer">
            <div class="navigation-links">
                <button class="nav-btn" onclick={() => handleAction("OpenLibrary")}> Story Library </button>
            </div>

            <div class="system-meta">
                <div class="dev-toggle">
                    <Toggle label="DevMode" bind:value={app.settings.dev_mode} onchange={() => app.saveSettings()} />
                </div>
                <Button variant="secondary" size="sm" onclick={handleReset}>
                    <div class="reset-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>RESET DATA</span>
                    </div>
                </Button>
            </div>
        </footer>
    </article>
</Modal>

<style lang="scss">
    .cockpit-panel {
        width: 32rem;
        background: var(--surface-overlay);
        backdrop-filter: blur(var(--blur-m));
        box-shadow: var(--shadow-l);
        border-radius: var(--radius-lg);
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
        font-family: var(--font-family-sans);
        color: var(--text-primary);
        overflow: hidden;
    }

    .status-toggles {
        display: flex;
        gap: var(--spacing-xl);
        justify-content: flex-start;
    }

    .prologue-setup {
        .input-wrapper {
            background: rgba(0, 0, 0, var(--opacity-s));
            border-radius: var(--radius-md);
            padding: var(--spacing-s);

            .prologue-field {
                width: 100%;
                min-height: 6rem;
                background: transparent;
                border: none;
                color: var(--text-secondary);
                font-family: var(--font-family-sans);
                font-size: var(--font-size-s);
                resize: none;
                outline: none;

                &::placeholder {
                    color: var(--text-muted);
                    font-style: italic;
                }
            }
        }
    }

    .action-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        justify-content: center;
    }

    .panel-footer {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
    }

    .navigation-links {
        display: flex;
        justify-content: center;

        .nav-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-weight: 600;
            font-size: var(--font-size-s);
            cursor: pointer;
            transition: color 200ms var(--curve-snappy);

            &:hover {
                color: var(--text-primary);
                text-decoration: underline;
            }
        }
    }

    .system-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .reset-wrapper {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }
    }
</style>
