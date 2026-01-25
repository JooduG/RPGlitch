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

    let activePlot = $derived(char.customData?.plot?.active || [])
    let resolvedPlot = $derived(char.customData?.plot?.resolved || [])
    let newPlotThread = $state("")

    function addPlot() {
        if (!newPlotThread.trim()) return
        if (!char.customData) char.customData = {}
        if (!char.customData.plot)
            char.customData.plot = { active: [], resolved: [] }
        char.customData.plot.active = [
            ...char.customData.plot.active,
            newPlotThread.trim(),
        ]
        newPlotThread = ""
    }

    function resolvePlot(index) {
        const item = char.customData.plot.active[index]
        char.customData.plot.active = char.customData.plot.active.filter(
            (_, i) => i !== index
        )
        char.customData.plot.resolved = [
            ...(char.customData.plot.resolved || []),
            item,
        ]
    }

    function removePlot(listType, index) {
        if (listType === "active") {
            char.customData.plot.active = char.customData.plot.active.filter(
                (_, i) => i !== index
            )
        } else {
            char.customData.plot.resolved =
                char.customData.plot.resolved.filter((_, i) => i !== index)
        }
    }
</script>

<div class="dev-wing-content">
    <!-- 1. Dynamics Console -->
    <div class="section dynamics-section">
        {#if isEditing}
            <div class="dynamics-grid">
                {#each dynamicsList as trait (trait.key)}
                    <div class="dynamic-box">
                        <span class="label">{trait.label}</span>
                        <div class="value-container edit">
                            <input
                                type="number"
                                bind:value={char.dynamics[trait.key]}
                                min="0"
                                max="100"
                            />
                            <div class="step-controls">
                                <button
                                    class="step-btn"
                                    onclick={() =>
                                        (char.dynamics[trait.key] = Math.min(
                                            100,
                                            char.dynamics[trait.key] + 1
                                        ))}
                                >
                                    ▲
                                </button>
                                <button
                                    class="step-btn"
                                    onclick={() =>
                                        (char.dynamics[trait.key] = Math.max(
                                            0,
                                            char.dynamics[trait.key] - 1
                                        ))}
                                >
                                    ▼
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="dynamics-grid">
                {#each dynamicsList as trait (trait.key)}
                    <div class="dynamic-box">
                        <span class="label">{trait.label}</span>
                        <div class="value-container readonly">
                            <span class="value"
                                >{char.dynamics[trait.key]}%</span
                            >
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- 2. Plot Tracker -->
    <div class="section plot-section">
        {#if isEditing}
            <div class="plot-editor">
                <div class="add-thread">
                    <input
                        type="text"
                        placeholder="New plot..."
                        class="new-plot-input"
                        bind:value={newPlotThread}
                        onkeydown={(e) => e.key === "Enter" && addPlot()}
                    />
                    <button class="add-btn" onclick={addPlot}>Add</button>
                </div>

                {#if activePlot.length > 0 || resolvedPlot.length > 0}
                    <div class="plot-list">
                        {#each activePlot as point, i (point)}
                            <div class="plot-edit-item">
                                <span class="text">{point}</span>
                                <div class="actions">
                                    <button
                                        class="resolve-btn"
                                        onclick={() => resolvePlot(i)}
                                        title="Resolve"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        class="remove-btn"
                                        onclick={() => removePlot("active", i)}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        {/each}

                        {#each resolvedPlot as point, i (point)}
                            <div class="plot-edit-item resolved">
                                <span class="text">{point}</span>
                                <div class="actions">
                                    <button
                                        class="remove-btn"
                                        onclick={() =>
                                            removePlot("resolved", i)}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="empty-plots">No active plots</div>
                {/if}
            </div>
        {:else if activePlot.length > 0 || resolvedPlot.length > 0}
            <div class="plot-tracker-view">
                {#each activePlot as point (point)}
                    <div class="plot-view-item active">
                        <span class="text">{point}</span>
                    </div>
                {/each}
                {#each resolvedPlot as point (point)}
                    <div class="plot-view-item resolved">
                        <span class="text">{point}</span>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="empty-plots">No active plots</div>
        {/if}
    </div>

    <!-- 2. System Control (Simulation mode is already minimalist) -->
    {#if char.type === "fractal"}
        <div class="section">
            <header>
                <span class="title">Simulation</span>
            </header>
            <div class="toggle-stack">
                <label class="toggle-control">
                    <span class="label">Active Engine</span>
                    <input
                        type="checkbox"
                        checked={char.simulation?.mode === "ACTIVE"}
                        onchange={(e) => {
                            if (!char.simulation) char.simulation = {}
                            char.simulation.mode = e.target.checked
                                ? "ACTIVE"
                                : "PASSIVE"
                        }}
                        disabled={!isEditing}
                    />
                    <div class="switch"></div>
                </label>
            </div>
        </div>
    {/if}

    <!-- 3. Raw Data Explorer -->
    <div class="section raw-explorer">
        <details>
            <summary>Raw Data</summary>
            <pre>{JSON.stringify(char, null, 2)}</pre>
        </details>
    </div>

    <!-- 4. Timestamps -->
    <div class="section footer-meta">
        <div class="meta-item">
            <span class="label">Built {formatTimestamp(char.createdAt)}</span>
        </div>
        <div class="meta-item">
            <span class="label">Echoed {formatTimestamp(char.updatedAt)}</span>
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../mesmer/scss/abstracts/placeholders" as *;

    .dev-wing-content {
        @extend %material-glass-heavy;
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        color: white;
        background: radial-gradient(
            circle at top left,
            rgba(255, 255, 255, 0.04) 0%,
            transparent 70%
        );
        height: 100%;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 4px;
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
    }

    .section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 4px;

            .title {
                font-size: 0.65rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--app-muted);
                opacity: 0.5;
            }
        }
    }

    .dynamics-section {
        .dynamics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-sm);

            .dynamic-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                padding: var(--spacing-sm);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;

                .label {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    color: var(--app-muted);
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    opacity: 0.5;
                }

                .value-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);

                    .value {
                        font-family: var(--font-mono);
                        font-size: 1rem;
                        font-weight: 700;
                        color: var(--app-accent);
                        opacity: 0.5;
                        transition: opacity 0.2s;
                    }

                    &:hover .value,
                    &:focus-within .value {
                        opacity: 1;
                        color: white;
                    }

                    &.edit {
                        position: relative;
                        padding-right: 12px;

                        .step-controls {
                            position: absolute;
                            right: 0;
                            top: 52%;
                            transform: translateY(-50%);
                            display: flex;
                            flex-direction: column;
                            gap: 0;

                            .step-btn {
                                background: transparent;
                                border: none;
                                color: var(--app-muted);
                                font-size: 0.45rem;
                                line-height: 1.2;
                                padding: 1px 4px;
                                cursor: pointer;
                                opacity: 0.2;
                                transition: all 0.2s;

                                &:hover {
                                    opacity: 0.8;
                                    color: var(--app-accent);
                                }
                            }
                        }
                    }

                    &.readonly {
                        padding-right: 0;
                        .value {
                            opacity: 0.5;
                        }
                    }

                    input {
                        width: 100%;
                        background: transparent;
                        border: none;
                        color: var(--app-accent);
                        font-family: var(--font-mono);
                        font-size: 1rem;
                        font-weight: 700;
                        text-align: center;
                        padding: 0;
                        outline: none;
                        opacity: 0.6;
                        transition: opacity 0.2s;

                        &:focus {
                            opacity: 1;
                            color: white;
                        }

                        /* Hide spinners */
                        &::-webkit-outer-spin-button,
                        &::-webkit-inner-spin-button {
                            appearance: none;
                            margin: 0;
                        }
                    }
                }
            }
        }
    }

    .plot-section {
        .plot-editor {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .plot-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .add-thread {
                display: flex;
                gap: 4px;
                width: 100%;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                padding: 0;
                min-height: 42px;
                overflow: hidden;

                &:focus-within {
                    border-color: var(--app-accent);
                    background: rgba(var(--app-accent-rgb), 0.05);
                }

                input {
                    flex: 1;
                    min-width: 0;
                    background: transparent;
                    border: none;
                    padding: var(--spacing-sm) var(--spacing-md);
                    color: white;
                    font-size: 0.75rem;
                    outline: none;

                    &::placeholder {
                        color: rgba(255, 255, 255, 0.2);
                        text-transform: uppercase;
                        font-size: 0.65rem;
                        letter-spacing: 0.05em;
                        font-style: italic;
                    }
                }

                .add-btn {
                    background: rgba(255, 255, 255, 0.02);
                    color: var(--app-muted);
                    border: none;
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 0 var(--spacing-lg);
                    font-weight: 700;
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;

                    &:hover {
                        color: var(--app-accent);
                        background: rgba(var(--app-accent-rgb), 0.1);
                    }
                }
            }
        }

        .plot-edit-item,
        .plot-view-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            padding: var(--spacing-sm) var(--spacing-md);
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm);
            min-height: 42px;

            .text {
                flex: 1;
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.4;
                padding-top: 2px;
                text-align: left;
            }

            &.resolved {
                opacity: 0.4;
                .text {
                    text-decoration: line-through;
                }
            }
        }

        .plot-edit-item {
            padding-right: 32px;
            position: relative;

            .actions {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            button {
                background: transparent;
                border: none;
                cursor: pointer;
                font-size: 0.7rem;
                opacity: 0.2;
                transition: all 0.2s;
                color: white;
                width: 20px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    opacity: 1;
                }

                &.resolve-btn:hover {
                    color: #00ff00;
                    filter: drop-shadow(0 0 5px #00ff00);
                }

                &.remove-btn:hover {
                    color: #ff0000;
                    filter: drop-shadow(0 0 5px #ff0000);
                }
            }
        }

        .empty-plots {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--app-muted);
            text-align: center;
            opacity: 0.5;
            padding: var(--spacing-sm);
        }

        .plot-tracker-view {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
    }

    .raw-explorer {
        details {
            summary {
                font-size: 0.55rem;
                font-weight: 800;
                color: var(--app-muted);
                text-transform: uppercase;
                cursor: pointer;
                opacity: 0.3;
                text-align: left;
                width: 100%;
                &:hover {
                    opacity: 0.8;
                    color: white;
                }
            }

            pre {
                margin-top: 4px;
                background: rgba(0, 0, 0, 0.2);
                padding: var(--spacing-xs);
                border-radius: 4px;
                font-size: 0.55rem;
                max-height: 8rem;
                overflow: auto;
                color: rgba(255, 255, 255, 0.2);
                font-family: var(--font-mono);

                &::-webkit-scrollbar {
                    width: 2px;
                }
            }
        }
    }

    .footer-meta {
        margin-top: auto;
        opacity: 0.2;
        font-size: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
    }
</style>
