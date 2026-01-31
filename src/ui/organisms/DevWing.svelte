<script>
    import Button from "@ui/atoms/Button.svelte"
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
            {#each dynamicsList as trait (trait.key)}
                <div class="dynamic-box" class:is-editing={isEditing}>
                    <span class="trait-label">{trait.label}</span>
                    <div class="value-container">
                        {#if isEditing}
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
                        {:else}
                            <span class="value"
                                >{char.dynamics[trait.key]}%</span
                            >
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- 2. Plot Tracker -->
    <div class="group plot-group">
        <div class="prompt-box plot-explorer">
            {#if isEditing}
                <div class="add-thread-row">
                    <textarea
                        use:autoResize
                        placeholder="New plot thread..."
                        class="new-plot-input"
                        bind:value={newPlotThread}
                        onkeydown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                addPlot()
                            }
                        }}
                    ></textarea>
                    <Button
                        variant="primary"
                        size="sm"
                        label="Add"
                        className="add-btn"
                        onclick={addPlot}
                        disabled={!newPlotThread.trim()}
                    />
                </div>
            {/if}

            <div
                class="plot-list"
                class:has-items={activePlot.length > 0 ||
                    resolvedPlot.length > 0}
            >
                {#each activePlot as point, i (point)}
                    <div class="plot-item active">
                        <span class="text">{point}</span>
                        {#if isEditing}
                            <div class="actions">
                                <button
                                    class="action-btn resolve"
                                    onclick={() => resolvePlot(i)}
                                    title="Resolve"
                                >
                                    ✓
                                </button>
                                <button
                                    class="action-btn remove"
                                    onclick={() => removePlot("active", i)}
                                    title="Delete"
                                >
                                    ×
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}

                {#each resolvedPlot as point, i (point)}
                    <div class="plot-item resolved">
                        <span class="text">{point}</span>
                        {#if isEditing}
                            <div class="actions">
                                <button
                                    class="action-btn remove"
                                    onclick={() => removePlot("resolved", i)}
                                    title="Delete"
                                >
                                    ×
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}

                {#if activePlot.length === 0 && resolvedPlot.length === 0}
                    <div class="empty-state">No active narrative threads</div>
                {/if}
            </div>
        </div>
    </div>

    <!-- 3. Simulation Context -->
    {#if char.type === "fractal"}
        <div class="group simulation-group">
            <div class="toggle-stack">
                <label class="toggle-control">
                    <span class="label">Recursive Engine</span>
                    <div class="input-wrapper">
                        <input
                            type="checkbox"
                            checked={char.simulation?.mode === "ACTIVE"}
                            onchange={(e) => {
                                if (!char.simulation) char.simulation = {}
                                const target = e.target
                                if (target instanceof HTMLInputElement) {
                                    char.simulation.mode = target.checked
                                        ? "ACTIVE"
                                        : "PASSIVE"
                                }
                            }}
                            disabled={!isEditing}
                        />
                        <div class="switch"></div>
                    </div>
                </label>
            </div>
        </div>
    {/if}

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
        background-image: radial-gradient(
            circle at bottom left,
            rgba(255, 255, 255, 0.05) 10%,
            transparent 70%
        );
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
            border: 1px solid var(--glass-border);
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

            .trait-label {
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
                position: relative;
                width: 100%;

                .value {
                    font-family: var(--font-mono);
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--app-accent);
                    opacity: 0.8;
                }

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

                    .step-btn {
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

    /* 2. Plot Explorer */
    .plot-explorer {
        border: 1px transparent;
        border-radius: var(--border-radius);
        overflow: hidden;
        gap: 4px;
        flex-direction: column;

        .add-thread-row {
            display: flex;
            border: 1px transparent;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--border-radius);
            overflow: hidden;

            textarea {
                flex: 1;
                background: transparent;
                border: none;
                padding: var(--spacing-s);
                color: white;
                font-size: 0.85rem; /* Matched VisualWing */
                outline: none;
                resize: none;
                min-height: 40px;
                font-family: var(--font-body); /* Enforce consistent font */
                line-height: 1.5;
                font-weight: 500;
                width: 70%;

                &::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 0.85rem;
                    font-style: italic;
                    font-weight: 400;
                }
            }

            :global(.btn) {
                width: auto;
                border: 1px transparent;
                border-radius: 0;
                background: rgba(255, 255, 255, 0.03);
                font-size: 0.6rem;
                font-weight: 800;
                text-transform: uppercase;
                min-width: 70px;
                color: var(--app-muted);
                transition: all 0.3s ease;
                padding: 0 1.2rem;

                &:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                &:global(.active-action) {
                    background: color-mix(
                        in oklab,
                        var(--app-accent) 15%,
                        transparent
                    );
                    color: var(--app-accent);

                    &:hover:not(:disabled) {
                        background: color-mix(
                            in oklab,
                            var(--app-accent) 25%,
                            transparent
                        );
                        color: white;
                    }
                }

                &:disabled {
                    cursor: not-allowed;
                }
            }
        }

        .plot-list {
            display: flex;
            flex-direction: column;
            max-height: 250px;
            overflow-y: auto;
            gap: 4px;

            &.has-items {
                padding: 4px 0;
            }

            .plot-item {
                display: flex;
                align-items: center; /* Center align items */
                gap: var(--spacing-s);
                padding: 10px var(--spacing-m);
                padding-right: 36px;
                margin-bottom: 2px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px transparent;
                border-radius: var(--border-radius);
                transition: all 0.2s ease;
                position: relative;

                &:hover {
                    border: 1px transparent;
                }

                .text {
                    flex: 1;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.4;
                    font-weight: 500;
                }

                &.resolved {
                    opacity: 0.5;
                    background: rgba(255, 255, 255, 0.03);
                    border-color: transparent;

                    .text {
                        text-decoration: line-through;
                        color: var(--app-muted);
                    }
                }

                .actions {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    flex-direction: column; /* Stack icons vertically */
                    gap: 4px;

                    .action-btn {
                        background: transparent;
                        border: none;
                        color: var(--app-muted);
                        cursor: pointer;
                        font-size: 0.7rem;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0.6;
                        transition: all 0.2s;
                        border-radius: 4px;

                        &:hover {
                            opacity: 1;
                            background: rgba(255, 255, 255, 0.1);
                        }
                        &.resolve:hover {
                            color: var(--app-success);
                            background: transparent;
                        }
                        &.remove:hover {
                            color: var(--app-del); /* Red X */
                            background: transparent;
                        }
                    }
                }
            }

            .empty-state {
                padding: var(--spacing-l);
                text-align: center;
                font-size: 0.65rem;
                text-transform: uppercase;
                color: var(--app-muted);
                opacity: 0.4;
                font-style: italic;
            }
        }
    }

    /* 3. Simulation */
    .toggle-stack {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);

        .toggle-control {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: pointer;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            padding: 4px 0;

            .switch {
                position: relative;
                width: 32px;
                height: 16px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                transition: all 0.3s;

                &::after {
                    content: "";
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    top: 2px;
                    left: 2px;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            }

            input {
                display: none;
                &:checked + .switch {
                    background: var(--app-accent);
                    &::after {
                        left: 18px;
                    }
                }
            }

            &:hover .switch {
                background: rgba(255, 255, 255, 0.2);
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
            border: 1px solid var(--glass-border);
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
