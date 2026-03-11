<script>
    let {
        appState = {
            lastCompiledPrompt: '{\n  "SYSTEM": "INIT_OVERRIDE",\n  "STATUS": "AWAITING_INPUT",\n  "PAYLOAD": "[NULL]"\n}',
            environment: {
                turnNumber: 42,
                time: "23:04",
                location: "Neon District",
                weather: "Acid Rain",
                chaos_seed: "0xDEADBEEF",
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

<style>
    .dev-hud-wrapper {
        /* HUD Tokens (Scoped to Debug) */
        --hud-bg: rgb(var(--pure-black-rgb) / 0.85);
        --hud-text: var(--font-color);
        --hud-muted: var(--font-muted);
        --hud-accent: var(--app-accent);
        --hud-mono-font: var(--font-mono);

        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 99999;
        pointer-events: none;
    }

    .dev-hud-wrapper.open {
        pointer-events: auto;
    }

    .dev-hud-wrapper.open .dev-drawer {
        transform: translateX(0);
        box-shadow: var(--shadow-xl); /* Soft Depth */
    }

    .dev-hud-wrapper.open .dev-button {
        left: 26.25rem;
        background: var(--hud-bg);
        color: var(--hud-text);
        box-shadow: var(--shadow-m); /* Soft Depth */
    }

    .dev-button {
        position: absolute;
        bottom: var(--spacing-l);
        left: var(--spacing-l);
        pointer-events: auto;
        background: var(--hud-bg);
        color: var(--hud-muted);
        border: none; /* No Borders */
        box-shadow: var(--shadow-s); /* Soft Depth */
        border-radius: var(--border-radius); /* Softer edges */
        padding: var(--spacing-s) var(--spacing-l);
        font-family: var(--hud-mono-font);
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-m);
        cursor: pointer;
        backdrop-filter: blur(var(--blur-m));
        transition: all var(--transition-speed) var(--curve-snappy); /* Snappy Curve */
    }

    .dev-button:hover {
        color: var(--hud-text);
        background: rgb(var(--pure-white-rgb) / var(--opacity-s));
        transform: scale(1.02);
        box-shadow: var(--shadow-m);
    }

    .dev-drawer {
        position: absolute;
        top: 0;
        left: 0;
        width: 25rem;
        height: 100%;
        background: var(--hud-bg);
        border: none; /* No Borders */
        box-shadow: var(--shadow-l); /* Soft Depth */
        backdrop-filter: blur(var(--blur-l));
        transform: translateX(-100%);
        transition: transform var(--transition-speed-slow) var(--curve-snappy); /* Snappy Curve */
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        font-family: var(--hud-mono-font);
        color: var(--hud-text);
    }

    .dev-drawer::before {
        /* Grain Texture Overlay */
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.02;
        pointer-events: none;
        z-index: -1;
    }

    .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-m) var(--spacing-l);
        background: rgb(var(--pure-white-rgb) / var(--opacity-xs));
        box-shadow: 0 var(--spacing-px) 0 0 rgb(var(--pure-white-rgb) / var(--opacity-s)); /* Very subtle separator */
    }

    .drawer-header .hud-title {
        color: var(--hud-text);
        font-weight: 700;
        letter-spacing: var(--letter-spacing-m);
        font-size: var(--font-size-s);
    }

    .drawer-header .close-btn {
        background: transparent;
        border: none;
        color: var(--hud-muted);
        font-size: var(--font-size-l);
        line-height: 1;
        cursor: pointer;
        transition: color 0.2s;
    }

    .drawer-header .close-btn:hover {
        color: var(--hud-text);
    }

    .drawer-tabs {
        display: flex;
        box-shadow: 0 var(--spacing-px) 0 0 rgb(var(--pure-white-rgb) / var(--opacity-s));
    }

    .drawer-tabs button {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--hud-muted);
        padding: var(--spacing-m) 0;
        font-family: var(--hud-mono-font);
        font-size: var(--font-size-xs);
        letter-spacing: var(--letter-spacing-s);
        cursor: pointer;
        position: relative;
        transition:
            color 0.2s,
            background 0.2s;
    }

    .drawer-tabs button .flare {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: var(--hud-accent);
        transition: width var(--transition-speed) var(--curve-snappy);
    }

    .drawer-tabs button:hover {
        color: var(--hud-text);
        background: rgb(var(--pure-white-rgb) / var(--opacity-xs));
    }

    .drawer-tabs button.active {
        color: var(--hud-accent);
    }

    .drawer-tabs button.active .flare {
        width: 100%;
    }

    .drawer-content {
        flex: 1;
        padding: var(--spacing-l);
        overflow-y: auto;
    }

    /* Custom Scrollbar */
    .drawer-content::-webkit-scrollbar {
        width: 6px;
    }
    .drawer-content::-webkit-scrollbar-track {
        background: transparent;
    }
    .drawer-content::-webkit-scrollbar-thumb {
        background: rgb(var(--pure-white-rgb) / var(--opacity-m));
        border-radius: 3px;
    }
    .drawer-content::-webkit-scrollbar-thumb:hover {
        background: rgb(var(--pure-white-rgb) / var(--opacity-xl));
    }

    .panel-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        animation: scanline 0.3s var(--curve-snappy) forwards;
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
        font-size: var(--font-size-xs);
        letter-spacing: var(--letter-spacing-m);
        text-transform: uppercase;
        font-weight: 600;
    }

    .data-dump {
        background: rgb(var(--pure-black-rgb) / var(--opacity-xxl));
        border: none;
        border-radius: var(--border-radius-sm);
        box-shadow: inset 0 var(--spacing-xxs) var(--spacing-l) rgb(var(--pure-black-rgb) / var(--opacity-l)); /* Soft Inner Depth */
        padding: var(--spacing-m);
        margin: 0;
        font-size: var(--font-size-s);
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--hud-text);
    }

    .grid-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .grid-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgb(var(--pure-white-rgb) / var(--opacity-xs));
        border-radius: 6px;
        padding: var(--spacing-s) var(--spacing-m);
    }

    .grid-row .key {
        color: var(--hud-muted);
        font-size: var(--font-size-xs);
        text-transform: uppercase;
    }

    .grid-row .val {
        color: var(--hud-text);
        font-weight: 600;
        font-size: var(--font-size-base);
    }
</style>
