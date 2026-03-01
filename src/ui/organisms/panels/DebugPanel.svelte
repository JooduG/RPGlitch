<script>
    let {
        appState = {
            lastCompiledPrompt: '{\n  "SYSTEM": "INIT_OVERRIDE",\n  "STATUS": "AWAITING_INPUT",\n  "PAYLOAD": "[NULL]"\n}',
            environment: {
                turnNumber: 42,
                time: "23:04",
                location: "Neon District",
                weather: "Acid Rain",
                entropySeed: "0xDEADBEEF",
            },
            schema: {
                eternal: [{ id: "node_01", type: "core_fragment" }],
                past: ["event_alpha", "event_beta"],
                present: { status: "critical", integrity: "85%" },
                future: ["pending_collapse"],
            },
        },
    } = $props()

    let isOpen = $state(false)
    let activeTab = $state("payload")

    function togglePanel() {
        isOpen = !isOpen
    }

    function switchTab(tab) {
        activeTab = tab
    }
</script>

<div class="dev-hud-wrapper" class:open={isOpen}>
    <!-- Floating Dev Button -->
    <button class="dev-button" onclick={togglePanel}>
        {isOpen ? "[ ACCESS GRANTED ]" : "DEV_MODE"}
    </button>

    <!-- Slide-out Drawer -->
    <aside class="dev-drawer">
        <header class="drawer-header">
            <span class="hud-title">NET_INSPECTOR v1.0</span>
            <button class="close-btn" onclick={togglePanel}>×</button>
        </header>

        <nav class="drawer-tabs">
            <button class:active={activeTab === "payload"} onclick={() => switchTab("payload")}>
                <span class="flare"></span>PAYLOAD
            </button>
            <button class:active={activeTab === "sim"} onclick={() => switchTab("sim")}>
                <span class="flare"></span>SIM_STATE
            </button>
            <button class:active={activeTab === "schema"} onclick={() => switchTab("schema")}>
                <span class="flare"></span>SCHEMA
            </button>
        </nav>

        <div class="drawer-content">
            {#if activeTab === "payload"}
                <div class="panel-section">
                    <div class="section-title">&gt;&gt; LAST_COMPILED_PROMPT</div>
                    <pre class="data-dump">{appState.lastCompiledPrompt}</pre>
                </div>
            {/if}

            {#if activeTab === "sim"}
                <div class="panel-section">
                    <div class="section-title">&gt;&gt; ENVIRONMENTAL_VARS</div>
                    <div class="grid-list">
                        {#each Object.entries(appState.environment) as [key, val] (key)}
                            <div class="grid-row">
                                <span class="key">{key}</span>
                                <span class="val">{val}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if activeTab === "schema"}
                <div class="panel-section">
                    <div class="section-title">&gt;&gt; ENTITY_TEMPORAL_NODES</div>
                    <pre class="data-dump">{JSON.stringify(appState.schema, null, 2)}</pre>
                </div>
            {/if}
        </div>
    </aside>
</div>

<style lang="scss">
    :root {
        --hud-bg: rgba(10, 10, 15, 0.85); /* Matches App theme bg with blur */
        --hud-text: var(--app-color, #e2e8f0);
        --hud-muted: var(--app-muted, #94a3b8);
        --hud-accent: var(--app-accent, #3b82f6);
        --hud-mono-font: var(--font-mono, "Courier New", monospace);
    }

    .dev-hud-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 99999;
        pointer-events: none;

        &.open {
            pointer-events: auto;

            .dev-drawer {
                transform: translateX(0);
                box-shadow: 15px 0 40px rgba(0, 0, 0, 0.6); /* Soft Depth */
            }

            .dev-button {
                left: 420px;
                background: var(--hud-bg);
                color: var(--hud-text);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); /* Soft Depth */
            }
        }
    }

    .dev-button {
        position: absolute;
        bottom: 20px;
        left: 20px;
        pointer-events: auto;
        background: var(--hud-bg);
        color: var(--hud-muted);
        border: none; /* No Borders */
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); /* Soft Depth */
        border-radius: 8px; /* Softer edges */
        padding: 10px 20px;
        font-family: var(--hud-mono-font);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        backdrop-filter: blur(12px);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Snappy Curve */

        &:hover {
            color: var(--hud-text);
            background: rgba(255, 255, 255, 0.05);
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
    }

    .dev-drawer {
        position: absolute;
        top: 0;
        left: 0;
        width: 400px;
        height: 100%;
        background: var(--hud-bg);
        border: none; /* No Borders */
        box-shadow: 5px 0 20px rgba(0, 0, 0, 0.5); /* Soft Depth */
        backdrop-filter: blur(16px);
        transform: translateX(-100%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Snappy Curve */
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        font-family: var(--hud-mono-font);
        color: var(--hud-text);

        &::before {
            /* Grain Texture Overlay */
            content: "";
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.02;
            pointer-events: none;
            z-index: -1;
        }
    }

    .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: rgba(255, 255, 255, 0.02);
        box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.05); /* Very subtle separator */

        .hud-title {
            color: var(--hud-text);
            font-weight: 700;
            letter-spacing: 1px;
            font-size: 0.9rem;
        }

        .close-btn {
            background: transparent;
            border: none;
            color: var(--hud-muted);
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
                color: var(--hud-text);
            }
        }
    }

    .drawer-tabs {
        display: flex;
        box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.05);

        button {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--hud-muted);
            padding: 12px 0;
            font-family: var(--hud-mono-font);
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            cursor: pointer;
            position: relative;
            transition:
                color 0.2s,
                background 0.2s;

            .flare {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 2px;
                background: var(--hud-accent);
                transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            &:hover {
                color: var(--hud-text);
                background: rgba(255, 255, 255, 0.02);
            }

            &.active {
                color: var(--hud-accent);

                .flare {
                    width: 100%;
                }
            }
        }
    }

    .drawer-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;

        /* Custom Scrollbar */
        &::-webkit-scrollbar {
            width: 6px;
        }
        &::-webkit-scrollbar-track {
            background: transparent;
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            &:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        }
    }

    .panel-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: scanline 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    @keyframes scanline {
        0% {
            opacity: 0;
            transform: translateY(5px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .section-title {
        color: var(--hud-muted);
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-weight: 600;
    }

    .data-dump {
        background: rgba(0, 0, 0, 0.3);
        border: none;
        border-radius: 6px;
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2); /* Soft Inner Depth */
        padding: 15px;
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--hud-text);
    }

    .grid-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .grid-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 6px;
        padding: 10px 12px;

        .key {
            color: var(--hud-muted);
            font-size: 0.75rem;
            text-transform: uppercase;
        }

        .val {
            color: var(--hud-text);
            font-weight: 600;
            font-size: 0.85rem;
        }
    }
</style>
