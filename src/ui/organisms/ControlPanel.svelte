<script>
    import { db } from "@data/database/db.js"
    import { app } from "@state/app.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Toggle from "@ui/atoms/Toggle.svelte"
    import Modal from "@ui/molecules/Modal.svelte"

    // Derive some cockpit indicators
    let linkStrength = $state(92)
    let realitySync = $state(78)
    let energyLevel = $state(45)

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

    function toggleView() {
        app.view = app.view === "game" ? "lobby" : "game"
    }

    // Interval to simulate some "alive" UI
    $effect(() => {
        const interval = setInterval(() => {
            linkStrength = 90 + Math.random() * 5
            realitySync = 75 + Math.random() * 10
        }, 3000)
        return () => clearInterval(interval)
    })
</script>

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
    <div class="cockpit-panel">
        <!-- 📡 1. STATUS BAR (The HUD) -->
        <div class="hud-header">
            <div class="hud-metrics">
                <div class="metric">
                    <span class="label">LINK</span>
                    <div class="bar-container">
                        <div
                            class="bar cyan"
                            style="width: {linkStrength}%"
                        ></div>
                    </div>
                </div>
                <div class="metric">
                    <span class="label">SYNC</span>
                    <div class="bar-container">
                        <div
                            class="bar orange"
                            style="width: {realitySync}%"
                        ></div>
                    </div>
                </div>
                <div class="metric">
                    <span class="label">NRG</span>
                    <div class="bar-container">
                        <div
                            class="bar white"
                            style="width: {energyLevel}%"
                        ></div>
                    </div>
                </div>
            </div>
            <button class="close-btn" onclick={() => app.toggleControlPanel()}
                >×</button
            >
        </div>

        <!-- 📟 2. TERMINAL (Mission Briefing) -->
        <div class="terminal-section">
            <div class="terminal-header">
                <span class="pulse">●</span> MISSION BRIEFING
            </div>
            <div class="terminal-screen">
                <div class="scanline"></div>
                {#if app.view === "game"}
                    <div class="terminal-content">
                        <p class="status-msg">STORY IN PROGRESS</p>
                        <p class="loc-msg">
                            > CURRENT SECTOR: {app.view.toUpperCase()}
                        </p>
                        <p class="brief-msg">
                            Simulation integrity stable. Monitoring narrative
                            flow.
                        </p>
                    </div>
                {:else}
                    <div class="terminal-input-area">
                        <textarea
                            class="prologue-terminal"
                            placeholder="INPUT MISSION PARAMETERS..."
                            bind:value={app.prologue}
                        ></textarea>
                    </div>
                {/if}
            </div>
        </div>

        <!-- 🕹️ 3. TACTICAL GRID (Actions) -->
        <div class="action-grid">
            <Button
                label="GHOSTWRITE"
                variant="glass"
                class="tactical-btn cyan"
                onclick={() => handleAction("Ghostwrite")}
            />
            <Button
                label="SCAN"
                variant="glass"
                class="tactical-btn"
                onclick={() => handleAction("Scan")}
            />
            <Button
                label="REROLL"
                variant="glass"
                class="tactical-btn orange"
                onclick={() => handleAction("Reroll")}
            />
        </div>

        <!-- 🎛️ 4. SYSTEM STACK (Toggles) -->
        <div class="system-stack">
            <div class="stack-row">
                <Toggle
                    label="DEV MODE"
                    size="sm"
                    bind:value={app.settings.devMode}
                    onchange={app.saveSettings}
                />
                <Toggle
                    label="AUDIO"
                    size="sm"
                    bind:value={app.settings.sound}
                    onchange={app.saveSettings}
                />
            </div>
            <div class="stack-row">
                <Toggle
                    label="STREAM"
                    size="sm"
                    bind:value={app.settings.streamText}
                    onchange={app.saveSettings}
                />
                <Toggle
                    label="AUTO-SCROLL"
                    size="sm"
                    bind:value={app.settings.autoScroll}
                    onchange={app.saveSettings}
                />
            </div>
        </div>

        <!-- 🗄️ 5. ARCHIVE & RESET -->
        <div class="footer-ops">
            <Button
                label="MEMORY ARCHIVE"
                variant="ghost"
                size="sm"
                class="archive-btn"
                onclick={() => handleAction("OpenLibrary")}
            />
            <div class="utility-row">
                <button class="debug-btn" onclick={toggleView}
                    >⇄ SWAP VIEW</button
                >
                <button class="reset-btn" onclick={handleReset}
                    >PURGE DATA</button
                >
            </div>
        </div>
    </div>
</Modal>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/surfaces" as *;

    .cockpit-panel {
        width: 26rem;
        background: rgba(var(--bg-app-rgb, #222326), var(--opacity-xl));
        backdrop-filter: blur(var(--blur-m)) saturate(180%);
        border: 1px solid var(--glass-border);
        border-radius: var(--spacing-l);
        box-shadow: var(--shadow-l);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        font-family: "Space Grotesk", "Inter", sans-serif;
        color: #e4e4e7;
        overflow: hidden;
        animation: panel-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;

        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(
                to bottom,
                rgba(59, 130, 246, var(--opacity-xs)),
                /* Hardcoded primary for safety */ transparent
            );
            pointer-events: none;
        }
    }

    /* --- HUD HEADER --- */
    .hud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .hud-metrics {
            display: flex;
            gap: 1.25rem;
            flex: 1;
        }

        .metric {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .label {
                font-size: 0.6rem;
                letter-spacing: 0.1em;
                font-weight: 700;
                color: rgba(255, 255, 255, var(--opacity-m));
            }

            .bar-container {
                height: 4px;
                background: rgba(255, 255, 255, var(--opacity-xs));
                border-radius: 2px;
                overflow: hidden;

                .bar {
                    height: 100%;
                    transition: width 0.3s ease;

                    &.cyan {
                        background: #0df2f2;
                        box-shadow: 0 0 8px #0df2f2;
                    }
                    &.orange {
                        background: #f97316;
                        box-shadow: 0 0 8px #f97316;
                    }
                    &.white {
                        background: #fff;
                        opacity: 0.8;
                    }
                }
            }
        }

        .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, var(--opacity-m));
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            line-height: 1;
            transition: color 0.2s;

            &:hover {
                color: #fff;
            }
        }
    }

    /* --- TERMINAL --- */
    .terminal-section {
        .terminal-header {
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: rgba(255, 255, 255, var(--opacity-l));
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .pulse {
                color: #ef4444;
                animation: blink 1s steps(2) infinite;
            }
        }

        .terminal-screen {
            background: var(--bg-input, rgba(0, 0, 0, 0.3));
            border: 1px solid var(--glass-border);
            border-radius: 0.75rem;
            height: 10rem;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;

            .scanline {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 50%;
                background: linear-gradient(
                    to bottom,
                    transparent,
                    rgba(59, 130, 246, var(--opacity-xs)),
                    transparent
                );
                animation: scan 4s linear infinite;
                pointer-events: none;
                z-index: 1;
            }

            .terminal-content {
                padding: 1.25rem;
                font-family: "JetBrains Mono", monospace;
                font-size: 0.85rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .status-msg {
                    color: #22c55e;
                    font-weight: 700;
                }
                .loc-msg {
                    color: #a1a1aa;
                }
                .brief-msg {
                    color: #e4e4e7;
                    line-height: 1.4;
                    margin-top: 0.5rem;
                }
            }

            .terminal-input-area {
                height: 100%;

                .prologue-terminal {
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    color: #0df2f2;
                    padding: 1.25rem;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 0.9rem;
                    resize: none;
                    outline: none;

                    &::placeholder {
                        color: rgba(13, 242, 242, 0.2);
                    }
                }
            }
        }
    }

    /* --- ACTIONS --- */
    .action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.75rem;

        :global(.tactical-btn) {
            height: 4rem;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            border: 1px solid var(--glass-border);
            background: rgba(255, 255, 255, var(--opacity-xs));

            &:hover {
                filter: brightness(1.2);
            }
        }

        /* Using decoupled global selectors to avoid Svelte compiler confusion with variant classes */
        :global(.tactical-btn.cyan:hover) {
            border-color: #0df2f2;
            box-shadow: 0 0 15px rgba(13, 242, 242, 0.3);
        }

        :global(.tactical-btn.orange:hover) {
            border-color: #f97316;
            box-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
        }
    }

    /* --- SYSTEM STACK --- */
    .system-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: rgba(255, 255, 255, var(--opacity-xs));
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid var(--glass-border);

        .stack-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    }

    /* --- FOOTER OPS --- */
    .footer-ops {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        :global(.archive-btn) {
            width: 100%;
            border: 1px dashed rgba(255, 255, 255, 0.15);

            &:hover {
                border-style: solid;
                background: rgba(255, 255, 255, 0.05);
            }
        }

        .utility-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.5rem;

            .debug-btn,
            .reset-btn {
                background: none;
                border: none;
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 0.05em;
                cursor: pointer;
                transition: opacity 0.2s;
            }

            .debug-btn {
                color: #a1a1aa;
                &:hover {
                    color: #fff;
                }
            }
            .reset-btn {
                color: #ef4444;
                opacity: 0.6;
                &:hover {
                    opacity: 1;
                }
            }
        }
    }

    @keyframes panel-slide-in {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes scan {
        from {
            transform: translateY(-100%);
        }
        to {
            transform: translateY(200%);
        }
    }

    @keyframes blink {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
</style>
