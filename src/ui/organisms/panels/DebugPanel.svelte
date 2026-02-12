<script>
    import { app } from "@state/app.svelte.js"

    // Auto-scroll logic for log feed
    let logEnd = $state(null)

    $effect(() => {
        if (app.logs.length && logEnd) {
            logEnd.scrollIntoView({ behavior: "smooth" })
        }
    })

    const getLogClass = (type) => {
        switch (type) {
            case "system":
                return "log-system"
            case "ai":
                return "log-ai"
            case "error":
                return "log-error"
            case "fractal":
                return "log-fractal"
            case "db":
                return "log-db"
            default:
                return "log-default"
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
            <div class="log-entry {getLogClass(entry.type)}">
                <span class="timestamp">[{entry.timestamp}]</span>
                <span class="type">{entry.type.toUpperCase()}</span>
                <span class="message">{entry.message}</span>
            </div>
        {/each}
        <div bind:this={logEnd}></div>
    </div>

    <footer class="debug-footer">
        MODE: {app.settings.devMode ? "DevMode" : "STANDARD"}
    </footer>
</div>

<style lang="scss">
    .debug-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: rgba(10, 10, 15, 0.95);
        color: var(--app-muted);
        font-family: var(--font-mono);
        font-size: 10px;
        box-shadow: 1px 0 0 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
    }

    .debug-header {
        padding: 12px 10px;
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.1);

        .debug-title {
            font-weight: 800;
            color: white;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
            font-family: var(--font-mono);
        }

        .debug-stats {
            display: flex;
            gap: 15px;
            font-weight: 600;
            color: var(--app-accent);
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
            border-left: 0.125rem solid;
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
                color: var(--app-color);
            }

            /* Log Variants */
            &.log-system {
                border-left-color: var(--app-accent); /* Blue */
                .type {
                    color: var(--app-accent);
                }
            }
            &.log-ai {
                border-left-color: var(--color-ai); /* Purple */
                .type {
                    color: var(--color-ai);
                }
            }
            &.log-error {
                border-left-color: var(--app-del); /* Red */
                .type {
                    color: var(--app-del);
                }
            }
            &.log-fractal {
                border-left-color: var(--color-fractal); /* Green */
                .type {
                    color: var(--color-fractal);
                }
            }
            &.log-db {
                border-left-color: var(--color-db); /* Yellow */
                .type {
                    color: var(--color-db);
                }
            }
            &.log-default {
                border-left-color: var(--app-muted);
                .type {
                    color: var(--app-muted);
                }
            }
        }
    }

    .debug-footer {
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.4);
        font-size: 9px;
        box-shadow: 0 -1px 0 0 rgba(255, 255, 255, 0.05);
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
