<script>
    import { db } from "@data/database/db.js"
    import { app } from "@state/app.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Toggle from "@ui/atoms/Toggle.svelte"
    import Modal from "@ui/molecules/Modal.svelte"

    function handleAction(action) {
        app.log(`Control Panel: ${action}`, "system")
    }

    async function handleReset() {
        if (confirm("This will wash away all memories. Are you sure?")) {
            await db.delete()
            localStorage.clear()
            window.location.reload()
        }
    }

    /* --- STATE HELPERS --- */
    let isStoryboard = $derived(app.view === "lobby")
    let isStoryMode = $derived(app.view === "game")

    /* --- SNIPPETS --- */
</script>

{#snippet prologuePanel()}
    <div class="prologue-section">
        <div class="prologue-input-area">
            <textarea
                class="prologue-input"
                placeholder="(Optional) e.g., 'Start in media res', 'Describe the weather first'"
                bind:value={app.prologue}
            ></textarea>
        </div>
    </div>
{/snippet}

{#snippet header()}
    <!-- HEADER: Settings (Audio/Call) -->
    <div class="header-toggles">
        <Toggle
            label="CALL MODE"
            bind:value={app.settings.callMode}
            onchange={app.saveSettings}
        />
        <Toggle
            label="NOTIFICATIONS"
            bind:value={app.settings.sound}
            onchange={app.saveSettings}
        />
    </div>
{/snippet}

{#snippet actions()}
    <!-- BODY: Actions (Story Mode Only) -->
    {#if isStoryMode}
        <div class="action-row">
            <Button
                label="GHOSTWRITE"
                variant="secondary"
                size="sm"
                onclick={() => handleAction("Ghostwrite")}
            />
            <Button
                label="PHOTO"
                variant="secondary"
                size="sm"
                onclick={() => handleAction("Photo")}
            />
            <Button
                label="END STORY"
                variant="secondary"
                size="sm"
                onclick={() => handleAction("EndStory")}
            />
        </div>
    {/if}
{/snippet}

{#snippet footer()}
    <!-- NAVIGATION & META -->
    <div class="footer-nav">
        <div class="story-controls">
            <!-- Universal: Library always accessible -->
            <button
                class="nav-link"
                onclick={() => handleAction("OpenLibrary")}
            >
                Story Library
            </button>
        </div>

        <div class="advanced-section">
            <div class="advanced-controls">
                <Toggle
                    label="DEVELOPER MODE"
                    bind:value={app.settings.devMode}
                    onchange={app.saveSettings}
                />
                <Button variant="secondary" size="sm" onclick={handleReset}>
                    <div class="btn-inner">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-2 2-2 2H7c0 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>RESET DATA</span>
                    </div>
                </Button>
            </div>
        </div>
    </div>
{/snippet}

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
    <div class="cockpit-panel" data-testid="cockpit-panel">
        {@render header()}

        {#if isStoryboard}
            {@render prologuePanel()}
        {/if}

        {@render actions()}
        {@render footer()}
    </div>
</Modal>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;

    .cockpit-panel {
        width: 30rem; /* Slightly wider for the pill */
        background: #18181b; /* Zinc-900 (Darker, opaque-ish) */
        border: 1px solid #27272a; /* Zinc-800 */
        border-radius: var(--radius-l);
        box-shadow: var(--shadow-2xl);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        font-family: "Inter", sans-serif;
        color: var(--zinc-100);
        overflow: hidden;
    }

    /* .panel-header removed */

    /* --- PROLOGUE (Input Only) --- */
    .prologue-section {
        .prologue-input-area {
            background: #27272a; /* Zinc-800 input bg */
            border-radius: var(--radius-m);
            padding: 0.75rem;
            border: 1px solid #3f3f46; /* Zinc-700 */

            .prologue-input {
                width: 100%;
                min-height: 5rem;
                background: transparent;
                border: none;
                color: var(--zinc-300);
                font-family: var(
                    --font-sans
                ); /* Not mono anymore per image aesthetic */
                font-size: 0.9rem;
                resize: none;
                outline: none;

                &::placeholder {
                    color: var(--zinc-500);
                    font-style: italic;
                }
            }
        }
    }

    /* --- TOGGLES (Header) --- */
    .header-toggles {
        display: flex;
        gap: 2rem; /* Wide spacing per image */
        justify-content: flex-start;
    }

    /* --- ACTION ROW (Story Mode) --- */
    .action-row {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        /* Pill background removed per request */
    }

    /* --- FOOTER & NAV --- */
    .footer-nav {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .story-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        .nav-link {
            background: none;
            border: none;
            color: var(--zinc-100);
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            &:hover {
                text-decoration: underline;
            }
        }

        /* Primary Button moved to Main Actions */
    }

    /* --- ADVANCED SECTION --- */
    .advanced-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        /* Divider removed */

        .advanced-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .btn-inner {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            /* .reset-btn removed */
        }
    }
</style>
