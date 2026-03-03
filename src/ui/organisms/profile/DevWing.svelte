<script>
    let { char = $bindable(), is_editing } = $props()

    function format_timestamp(ts) {
        if (!ts) return "---"
        return new Date(ts).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const DYNAMICS_LIST = [
        { key: "entropy", label: "Entropy", desc: "Chaos vs Order" },
        { key: "velocity", label: "Velocity", desc: "Action Pacing" },
        { key: "permeability", label: "Permeability", desc: "Open vs Defense" },
        { key: "resonance", label: "Resonance", desc: "Narrative Weight" },
    ]
</script>

<div class="dev-wing-content">
    <!-- 1. Dynamics Console -->
    <div class="group dynamics-group">
        <div class="dynamics-grid">
            {#each DYNAMICS_LIST as dynamic (dynamic.key)}
                <div class="dynamic-box" class:is-editing={is_editing}>
                    <span class="dynamic-label">{dynamic.label}</span>
                    <div class="value-container">
                        {#if is_editing}
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
                <span class="val">{format_timestamp(char.created_at)}</span>
            </div>
            <div class="meta-item">
                <span class="tag">Updated</span>
                <span class="val">{format_timestamp(char.updated_at)}</span>
            </div>
        </footer>
    </div>
</div>

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    .dev-wing-content {
        background: var(--gunmetal);
        box-shadow: var(--shadow-m);
        border-radius: var(--border-radius-l);
        padding: var(--spacing-m);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        height: 100%;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: var(--spacing-xxs);
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(var(--pure-white-rgb), var(--opacity-m));
            border-radius: var(--border-radius-full);
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
            background: var(--surface-sunken);
            box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xxs));
            border-radius: var(--spacing-xs);
            padding: var(--spacing-s);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0;
            transition: all var(--transition-speed);
            min-height: var(--spacing-xxl);

            &.is-editing:hover {
                background: var(--surface-overlay);
                box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xs));
            }

            .dynamic-label {
                font-family: var(--font-header);
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: var(--letter-spacing-l);
                color: var(--app-muted);
                opacity: 0.8;
                margin-bottom: var(--spacing-xxs);
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
                    font-size: var(--font-size-m);
                    font-weight: 700;
                    text-align: center;
                    padding: 0;
                    outline: none;
                }

                .step-controls {
                    position: absolute;
                    right: var(--spacing-xxs);
                    display: flex;
                    flex-direction: column;
                    gap: 0;

                    button {
                        background: transparent;
                        border: none;
                        color: var(--app-muted);
                        font-size: var(--font-size-xxs);
                        padding: 0 var(--spacing-xxs);
                        cursor: pointer;
                        opacity: var(--opacity-s);
                        transition: all var(--transition-speed);

                        &:hover {
                            opacity: var(--opacity-full);
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
            font-size: var(--font-size-xs);
            font-weight: 800;
            color: var(--app-muted);
            text-transform: uppercase;
            cursor: pointer;
            opacity: 0.7;
            letter-spacing: var(--letter-spacing-m);
            transition: all var(--transition-speed);

            &:hover {
                opacity: 1;
                color: white;
            }
        }

        .json-wrap {
            margin-top: var(--spacing-xs);
            background: rgba(var(--pure-black-rgb), 0.4);
            box-shadow:
                inset 0 0 0 1px rgba(var(--pure-white-rgb), var(--opacity-xxs)),
                inset 0 0.125rem 0.25rem rgba(var(--pure-black-rgb), 0.5);
            border-radius: var(--spacing-xs);
            padding: var(--spacing-xs);
            max-height: 10rem;
            overflow: auto;

            pre {
                font-size: var(--font-size-xs);
                color: rgba(var(--pure-white-rgb), 0.8);
                font-family: var(--font-mono);
                margin: 0;
            }
        }
    }

    .footer-meta {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xxs);

        .meta-item {
            display: flex;
            justify-content: flex-start;
            gap: var(--spacing-xs);
            font-size: var(--font-size-xs);
            text-transform: uppercase;
            letter-spacing: var(--letter-spacing-s);

            .tag {
                color: var(--app-muted);
                opacity: 0.7;
                font-weight: 900;
            }

            .val {
                color: rgba(var(--pure-white-rgb), 0.9);
            }
        }
    }
</style>
