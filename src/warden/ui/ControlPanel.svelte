<script>
    import Button from "../../artificer/Button.svelte"
    import Modal from "../../artificer/Modal.svelte"
    import Toggle from "../../artificer/Toggle.svelte"
    import { app } from "../../gamemaster/state.svelte.js"
    import { db } from "../../scholar/database/db.js"

    function handleAction(action) {
        console.log(`[ControlPanel] Action triggered: ${action}`)
        app.log(`Control Panel: ${action}`, "system")
    }
    async function handleReset() {
        if (confirm("This will wash away all memories. Are you sure?")) {
            await db.delete()
            localStorage.clear()
            window.location.reload()
        }
    }

    function toggleView() {
        app.view = app.view === "game" ? "lobby" : "game"
    }
</script>

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
    <div class="control-frame">
        <!-- 1. THE DASHBOARD (Fixed Header) -->
        <div class="frame-header">
            <div class="header-toggles">
                <Toggle
                    label="Call Mode"
                    size="sm"
                    bind:value={app.settings.callMode}
                    onchange={app.saveSettings}
                />
                <Toggle
                    label="Notifications"
                    size="sm"
                    bind:value={app.settings.sound}
                    onchange={app.saveSettings}
                />
            </div>
            <div class="header-line"></div>
        </div>

        <!-- 2. THE SCREEN (Dynamic Core) -->
        <div class="frame-body">
            {#if app.view === "game"}
                <!-- GAME MODE (Storymode) -->
                <div class="mode-game">
                    <div class="game-toggles">
                        <Toggle
                            label="Stream Text"
                            size="sm"
                            bind:value={app.settings.streamText}
                            onchange={app.saveSettings}
                        />
                        <Toggle
                            label="Auto-Scroll"
                            size="sm"
                            bind:value={app.settings.autoScroll}
                            onchange={app.saveSettings}
                        />
                    </div>

                    <div class="action-grid">
                        <Button
                            label="Ghostwrite"
                            variant="primary-glow"
                            class="action-btn"
                            onclick={() => handleAction("Ghostwrite")}
                        />
                        <Button
                            label="Photo"
                            variant="secondary"
                            class="action-btn"
                            onclick={() => handleAction("RequestPhoto")}
                        />
                        <Button
                            label="Vis"
                            variant="secondary"
                            class="action-btn"
                            onclick={() => handleAction("RequestVis")}
                        />
                    </div>

                    <div class="danger-zone">
                        <Button
                            label="End Story"
                            variant="danger-ghost"
                            size="sm"
                            onclick={() => handleAction("EndStory")}
                            class="full-width"
                        />
                    </div>
                </div>
            {:else}
                <!-- LOBBY MODE (Storyboard) -->
                <div class="mode-lobby">
                    <span class="input-label">Mission Briefing</span>
                    <textarea
                        class="prologue-input"
                        placeholder="Setup instructions (e.g. 'Start in a rainy alleyway...')"
                        bind:value={app.prologue}
                        rows="3"
                    ></textarea>
                </div>
            {/if}
        </div>

        <!-- 3. THE CONSOLE (Fixed Footer) -->
        <div class="frame-footer">
            <div class="footer-line"></div>

            <div class="library-section">
                <Button
                    label="Memory Archive"
                    variant="ghost"
                    size="md"
                    class="full-width library-btn"
                    onclick={() => handleAction("OpenLibrary")}
                />
            </div>

            <div class="meta-links">
                <Toggle
                    label="Dev"
                    size="sm"
                    bind:value={app.settings.devMode}
                    onchange={app.saveSettings}
                />
                <button class="text-link danger" onclick={handleReset}
                    >Reset Data</button
                >
            </div>
        </div>

        <!-- DEBUG SCENE SWITCHER -->
        <button class="debug-switcher" onclick={toggleView} title="Swap View">
            ⇄
        </button>
    </div>
</Modal>

<style lang="scss">
    .control-frame {
        width: 24rem;
        background: #0f1115; /* Deep cockpit black */
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1.25rem;
        box-shadow:
            0 50px 100px -20px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(0, 0, 0, 0.5); /* Inner rim */
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
    }

    /* --- HEADER --- */
    .frame-header {
        padding: 1.25rem 1.5rem 0 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.03),
            transparent
        );

        .header-toggles {
            display: flex;
            justify-content: space-between;
        }

        .header-line {
            height: 1px;
            background: linear-gradient(
                to right,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
            );
            width: 100%;
        }
    }

    /* --- BODY --- */
    .frame-body {
        padding: 1.5rem;
        min-height: 14rem;
        display: flex;
        flex-direction: column;
        justify-content: center; /* Center content vertically */
        position: relative;

        /* Subtle scanline/grid effect background */
        background-color: rgba(255, 255, 255, 0.005);
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }

    /* GAME MODE STYLES */
    .mode-game {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .game-toggles {
            display: flex;
            justify-content: space-between;
            padding-bottom: 1rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .action-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.5rem;

            :global(.action-btn) {
                height: 3.5rem; /* Taller, more tactile buttons */
            }
        }

        .danger-zone {
            padding-top: 0.5rem;
        }
    }

    /* LOBBY MODE STYLES */
    .mode-lobby {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .input-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 700;
        }

        .prologue-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem;
            color: #e4e4e7;
            padding: 1rem;
            font-family: var(--font-body);
            font-size: 0.95rem;
            line-height: 1.5;
            resize: none;
            outline: none;
            transition: all 0.2s;
            height: 8rem;

            &:focus {
                background: rgba(0, 0, 0, 0.5);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
            }

            &::placeholder {
                color: rgba(255, 255, 255, 0.2);
                font-style: italic;
            }
        }
    }

    /* --- FOOTER --- */
    .frame-footer {
        padding: 0 1.5rem 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .footer-line {
            height: 1px;
            background: linear-gradient(
                to right,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
            );
            width: 100%;
            margin-bottom: 0.5rem;
        }

        .library-section {
            :global(.library-btn) {
                border-color: rgba(255, 255, 255, 0.15) !important;
                background: rgba(255, 255, 255, 0.03) !important;

                &:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                    border-color: rgba(255, 255, 255, 0.3) !important;
                }
            }
        }

        .meta-links {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .text-link {
                background: none;
                border: none;
                padding: 0;
                font-size: 0.75rem;
                opacity: 0.4;
                cursor: pointer;
                transition: opacity 0.2s;

                &:hover {
                    opacity: 1;
                    text-decoration: underline;
                }

                &.danger {
                    color: #ef4444;
                }
            }
        }
    }

    /* UTILITIES */
    :global(.variant-primary-glow) {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;

        &:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
        }
    }

    :global(.variant-danger-ghost) {
        background: rgba(239, 68, 68, 0.05) !important;
        border: 1px solid rgba(239, 68, 68, 0.2) !important;
        color: #ef4444 !important;

        &:hover {
            background: rgba(239, 68, 68, 0.15) !important;
            border-color: rgba(239, 68, 68, 0.4) !important;
        }
    }

    .debug-switcher {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        opacity: 0;
        width: 20px;
        height: 20px;

        &:hover {
            opacity: 0.5;
        }
    }

    @keyframes scale-up {
        from {
            transform: scale(0.95);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
