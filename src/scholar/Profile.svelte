<script>
    import Modal from '../artificer/Modal.svelte';
    import Button from '../artificer/Button.svelte';
    import { app } from '../artificer/stores/app.svelte.js';
    import { runtime } from './stores/runtime.svelte.js';
    import { VisualManager } from '../js/mesmer/ui/components/visuals/manager.js';
    import { store } from '../js/gamemaster/index.js';
    import { Scholar, entities } from '../js/scholar/index.js';
    import { CONFIG } from '../js/gamemaster/config.js';

    let isEditing = $state(false);
    let char = $state(runtime.character); 
    
    // Developer Mode determines if we show raw JSON in the right panel
    let devMode = $derived(app.settings.devMode);

    // Visual Engine Logic
    let visualPrompt = $state("");
    let visualBusy = $state(false);
    let isPromptUrl = $derived(visualPrompt.trim().match(/^https?:\/\//i));
    let hasPromptContent = $derived(visualPrompt.trim().length > 0);

    // Magic Button Logic
    let magicBusy = $state({}); 

    // Voice Logic
    let voices = $state([]);
    let selectedVoice = $derived(voices.find(v => v.voiceURI === char.voice.uri));
    let isNaturalVoice = $derived(
        selectedVoice && (
            selectedVoice.name.toLowerCase().includes("natural") || 
            selectedVoice.name.includes("Neural") // Azure usually uses "Neural" for natural voices
        )
    );
    
    $effect(() => {
        const loadVoices = () => {
             voices = window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
             window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    });

    async function save() {
        console.log("[Profile] Saving character...", char);
        runtime.updateCharacter(char);
        try {
            // Ensure type is lowercase for repository
            const type = (char.type || 'character').toLowerCase();
            await entities.upsert(type, char);
            console.log("Saved character to DB:", char.id);
            // Re-fetch to ensure sync? Not strictly needed if runtime is source of truth.
        } catch (e) {
            console.error("Failed to save character:", e);
            alert("Failed to save data. Check console.");
        }
        isEditing = false;
    }

    // --- VISUAL ENGINE HANDLERS ---

    async function handleExtract() {
        visualPrompt = VisualManager.composePrompt(char);
    }

    async function handlePaint() {
        try {
            visualBusy = true;
            const url = await VisualManager.generate(visualPrompt, {
                resolution: char.type === "fractal" ? "768x768" : "512x768",
                removeBackground: char.visuals.noBackground
            });
            if (url) {
                char.visuals.avatar = url;
            }
        } catch (e) {
            console.error("Paint failed:", e);
        } finally {
            visualBusy = false;
        }
    }

    async function handleUpload() {
        document.getElementById('profile-upload-trigger').click();
    }

    async function handleUploadUrl() {
        if (isPromptUrl) {
           char.visuals.avatar = visualPrompt.trim();
           visualPrompt = ""; 
        }
    }
    
    async function handleEnhancePrompt() {
        try {
            visualBusy = true;
            // Treat the current textarea content as the "Context" / "Action"
            // and re-compose the full prompt around it.
            const currentInput = visualPrompt;
            // Param 3 is extraContext
            visualPrompt = VisualManager.composePrompt(char, null, currentInput);
        } catch (e) {
            console.error("Enhance failed:", e);
        } finally {
            visualBusy = false;
        }
    }

    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            visualBusy = true;
            const url = await VisualManager.upload(file);
            if (url) char.visuals.avatar = url;
        } catch (err) {
            console.error(err);
        } finally {
            visualBusy = false;
        }
    }

    // --- MAGIC BUTTON HANDLERS ---

    async function consultScholar(field, contextType) {
        if (magicBusy[field]) return;
        try {
            magicBusy[field] = true;
            // Fallback for contextType if undefined
            await Scholar.consult(field, contextType || 'character'); 
        } catch (e) {
            console.error(`Magic failed for ${field}:`, e);
        } finally {
            magicBusy[field] = false;
        }
    }
    
    function getScholarId(key) {
        return `input-${key.replace(/\./g, '-')}`;
    }
    
    function getMagicBtnId(key) {
        return `btn-magic-${key.replace(/\./g, '-')}`;
    }

    // --- COLOR PICKER HELPER ---
    function setSignatureColor(hex) {
        char.visuals.signatureColor = hex;
    }

</script>

<Modal variant="canvas" onclose={() => app.toggleProfile()}>
    <!-- Apply the signature color to the workbench so children can inherit it -->
    <div class="workbench" style="--hero-color: {char.visuals.signatureColor}">
        
        <!-- LEFT SATELLITE: Creative Tools (Now Split) -->
        <div class="satellite left" class:visible={isEditing}>
            
            <!-- VISUAL BOX -->
            <div class="panel-box top">
                <div class="panel-header">Visual Cortex</div>
                
                <div class="panel-section">
                    <div class="label">Manifestation Engine</div>
                    <div class="visual-engine">
                         <textarea 
                            bind:value={visualPrompt} 
                            readonly={visualBusy}
                            placeholder="Describe appearance..."
                            rows="4"
                        ></textarea>
                         <div class="controls-grid">
                            {#if !hasPromptContent}
                                <button onclick={handleExtract} disabled={visualBusy} title="Extract description from profile">🔮 Extract</button>
                                <button onclick={handleUpload} disabled={visualBusy} title="Upload Reference">📂 Upload</button>
                            {:else if isPromptUrl}
                                <button onclick={handleUploadUrl} disabled={visualBusy}>🔗 Use URL</button>
                                <button class="ghost" onclick={() => visualPrompt = ""} disabled={visualBusy}>❌ Clear</button>
                            {:else}
                                 <button onclick={handleEnhancePrompt} disabled={visualBusy} title="Enhance prompt with AI">✨ Enhance</button>
                                 <button class="primary" onclick={handlePaint} disabled={visualBusy} title="Generate Image">
                                    {visualBusy ? '🎨 Painting...' : '🎨 Paint'}
                                 </button>
                            {/if}
                            <input type="file" id="profile-upload-trigger" hidden onchange={handleFileChange} accept="image/*" />
                         </div>
                    </div>
                </div>

                <div class="panel-section">
                    <div class="label">Rendering Parameters</div>
                    <div class="field-stack">
                         <div class="form-row">
                              <label class="checkbox-label">
                                 <input type="checkbox" bind:checked={char.visuals.noBackground} />
                                 No BG
                              </label>
                              <label class="checkbox-label">
                                  <input type="checkbox" bind:checked={char.visuals.flipped} />
                                  Flip
                               </label>
                         </div>
                         
                         <div class="range-row">
                             <label>Signature Color</label>
                             <div class="color-grid">
                                {#each Object.entries(CONFIG.PALETTE) as [name, hex]}
                                    <button 
                                        class="color-swatch" 
                                        style="background: {hex}" 
                                        class:active={char.visuals.signatureColor === hex}
                                        onclick={() => setSignatureColor(hex)}
                                        title={name}
                                    ></button>
                                {/each}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- AUDIO BOX -->
            <div class="panel-box bottom">
                <div class="panel-header">Audio Synthesis</div>
                <div class="panel-section">
                     <div class="label">Vocal Model</div>
                     <div class="field-stack">
                        <div>
                            <select id="voice-select" bind:value={char.voice.uri}>
                                <option value="">System Default</option>
                                {#each voices as voice}
                                    <option value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                                {/each}
                            </select>
                        </div>
                        <div class="range-row">
                            <label>Rate: {Number(char.voice.rate).toFixed(1)}x</label>
                            <input type="range" min="0.5" max="2" step="0.1" bind:value={char.voice.rate} />
                        </div>
                        <div class="range-row" class:disabled={isNaturalVoice}>
                            <label>Pitch: {Number(char.voice.pitch).toFixed(1)} {isNaturalVoice ? '🔒' : ''}</label>
                            <input type="range" min="0.5" max="2" step="0.1" bind:value={char.voice.pitch} disabled={isNaturalVoice} />
                        </div>
                     </div>
                </div>
            </div>
        </div>

        <!-- CENTER: The Entity Card (WYSIWYG) -->
        <div class="entity-card">
            <div class="hero-layout">
                
                <!-- VISUALS (Image Only) -->
                <div class="hero-visuals">
                    <div class="image-layer">
                        {#if char.visuals.avatar}
                            <img src={char.visuals.avatar} alt="Hero" class:no-bg={char.visuals.noBackground} class:flipped={char.visuals.flipped} />
                        {:else}
                            <div class="placeholder" style="color: var(--hero-color)">MAX</div>
                        {/if}
                    </div>
                </div>

                <!-- DATA BOARD -->
                <div class="hero-data">
                    <div class="header">
                        <input 
                            class="name-input" 
                            bind:value={char.name} 
                            readonly={!isEditing} 
                            placeholder="Name" 
                            style="color: var(--hero-color)" 
                        />
                        <div class="actions">
                            {#if isEditing}
                                <Button label="Save" variant="primary" onclick={save} />
                                <Button label="Cancel" variant="ghost" onclick={() => {
                                     char = runtime.character; 
                                     isEditing = false; 
                                }} />
                            {:else}
                                <Button label="Edit" variant="secondary" onclick={() => isEditing = true} />
                            {/if}
                        </div>
                    </div>

                    <div class="scroll-content">
                        <!-- Subtitle -->
                        <div class="field description-field">
                            <textarea 
                                class="clean-area subtitle" 
                                bind:value={char.description} 
                                readonly={!isEditing}
                                placeholder="Character Description"
                            ></textarea>
                        </div>

                         <!-- Grid Matrix -->
                        <div class="matrix-grid">
                            <!-- HEADER ROW -->
                            <div class="grid-header left">NON-PHYSICAL</div>
                            <div class="grid-header right">PHYSICAL</div>

                            <!-- ETERNAL ROW -->
                            <div class="label-col">
                                <div class="main-label">FOREVER</div>
                                <div class="sub-label">Immutable Traits</div>
                            </div>
                            <div>
                                 {@render magicField(null, char.eternal, "mental", "eternal.mental", 4)}
                            </div>
                            <div>
                                {@render magicField(null, char.eternal, "physical", "eternal.physical", 4)}
                            </div>

                            <!-- PRESENT ROW -->
                            <div class="label-col">
                                <div class="main-label">PRESENT</div>
                                <div class="sub-label">Current State</div>
                            </div>
                            <div>
                                 {@render magicField(null, char.present, "mental", "present.mental", 4)}
                            </div>
                            <div>
                                {@render magicField(null, char.present, "physical", "present.physical", 4)}
                            </div>

                             <!-- PAST ROW -->
                            <div class="label-col">
                                <div class="main-label">PAST</div>
                                <div class="sub-label">Memories & History</div>
                            </div>
                            <div class="span-2">
                                {@render magicField(null, char, "past", "past", 4)}
                            </div>

                            <!-- FUTURE ROW -->
                            <div class="label-col">
                                <div class="main-label">FUTURE</div>
                                <div class="sub-label">Ambitions & Goals</div>
                            </div>
                            <div class="span-2">
                                 {@render magicField(null, char, "future", "future", 4)}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT SATELLITE: Dev Tools -->
        <div class="satellite right panel-box" class:visible={devMode}>
            <div class="panel-header">Diagnostics</div>
            
            <div class="panel-section">
                <div class="label">Entropy Dynamics</div>
                <div class="dynamics-grid">
                    {#each Object.entries(char.dynamics || {}) as [k, v]}
                         <div class="dynamic-item">
                            <span class="label">{k}</span>
                            <div class="bar-bg"><div class="bar-fill" style="width: {v}%; background: var(--hero-color);"></div></div>
                         </div>
                    {/each}
                </div>
            </div>

            <div class="panel-section">
                <div class="label">System Identity</div>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="key">Type</span>
                        <span class="value">{char.type || 'Unknown'}</span>
                    </div>
                     <div class="info-row">
                        <span class="key">ID</span>
                        <span class="value mono">{char.id || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="label">Render State</div>
                <div class="info-grid">
                     <div class="info-row clickable" onclick={() => char.visuals.noBackground = !char.visuals.noBackground}>
                        <span class="key">No Background</span>
                        <span class="value flag" class:on={char.visuals.noBackground}>{char.visuals.noBackground ? 'ON' : 'OFF'}</span>
                    </div>
                    <div class="info-row clickable" onclick={() => char.visuals.flipped = !char.visuals.flipped}>
                        <span class="key">Flipped</span>
                        <span class="value flag" class:on={char.visuals.flipped}>{char.visuals.flipped ? 'ON' : 'OFF'}</span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</Modal>

{#snippet magicField(label, parent, key, fieldKey, rows = 3)}
    <div class="field-wrapper">
        {#if label}<label for={getScholarId(fieldKey)}>{label}</label>{/if}
        <div class="magic-wrapper">
            <textarea 
                id={getScholarId(fieldKey)}
                class="clean-box" 
                bind:value={parent[key]} 
                readonly={!isEditing || magicBusy[fieldKey]} 
                {rows}
            ></textarea>
            {#if isEditing}
                <button 
                    id={getMagicBtnId(fieldKey)}
                    class="magic-btn" 
                    onclick={() => consultScholar(fieldKey, char.type)}
                    disabled={magicBusy[fieldKey]}
                    title="Consult Scholar"
                >
                    {magicBusy[fieldKey] ? '⏳' : '✨'}
                </button>
            {/if}
        </div>
    </div>
{/snippet}


<style lang="scss">
    /* WORKBENCH LAYOUT */
    .workbench {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        perspective: 1000px;
        /* Define hero-color here to let children inherit it */
        /* Default fallback */
        --hero-color: #84cc16; 
    }

    /* CARD STRUCTURE */
    .entity-card {
        width: 850px;
        height: 650px;
        background: #09090b;
        border: 1px solid #27272a;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex; flex-direction: column;
        z-index: 10;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        flex-shrink: 0; 
    }

    /* SATELLITE CONTAINER */
    .satellite {
        display: flex; flex-direction: column;
        gap: 1.5rem; /* Gap between stacked boxes */
        
        /* Spawning Animation Vars */
        width: 0; padding: 0; opacity: 0; margin: 0;
        transform: rotateY(15deg) scale(0.9);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        
        &.visible { 
            width: 320px; 
            opacity: 1; 
            margin: 0 1.5rem; 
            transform: rotateY(0) scale(1);
        }
        
        &.left { order: -1; transform-origin: right center; justify-content: center; }
        &.right { order: 1; transform-origin: left center; justify-content: center; }
    }

    /* PANEL BOX: The actual visual container (glassy/border) */
    .panel-box {
        background: #09090b;
        border: 1px solid #27272a;
        border-radius: 12px;
        padding: 1.5rem;
        overflow-y: auto;
        box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
        
        &.top { flex: 1.2; } /* Visual prompts need more space */
        &.bottom { flex: 0.8; }
    }

    .panel-header { white-space: nowrap; font-family: serif; font-style: italic; font-size: 1.5rem; color: #e4e4e7; margin-bottom: 1.5rem; border-bottom: 1px solid #27272a; padding-bottom: 0.5rem; text-align: center; }
    .panel-section { margin-bottom: 1.5rem; &:last-child { margin-bottom: 0; } }
    .label { font-size: 0.7rem; text-transform: uppercase; color: #71717a; margin-bottom: 0.5rem; font-weight: bold; letter-spacing: 1px; }

    /* HERO LAYOUT INTERNAL */
    .hero-layout { display: grid; grid-template-columns: 35% 65%; height: 100%; }
    
    .hero-visuals {
        background: #000; position: relative; overflow: hidden;
        .image-layer { 
            width: 100%; height: 100%; 
            img { width: 100%; height: 100%; object-fit: cover; &.no-bg { object-fit: contain; } &.flipped { transform: scaleX(-1); } }
            .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: #333; }
        }
    }
    
    .hero-data { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    
    .header {
        padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;
        /* No border bottom, cleaner look */
        .name-input { 
            font-family: serif; font-weight: 900; font-size: 2.5rem; background: transparent; border: none; 
            width: 100%; outline: none; transition: color 0.3s;
            &::placeholder { color: #333; }
        }
    }

    .scroll-content { padding: 0 2rem 2rem 2rem; overflow-y: auto; flex: 1; }
    
    .subtitle {
        font-family: 'Inter', sans-serif; font-size: 1rem; color: #a1a1aa; 
        background: transparent; border: none; width: 100%; padding: 0; resize: none;
        margin-bottom: 2rem;
    }

    /* GRID MATRIX SYSTEM */
    .matrix-grid {
        display: grid;
        grid-template-columns: 80px 1fr 1fr;
        gap: 1.5rem;
        align-items: start;
        margin-top: 1rem;
    }
    
    .grid-header {
        font-size: 0.7rem; font-weight: bold; color: #52525b; text-transform: uppercase; letter-spacing: 1px;
        &.left { grid-column: 2; }
        &.right { grid-column: 3; }
    }

    .label-col {
        text-align: right; padding-top: 0.5rem;
        .main-label { 
            font-weight: 900; font-size: 0.8rem; color: var(--hero-color); letter-spacing: 0.5px; text-transform: uppercase; 
        }
        .sub-label { font-size: 0.65rem; color: #52525b; line-height: 1.2; margin-top: 2px; }
    }
    
    .span-2 { grid-column: 2 / 4; }

    /* MAGIC BOX */
    .magic-wrapper { position: relative; width: 100%; height: 100%; }
    .magic-btn {
        position: absolute; top: 0.25rem; right: 0.25rem;
        background: rgba(0,0,0,0.3); border: none; cursor: pointer; border-radius: 4px;
        padding: 0.25rem 0.5rem;
        opacity: 0.4; transition: all 0.2s; font-size: 1rem;
        &:hover { opacity: 1; background: rgba(255,255,255,0.1); }
        &:disabled { cursor: wait; animation: spin 1s linear infinite; }
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }

    .clean-area, .clean-box {
        width: 100%; background: #121215; border: 1px solid #1f1f22; color: #d4d4d8; 
        font-family: 'Inter', sans-serif; line-height: 1.5; resize: none; padding: 1rem; border-radius: 8px;
        transition: border-color 0.2s;
        &:focus { outline: none; border-color: var(--hero-color); }
        &[readonly] { background: transparent; border-color: transparent; padding-left: 0; }
    }
    /* Darker boxes for the grid items to match screenshot */
    .clean-box { background: #0e0e11; border-color: #1a1a1d; }

    /* VISUAL ENGINE STYLES */
    .visual-engine { display: flex; flex-direction: column; gap: 0.5rem; }
    .visual-engine textarea {
        background: #000; color: #a1a1aa; border: 1px solid #333; font-family: monospace; font-size: 0.8rem;
        padding: 0.75rem; border-radius: 6px; resize: vertical;
        &:focus { border-color: var(--hero-color); outline: none; }
    }
    .controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    button {
        background: #18181b; border: 1px solid #27272a; color: #e4e4e7; padding: 0.5rem;
        border-radius: 6px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
        &:hover:not(:disabled) { background: #27272a; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
        &.primary { background: var(--hero-color); color: #000; border-color: var(--hero-color); font-weight: bold; }
        &.ghost { background: transparent; border-color: transparent; color: #a1a1aa; }
    }

    /* FORM ROW / FIELD STACK */
    .field-stack { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-row { display: flex; justify-content: space-between; }
    .checkbox-label { font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #a1a1aa; }
    
    .range-row {
        display: flex; flex-direction: column; gap: 0.25rem;
        label { font-size: 0.7rem; color: #71717a; text-transform: uppercase; }
        input[type="range"] { width: 100%; accent-color: var(--hero-color); }
        &.disabled { opacity: 0.5; pointer-events: none; }
    }

    .color-grid {
        display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem;
        .color-swatch {
            width: 100%; aspect-ratio: 1; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); padding: 0;
            cursor: pointer; transition: transform 0.2s;
            &:hover { transform: scale(1.1); }
            &.active { border: 2px solid white; transform: scale(1.1); }
        }
    }
    
    select {
        width: 100%; background: #18181b; border: 1px solid #27272a; color: #e4e4e7;
        padding: 0.5rem; border-radius: 6px; font-size: 0.8rem;
    }

    /* DEV DASHBOARD */
    .info-grid {
        display: grid; gap: 0.5rem;
        .info-row { 
            display: flex; justify-content: space-between; align-items: center; 
            font-size: 0.8rem; border-bottom: 1px solid #18181b; padding-bottom: 0.25rem;
            &:last-child { border-bottom: none; }
            &.clickable { cursor: pointer; &:hover { background: rgba(255,255,255,0.05); } }
        }
        .key { color: #71717a; }
        .value { color: #e4e4e7; font-weight: 500; }
        .mono { font-family: monospace; font-size: 0.75rem; color: #52525b; }
        
        .flag { 
            display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; background: #18181b; color: #52525b;
            &.on { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        }
    }

    /* Dynamics */
    .dynamics-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        .dynamic-item {
            .label { font-size: 0.7rem; color: #a1a1aa; text-transform: uppercase; }
            .bar-bg { height: 4px; background: #27272a; border-radius: 2px; overflow: hidden; margin-top: 0.25rem; }
            .bar-fill { height: 100%; background: var(--hero-color); }
        }
    }

</style></style>
