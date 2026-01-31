<script>
    import { app } from "@state/app.svelte.js"

    // Auto-scroll logic for log feed
    let logEnd = $state(null)

    $effect(() => {
        if (app.logs.length && logEnd) {
            logEnd.scrollIntoView({ behavior: "smooth" })
        }
    })

    const getLogColor = (type) => {
        switch (type) {
            case "system":
                return "#38bdf8" // system (blue)
            case "ai":
                return "#a855f7" // ai (purple)
            case "error":
                return "#ef4444" // error (red)
            case "world":
                return "#22c55e" // world (green)
            case "db":
                return "#eab308" // fallback db (yellow)
            default:
                return "#94a3b8" // default (slate)
        }
    }
</script>

<div class="debug-panel">
    <header class="debug-header">
        <div class="debug-title">DIAGNOSTIC TELEMETRY HUD</div>
        <div class="debug-stats">
            <span>TURN: {app.simulation.turn}</span>
            <span>READY: {app.canStart ? "YES" : "NO"}</span>
        </div>
    </header>

    <div class="log-feed">
        {#each [...app.logs].reverse() as entry (entry.id)}
            <div
                class="log-entry"
                style:border-left-color={getLogColor(entry.type)}
            >
                <span class="timestamp">[{entry.timestamp}]</span>
                <span class="type" style:color={getLogColor(entry.type)}
                    >{entry.type.toUpperCase()}</span
                >
                <span class="message">{entry.message}</span>
            </div>
        {/each}
        <div bind:this={logEnd}></div>
    </div>

    <footer class="debug-footer">
        MODE: {app.settings.devMode ? "DEV_BYPASS_ACTIVE" : "STANDARD"}
    </footer>
</div>

<style lang="scss">
    .debug-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: rgba(10, 10, 15, 0.95);
        color: #94a3b8;
        font-family: var(--font-mono);
        font-size: 10px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
    }

    .debug-header {
        padding: 12px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        .debug-title {
            font-weight: 800;
            color: #fff;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
            font-family: var(--font-mono);
        }

        .debug-stats {
            display: flex;
            gap: 15px;
            font-weight: 600;
            color: #38bdf8;
        }
    }

    .log-feed {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &::-webkit-scrollbar {
            width: 3px;
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
        }

        .log-entry {
            border-left: 2px solid;
            padding-left: 6px;
            line-height: 1.2;
            animation: fadeIn 0.2s ease-out;

            .timestamp {
                color: rgba(255, 255, 255, 0.3);
                margin-right: 5px;
            }
            .type {
                font-weight: 900;
                margin-right: 5px;
            }
            .message {
                color: #e2e8f0;
            }
        }
    }

    .debug-footer {
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.4);
        font-size: 9px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(-5px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
