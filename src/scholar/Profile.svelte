<script>
    import Modal from '../artificer/Modal.svelte';
    import { app } from '../artificer/stores/app.svelte.js';
    import { runtime } from './stores/runtime.svelte.js';

    let isEditing = $state(false); // Controls 'Edit Mode' (Unlocks fields)
    let isFlipped = $state(false); // Controls 'Flip' (Front/Back)
    // char is already a reactive proxy from the runtime store
    const char = runtime.character; 
    
    // Visual Engine Logic
    let visualPrompt = $state("");
    let hasContent = $derived(visualPrompt.trim().length > 0);
    
    // Colors for Select
    const PALETTE = {
        lime: '#84cc16',
        cyan: '#06b6d4',
        fuchsia: '#d946ef',
        yellow: '#eab308',
        zinc: '#71717a'
    };

    // --- Actions ---
    function save() {
        runtime.updateCharacter(char);
        isEditing = false;
    }

    function handleScholarHelp(field) {
        console.log(`[Scholar] Requesting assistance for field: ${field}`);
        // This triggers the AI to suggest text
    }

    // Visual Engine (Mock)
    function handleVisualAction(action) {
        console.log(`[Mesmer] Action: ${action} | Prompt: ${visualPrompt}`);
    }

    function toggleFlip() {
        isFlipped = !isFlipped;
    }
</script>

<Modal variant="entity" onclose={() => app.toggleProfile()}>
    <div class="entity-card-wrapper" class:flipped={isFlipped}
         style="--hero-color: {char.visuals.signatureColor}">
        
        <!-- FRONT FACE -->
        <div class="card-face front">
            <div class="split-layout">
                <!-- LEFT COL (30%) -->
                <div class="left-col">
                    <div class="visual-container">
                        {#if char.visuals.avatar}
                            <img src={char.visuals.avatar} alt="Hero" class:no-bg={char.visuals.noBackground} />
                        {:else}
                            <div class="placeholder-avatar">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        {/if}
                    </div>

                    <!-- VISUAL ENGINE WIDGET -->
                    <div class="visual-engine-widget">
                        <textarea 
                            bind:value={visualPrompt}
                            placeholder="Describe appearance or paste URL..."
                        ></textarea>
                        
                        <div class="ve-controls">
                            <button class="ve-btn" onclick={() => handleVisualAction('extract')}>
                                ✨ Extract
                            </button>
                            <button class="ve-btn primary" onclick={() => handleVisualAction('upload')}>
                                Upload
                            </button>
                        </div>
                        
                        <div class="ve-settings">
                            <select 
                                value={Object.entries(PALETTE).find(([k,v]) => v === char.visuals.signatureColor)?.[0] || 'custom'}
                                onchange={(e) => char.visuals.signatureColor = PALETTE[e.target.value] || e.target.value}
                            >
                                {#each Object.entries(PALETTE) as [name, val]}
                                    <option value={name}>{name}</option>
                                {/each}
                            </select>
                            
                            <label class="ve-check">
                                <input type="checkbox" bind:checked={char.visuals.noBackground} />
                                <span>No Background</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COL (70%) -->
                <div class="right-col">
                    <div class="header-row">
                        <div>
                            <input class="h1-input" bind:value={char.name} placeholder="Name" />
                            <textarea class="desc-input" bind:value={char.description} placeholder="Description"></textarea>
                        </div>
                        
                        <button class="flip-trigger" onclick={toggleFlip} title="Director Details">
                            ↻
                        </button>
                    </div>

                    <div class="matrix-grid">
                        <div class="matrix-header"></div>
                        <div class="matrix-header">NON-PHYSICAL</div>
                        <div class="matrix-header">PHYSICAL</div>

                        <!-- Row 1: ETERNAL -->
                        <div class="row-label">ETERNAL<br><span class="sub">Immutable Traits</span></div>
                        <div class="matrix-cell">
                             <textarea bind:value={char.eternal.mental}></textarea>
                             <button class="magic-btn" onclick={() => handleScholarHelp('eternal.mental')}>✨</button>
                        </div>
                        <div class="matrix-cell">
                            <textarea bind:value={char.eternal.physical}></textarea>
                            <button class="magic-btn" onclick={() => handleScholarHelp('eternal.physical')}>✨</button>
                        </div>

                        <!-- Row 2: PRESENT -->
                        <div class="row-label">PRESENT<br><span class="sub">Current State</span></div>
                        <div class="matrix-cell">
                            <textarea bind:value={char.present.mental}></textarea>
                            <button class="magic-btn" onclick={() => handleScholarHelp('present.mental')}>✨</button>
                        </div>
                        <div class="matrix-cell">
                            <textarea bind:value={char.present.physical}></textarea>
                            <button class="magic-btn" onclick={() => handleScholarHelp('present.physical')}>✨</button>
                        </div>
                    </div>

                    <div class="timeline-stack">
                        <div class="timeline-row">
                            <div class="row-label">PAST<br><span class="sub">Memories & History</span></div>
                            <div class="matrix-cell wide">
                                <textarea bind:value={char.timeline.past}></textarea>
                            </div>
                        </div>
                        <div class="timeline-row">
                            <div class="row-label">FUTURE<br><span class="sub">Ambitions & Goals</span></div>
                            <div class="matrix-cell wide">
                                <textarea bind:value={char.timeline.future}></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="footer-row">
                        <div class="voice-widget">
                            <span class="label">VOICE</span>
                            <select class="voice-select">
                                <option>Microsoft WilliamMultilingual</option>
                            </select>
                            <button class="icon-btn">🔊</button>
                            
                            <div class="sliders">
                                <input type="range" class="mini-slider" title="Speed" />
                                <input type="range" class="mini-slider" title="Pitch" />
                            </div>
                        </div>

                        <div class="action-dock">
                            <button class="icon-btn trash" title="Delete">🗑️</button>
                            <button class="save-btn" onclick={save}>💾</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BACK FACE (Dynamics) -->
        <div class="card-face back">
            <div class="back-layout">
                <div class="back-header">
                    <h2>Dynamics & Director Controls</h2>
                    <button class="flip-trigger" onclick={toggleFlip}>↻</button>
                </div>

                <div class="dynamics-panel">
                    <h3>DYNAMICS: DEFAULT VALUE</h3>
                    <div class="dyn-grid">
                        <div class="dyn-box">
                            <label for="dyn-entropy">ENTROPY</label>
                            <input id="dyn-entropy" type="number" bind:value={char.dynamics.entropy} />
                        </div>
                        <div class="dyn-box">
                            <label for="dyn-velocity">VELOCITY</label>
                            <input id="dyn-velocity" type="number" bind:value={char.dynamics.velocity} />
                        </div>
                        <div class="dyn-box">
                            <label for="dyn-permeability">PERMEABILITY</label>
                            <input id="dyn-permeability" type="number" bind:value={char.dynamics.permeability} />
                        </div>
                        <div class="dyn-box">
                            <label for="dyn-resonance">RESONANCE</label>
                            <input id="dyn-resonance" type="number" bind:value={char.dynamics.resonance} />
                        </div>
                    </div>
                </div>

                <div class="director-panel">
                    <h3>[DEV_OPS] DIRECTOR CONTROLS: PLOT</h3>
                    
                    <div class="plot-list">
                        {#each char.plot.active as plot}
                            <div class="plot-item">
                                <span>{plot}</span>
                                <div class="plot-actions">
                                    <button>✓</button>
                                    <button>×</button>
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="add-plot">
                        <input placeholder="New plot thread..." />
                        <button class="btn-primary">Add</button>
                    </div>

                    <div class="resolved-history">
                        <h4>Resolved History</h4>
                        {#each char.plot.resolved as plot}
                             <div class="plot-item resolved">
                                <span>{plot}</span>
                                <button>×</button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</Modal>

<style lang="scss">
    $hero: var(--hero-color, #84cc16);
    $bg-dark: #09090b;
    $bg-panel: #18181b;
    $border: #27272a;
    $text-muted: #a1a1aa;

    .entity-card-wrapper {
        width: 100%; height: 100%;
        perspective: 2000px;
        position: relative;
    }

    .card-face {
        width: 100%; height: 100%;
        position: absolute;
        backface-visibility: hidden;
        transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        background: $bg-dark;
        overflow: hidden;

        &.front { transform: rotateY(0deg); }
        &.back { transform: rotateY(180deg); display: flex; flex-direction: column; padding: 2rem; }
    }

    .flipped .front { transform: rotateY(-180deg); }
    .flipped .back { transform: rotateY(0deg); }

    /* --- FRONT LAYOUT --- */
    .split-layout {
        display: flex;
        height: 100%;
    }

    /* LEFT COL */
    .left-col {
        flex: 0 0 30%;
        background: $hero;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 1rem;
    }

    .visual-container {
        position: absolute;
        inset: 0;
        display: flex; align-items: center; justify-content: center;
        z-index: 0;
        
        img { width: 100%; height: 100%; object-fit: cover; opacity: 0.9; }
        img.no-bg { object-fit: contain; }
        
        .placeholder-avatar {
            width: 120px; height: 120px;
            color: rgba(0,0,0,0.2);
        }
    }

    .visual-engine-widget {
        position: relative;
        z-index: 10;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(8px);
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.1);

        textarea {
            width: 100%; height: 60px;
            background: transparent; border: none;
            color: #d4d4d8; font-size: 0.85rem; resize: none;
            &::placeholder { color: #52525b; font-style: italic; }
            &:focus { outline: none; }
        }

        .ve-controls {
            display: flex; gap: 0.5rem; margin-top: 0.5rem;
            
            .ve-btn {
                flex: 1; padding: 0.4rem; border-radius: 6px; border: none; cursor: pointer;
                background: #27272a; color: #fff; font-size: 0.75rem; font-weight: 600;
                display: flex; align-items: center; justify-content: center; gap: 4px;
                &:hover { background: #3f3f46; }
                &.primary { background: #000; color: white; border: 1px solid #333; }
            }
        }

        .ve-settings {
            display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;
            
            select { background: #27272a; color: #fff; border: none; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; }
            
            .ve-check {
                display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #a1a1aa; cursor: pointer;
                input { accent-color: $hero; }
            }
        }
    }

    /* RIGHT COL */
    .right-col {
        flex: 1;
        display: flex; flex-direction: column;
        padding: 2rem 2.5rem;
        overflow-y: auto;
    }

    .header-row {
        display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;
        
        .h1-input {
            font-size: 2.5rem; font-weight: 900; color: $hero; background: transparent; border: none; width: 100%; letter-spacing: -1px;
            &::placeholder { color: #333; }
            &:focus { outline: none; }
        }
        .desc-input {
            width: 100%; background: transparent; border: none; color: $text-muted; font-size: 1rem; resize: none; margin-top: 0.5rem;
            &:focus { outline: none; color: #fff; }
        }
    }

    .flip-trigger {
        background: none; border: none; color: #52525b; font-size: 1.5rem; cursor: pointer; transition: transform 0.3s;
        &:hover { color: #fff; transform: rotate(180deg); }
    }

    /* GRID MATRIX */
    .matrix-grid {
        display: grid;
        grid-template-columns: 80px 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
        align-items: stretch;
    }

    .matrix-header {
        font-size: 0.7rem; font-weight: 700; color: #52525b; text-transform: uppercase; letter-spacing: 1px; text-align: left;
        padding-bottom: 0.5rem;
    }

    .row-label {
        font-size: 0.8rem; font-weight: 800; color: #3b82f6; /* Blue for temporal labels */
        text-align: right; padding-right: 1rem; padding-top: 1rem; line-height: 1.2;
        .sub { font-size: 0.6rem; color: #52525b; font-weight: 400; text-transform: capitalize; }
    }

    .matrix-cell {
        background: $bg-panel;
        border-radius: 8px;
        padding: 1rem;
        position: relative;
        min-height: 100px;
        transition: box-shadow 0.2s;
        
        &:hover, &:focus-within { box-shadow: 0 0 0 1px #3f3f46; }

        textarea {
            width: 100%; height: 100%; background: transparent; border: none; color: #e4e4e7; font-size: 0.9rem; resize: none; line-height: 1.5;
            &:focus { outline: none; }
        }

        .magic-btn {
            position: absolute; bottom: 0.5rem; right: 0.5rem;
            background: none; border: none; font-size: 1rem; cursor: pointer; opacity: 0; transition: opacity 0.2s;
        }
        &:hover .magic-btn { opacity: 0.5; &:hover { opacity: 1; }}
        
        &.wide { min-height: 80px; }
    }

    .timeline-stack {
        display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;
    }
    .timeline-row {
        display: grid; grid-template-columns: 80px 1fr; gap: 1rem;
    }

    /* FOOTER */
    .footer-row {
        margin-top: auto;
        display: flex; justify-content: space-between; align-items: flex-end;
        border-top: 1px solid #27272a;
        padding-top: 1.5rem;
    }

    .voice-widget {
        display: flex; align-items: center; gap: 1rem;
        .label { font-size: 0.7rem; font-weight: 800; color: #3b82f6; letter-spacing: 1px; }
        
        .voice-select { background: $bg-panel; border: 1px solid #3f3f46; color: #d4d4d8; padding: 0.4rem; border-radius: 4px; font-size: 0.8rem; width: 200px; }
        .icon-btn { background: #3b82f6; border: none; color: white; width: 32px; height: 32px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        .sliders {
            display: flex; gap: 0.5rem;
            .mini-slider { width: 60px; accent-color: #52525b; }
        }
    }

    .action-dock {
        display: flex; gap: 0.5rem;
        .trash { background: none; font-size: 1.2rem; opacity: 0.5; &:hover { opacity: 1; color: #ef4444; } }
        .save-btn {
            background: #0ea5e9; color: white; border: none; width: 60px; height: 40px; border-radius: 6px; font-size: 1.2rem; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            &:hover { background: #0284c7; }
        }
    }

    /* BACK FACE STYLES */
    .back-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .dynamics-panel { 
        background: $bg-panel; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #3f3f46;
        h3 { color: #0ea5e9; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1rem; }
    }
    .dyn-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        .dyn-box {
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            label { font-size: 0.6rem; color: #71717a; }
            input { width: 100%; background: #000; border: 1px solid #333; color: white; text-align: center; padding: 0.5rem; border-radius: 6px; font-size: 1.2rem; font-weight: bold; }
        }
    }

    .director-panel {
         h3 { color: #d4d4d8; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1rem; font-weight: bold; }
    }
    .plot-item {
        background: #27272a; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 4px; display: flex; justify-content: space-between;
        &.resolved { text-decoration: line-through; opacity: 0.5; }
    }
    .add-plot { display: flex; gap: 0.5rem; margin-top: 1rem; }

</style>
