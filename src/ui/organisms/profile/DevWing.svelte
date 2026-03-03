<script>
    let { char = $bindable(), isEditing } = $props()

    function formatTimestamp(ts) {
        if (!ts) return "---"
        return new Date(ts).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const dynamicsList = [
        { key: "entropy", label: "Entropy", desc: "Chaos vs Order" },
        { key: "velocity", label: "Velocity", desc: "Action Pacing" },
        { key: "permeability", label: "Permeability", desc: "Open vs Defense" },
        { key: "resonance", label: "Resonance", desc: "Narrative Weight" },
    ]

    function autoResize(node) {
        let frame
        const update = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                node.style.height = "auto"
                node.style.height = node.scrollHeight + "px"
            })
        }
        node.addEventListener("input", update)
        const observer = new ResizeObserver(update)
        observer.observe(node)
        update()
        return {
            destroy() {
                if (frame) cancelAnimationFrame(frame)
                node.removeEventListener("input", update)
                observer.disconnect()
            },
        }
    }
</script>

<div class="dev-wing-content">
    <!-- 1. Dynamics Console -->
    <div class="group dynamics-group">
        <div class="dynamics-grid">
            {#each dynamicsList as dynamic (dynamic.key)}
                <div class="dynamic-box" class:is-editing={isEditing}>
                    <span class="dynamic-label">{dynamic.label}</span>
                    <div class="value-container">
                        {#if isEditing}
                            <input type="number" bind:value={char.dynamics[dynamic.key]} min="0" max="100" />
                            <div class="step-controls">
                                <button onclick={() => (char.dynamics[dynamic.key] = Math.min(100, char.dynamics[dynamic.key] + 1))}>+</button>
                                <button onclick={() => (char.dynamics[dynamic.key] = Math.max(0, char.dynamics[dynamic.key] - 1))}>-</button>
                            </div>
                        {:else}
                            <span class="value-display" style="--val: {char.dynamics[dynamic.key]}%">{char.dynamics[dynamic.key]}%</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- 4. Metadata & Raw -->
    <div class="group meta-group">
        <div class="raw-explorer">
            <details>
                <summary>System Manifest</summary>
                <div class="json-wrap">
                    <pre>{JSON.stringify(char, null, 2)}</pre>
                </div>
            </details>
        </div>

        <footer class="footer-meta">
            <div class="meta-item">
                <span class="tag">Created</span>
                <span class="val">{formatTimestamp(char.createdAt)}</span>
            </div>
            <div class="meta-item">
                <span class="tag">Updated</span>
                <span class="val">{formatTimestamp(char.updatedAt)}</span>
            </div>
        </footer>
    </div>
</div>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    .dev-wing-content {
        @extend %material-glass-heavy;
        padding: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-l);
        color: white;
        border-radius: inherit;
        background: var(--chalk, #222326);
        background-image: radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.05) 10%, transparent 70%);
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;

        &::-webkit-scrollbar {
            width: 4px;
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);
    }

    /* 1. Dynamics */
    .dynamics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-s);

        .dynamic-box {
            background: rgba(255, 255, 255, 0.03);
            border: 0; /* Semi-flat */
            border-radius: var(--spacing-xs);
            padding: var(--spacing-s);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0;
            transition: all 0.2s;
            min-height: 40px;

            &.is-editing:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .dynamic-label {
                font-family: var(--font-header);
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--text-dim);
                margin-bottom: 0.25rem;
                display: block;
            }

            .value-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                width: 100%;

                input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: white;
                    font-family: var(--font-mono);
                    font-size: 1rem;
                    font-weight: 700;
                    text-align: center;
                    padding: 0;
                    outline: none;
                }

                .step-controls {
                    position: absolute;
                    right: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;

                    button {
                        background: transparent;
                        border: none;
                        color: var(--app-muted);
                        font-size: 0.4rem;
                        padding: 0 4px;
                        cursor: pointer;
                        opacity: 0.3;
                        &:hover {
                            opacity: 1;
                            color: var(--app-accent);
                        }
                    }
                }
            }
        }
    }

    /* 4. Meta & Raw */
    .raw-explorer {
        summary {
            font-size: 0.6rem;
            font-weight: 800;
            color: var(--app-muted);
            text-transform: uppercase;
            cursor: pointer;
            opacity: 0.4;
            letter-spacing: 0.05em;
            transition: all 0.2s;
            &:hover {
                opacity: 0.8;
                color: white;
            }
        }

        .json-wrap {
            margin-top: 8px;
            background: rgba(0, 0, 0, 0.3);
            border: 0; /* Semi-flat */
            border-radius: var(--spacing-xs);
            padding: var(--spacing-xs);
            max-height: 150px;
            overflow: auto;

            pre {
                font-size: 0.55rem;
                color: rgba(255, 255, 255, 0.3);
                font-family: var(--font-mono);
                margin: 0;
            }
        }
    }

    .footer-meta {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .meta-item {
            display: flex;
            justify-content: flex-start;
            gap: 8px;
            font-size: 0.55rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;

            .tag {
                color: var(--app-muted);
                opacity: 0.4;
                font-weight: 900;
            }
            .val {
                color: rgba(255, 255, 255, 0.2);
            }
        }
    }
</style>
