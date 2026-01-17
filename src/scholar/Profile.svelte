<script>
  import Modal from "../artificer/Modal.svelte";
  import Button from "../artificer/Button.svelte";
  import { app } from "../gamemaster/state.svelte.js";
  import { runtime } from "./runtime.svelte.js";
  import { VisualManager } from "../mesmer/logic/manager.js";
  import { store } from "../gamemaster/index.js";
  import { Scholar, entities } from "./index.js";
  import { CONFIG } from "../gamemaster/config.js";

  import { voiceService } from "../mesmer/audio/voice.svelte.js";
  import { audioService } from "../mesmer/audio/service.js";
  import { themeStore } from "../mesmer/logic/theme.svelte.js";

  let isEditing = $state(false);
  let isSaving = $state(false);

  function normalize() {
    char = themeStore.normalizeEntity(app.editingEntity || runtime.character);
  }

  let char = $state(
    themeStore.normalizeEntity(app.editingEntity || runtime.character),
  );

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
  // [MODERNIZED] Use Reactive Service directly (No manual sync)
  let voices = $derived(voiceService.voices);
  let selectedVoice = $derived(voices.find((v) => v.uri === char.voice?.uri));
  let isNaturalVoice = $derived(
    selectedVoice &&
      (selectedVoice.name?.toLowerCase().includes("natural") ||
        selectedVoice.name?.includes("Neural")),
  );

  // Plot Logic (Dev Mode)
  let plotInput = $state("");

  // Voice service is auto-reactive

  async function save() {
    isSaving = true;
    try {
      console.log("[Profile] Saving character...", char);

      // [CRITICAL] Unwrap Svelte 5 Proxy before saving to DB
      // IndexedDB cannot clone Proxies, so we must deep copy raw data
      const rawChar = JSON.parse(JSON.stringify(char));

      // Ensure type is lowercase for repository
      const type = (rawChar.type || "character").toLowerCase();
      await entities.upsert(type, rawChar);
      console.log("Saved character to DB:", rawChar.id);

      // [FIX] Update global runtime state only AFTER successful save
      // Identify target slot... for now we just update the object in memory if it matches
      if (app.editingEntity && app.editingEntity.id === rawChar.id) {
        Object.assign(app.editingEntity, rawChar);
      }
      // Also update runtime.character if it matches (User editing themselves)
      if (runtime.character.id === rawChar.id) {
        Object.assign(runtime.character, rawChar);
      }
      // Update AI/Fractal slots if matched
      if (runtime.aiCharacter && runtime.aiCharacter.id === rawChar.id) {
        Object.assign(runtime.aiCharacter, rawChar);
      }
      if (runtime.storyFractal && runtime.storyFractal.id === rawChar.id) {
        Object.assign(runtime.storyFractal, rawChar);
      }

      isEditing = false;
    } catch (e) {
      console.error("[RPGlitch] Failed to save character:", e);
      alert("Failed to save character. Please try again.");
    } finally {
      isSaving = false;
    }
  }

  async function deleteEntity() {
    if (!confirm("Are you sure you want to delete this entity?")) return;
    try {
      await entities.remove(char.type, char.id);
      isEditing = false;
      app.toggleProfile(false);
      // Force reload to refresh lists/seed factory (User Requirement)
      window.location.reload();
    } catch (e) {
      console.error("Delete failed:", e);
    }
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
        removeBackground: char.visuals.noBackground,
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
    document.getElementById("profile-upload-trigger").click();
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
      // Use new AI-powered enhancer
      visualPrompt = await Scholar.enhanceVisual(visualPrompt, char);
      audioService.play("notification");
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
      // Pure logic, state-based update
      const result = await Scholar.consult(field, char);

      // Update Nested Field Logic
      const keys = field.split(".");
      if (keys.length === 1) {
        char[keys[0]] = result;
      } else if (keys.length === 2) {
        if (!char[keys[0]]) char[keys[0]] = {};
        char[keys[0]][keys[1]] = result;
      }
      // Trigger save/reactivity?
      // Svelte 5 deep reactivity handles mutation automatically.
    } catch (e) {
      console.error(`Magic failed for ${field}:`, e);
    } finally {
      magicBusy[field] = false;
    }
  }

  function getScholarId(key) {
    return `input-${key.replace(/\./g, "-")}`;
  }

  function getMagicBtnId(key) {
    return `btn-magic-${key.replace(/\./g, "-")}`;
  }

  // --- PLOT HANDLERS ---
  function addPlotThread() {
    if (!plotInput.trim()) return;
    if (!char.customData) char.customData = {};
    if (!char.customData.plot)
      char.customData.plot = { active: [], resolved: [] };

    char.customData.plot.active = [
      ...(char.customData.plot.active || []),
      plotInput.trim(),
    ];
    plotInput = "";
    save(); // Auto-save for dev convenience
  }

  function resolvePlotThread(index) {
    const thread = char.customData.plot.active[index];
    char.customData.plot.active = char.customData.plot.active.filter(
      (_, i) => i !== index,
    );
    char.customData.plot.resolved = [
      thread,
      ...(char.customData.plot.resolved || []),
    ];
    save();
  }

  function deletePlotThread(listType, index) {
    char.customData.plot[listType] = char.customData.plot[listType].filter(
      (_, i) => i !== index,
    );
    save();
  }

  // --- COLOR PICKER HELPER ---
  function setSignatureColor(hex) {
    char.visuals.signatureColor = hex;
  }

  function handleImplicitClose() {
    if (isEditing) {
      // Soft Cancel: Revert to readonly, stay open
      const target = app.editingEntity || runtime.character;
      char = normalize(target);
      isEditing = false;
    } else {
      // Hard Close: Exit profile
      app.toggleProfile(false);
    }
  }
</script>

{#if char && char.id}
  <Modal variant="canvas" onclose={handleImplicitClose}>
    <!-- Apply the signature color to the workbench so children can inherit it -->
    <!-- Wiring Fix: allow click on workbench to close -->
    <div
      class="workbench"
      style="--hero-color: {char.visuals.signatureColor}"
      role="presentation"
      onclick={(e) => {
        // Soft Cancel / Close logic
        if (e.target === e.currentTarget) handleImplicitClose();
      }}
    >
      <!-- LEFT SATELLITE: Creative Tools (Now Split) -->
      <div class="satellite left" class:visible={isEditing}>
        <!-- VISUAL BOX -->
        <div class="panel-box top">
          <div class="panel-section">
            <div class="visual-engine">
              <textarea
                bind:value={visualPrompt}
                disabled={visualBusy}
                placeholder="Describe appearance..."
                rows="4"
              ></textarea>
              <div class="controls-grid">
                {#if !hasPromptContent}
                  <button
                    onclick={handleExtract}
                    disabled={visualBusy}
                    title="Extract description from profile">🔮 Extract</button
                  >
                  <button
                    onclick={handleUpload}
                    disabled={visualBusy}
                    title="Upload Reference">📂 Upload</button
                  >
                {:else if isPromptUrl}
                  <button onclick={handleUploadUrl} disabled={visualBusy}
                    >🔗 Use URL</button
                  >
                  <button
                    class="ghost"
                    onclick={() => (visualPrompt = "")}
                    disabled={visualBusy}>❌ Clear</button
                  >
                {:else}
                  <button
                    onclick={handleEnhancePrompt}
                    disabled={visualBusy}
                    title="Enhance prompt with AI">✨ Enhance</button
                  >
                  <button
                    class="primary"
                    onclick={handlePaint}
                    disabled={visualBusy}
                    title="Generate Image"
                  >
                    {visualBusy ? "🎨 Painting..." : "🎨 Paint"}
                  </button>
                {/if}
                <input
                  type="file"
                  id="profile-upload-trigger"
                  hidden
                  onchange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="field-stack">
              <div class="controls-grid compact">
                <button
                  class="toggle-btn"
                  class:active={char.visuals.noBackground}
                  disabled={visualBusy}
                  onclick={() =>
                    (char.visuals.noBackground = !char.visuals.noBackground)}
                  title="Toggle Transparent Background"
                >
                  {char.visuals.noBackground ? "No BG: ON" : "No BG: OFF"}
                </button>
                <button
                  class="toggle-btn"
                  class:active={char.visuals.flipped}
                  disabled={visualBusy}
                  onclick={() => (char.visuals.flipped = !char.visuals.flipped)}
                  title="Flip Image Horizontally"
                >
                  {char.visuals.flipped ? "Flip: ON" : "Flip: OFF"}
                </button>
              </div>

              <div class="range-row">
                <div class="color-grid">
                  <!-- Ensure Orange (#f97316) is available -->
                  {#each Object.entries( { ...CONFIG.PALETTE, orange: "#f97316" }, ) as [name, hex]}
                    {#if name !== "default"}
                      <button
                        class="color-swatch"
                        style="background: {hex}"
                        class:active={char.visuals.signatureColor === hex}
                        onclick={() => setSignatureColor(hex)}
                        title={name}
                      ></button>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AUDIO BOX -->
        <div class="panel-box bottom">
          <div class="panel-section">
            <div class="field-stack">
              <div class="voice-row">
                <select id="voice-select" bind:value={char.voice.uri}>
                  <option value="">System Default</option>
                  {#each voices as voice}
                    <option value={voice.uri}>{voice.name}</option>
                  {/each}
                </select>
                <button
                  class="icon-btn"
                  onclick={() =>
                    voiceService.preview(
                      char.voice?.uri,
                      char.voice?.rate,
                      char.voice?.pitch,
                    )}
                  title="Preview Voice">🔊</button
                >
              </div>
              <div class="slider-grid">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  bind:value={char.voice.rate}
                  title="Rate: {Number(char.voice?.rate || 1).toFixed(1)}x"
                />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  bind:value={char.voice.pitch}
                  disabled={isNaturalVoice}
                  style="opacity: {isNaturalVoice ? 0.5 : 1}"
                  title="Pitch: {Number(char.voice?.pitch || 1).toFixed(1)}"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER: The Entity Card (WYSIWYG) -->
      <div class="profile-card">
        <div class="hero-layout">
          <!-- VISUALS (Image Only) -->
          <div class="hero-visuals">
            <div class="image-layer">
              {#if char.visuals.avatar}
                <img
                  src={char.visuals.avatar}
                  alt="Hero"
                  class:no-bg={char.visuals.noBackground}
                  class:flipped={char.visuals.flipped}
                />
              {:else}
                <div class="placeholder" style="color: var(--hero-color)">
                  MAX
                </div>
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
                  {@render magicField(
                    null,
                    char.eternal,
                    "mental",
                    "eternal.mental",
                    4,
                  )}
                </div>
                <div>
                  {@render magicField(
                    null,
                    char.eternal,
                    "physical",
                    "eternal.physical",
                    4,
                  )}
                </div>

                <!-- PRESENT ROW -->
                <div class="label-col">
                  <div class="main-label">PRESENT</div>
                  <div class="sub-label">Current State</div>
                </div>
                <div>
                  {@render magicField(
                    null,
                    char.present,
                    "mental",
                    "present.mental",
                    4,
                  )}
                </div>
                <div>
                  {@render magicField(
                    null,
                    char.present,
                    "physical",
                    "present.physical",
                    4,
                  )}
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
            <!-- ACTION FOOTER -->
            <!-- ACTION FOOTER -->
            <div class="card-footer">
              {#if isEditing}
                <Button
                  label="Delete"
                  variant="danger"
                  onclick={deleteEntity}
                />
                <Button label="Save Changes" variant="primary" onclick={save} />
              {:else}
                <Button
                  label="Edit"
                  variant="secondary"
                  onclick={() => (isEditing = true)}
                />
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SATELLITE: Dev Tools -->
      <div class="satellite right panel-box" class:visible={devMode}>
        <div class="panel-section">
          <div class="dynamics-grid">
            {#each Object.entries(char.dynamics || {}) as [k, v]}
              <div class="dynamic-item">
                <span class="label">{k}</span>
                {#if isEditing}
                  <input
                    type="range"
                    class="dynamic-slider"
                    min="0"
                    max="100"
                    bind:value={char.dynamics[k]}
                    title="{k}: {v}"
                  />
                {:else}
                  <div class="bar-bg">
                    <div
                      class="bar-fill"
                      style="width: {v}%; background: var(--hero-color);"
                    ></div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- PLOT TRACKER (New) -->
        <div class="panel-section">
          <div class="plot-widget">
            {#if isEditing}
              <div class="plot-controls">
                <input
                  type="text"
                  class="rpg-input small"
                  placeholder="New plot thread..."
                  bind:value={plotInput}
                  onkeydown={(e) => e.key === "Enter" && addPlotThread()}
                />
                <Button
                  label="Add"
                  variant="secondary"
                  onclick={addPlotThread}
                />
              </div>

              <div class="plot-list">
                {#each char.customData?.plot?.active || [] as thread, i}
                  <div class="plot-item active">
                    <span class="bullet" style="color: var(--hero-color)"
                      >●</span
                    >
                    <span class="text">{thread}</span>
                    <div class="actions">
                      <button
                        class="icon-btn"
                        onclick={() => resolvePlotThread(i)}
                        title="Resolve">✓</button
                      >
                      <button
                        class="icon-btn danger"
                        onclick={() => deletePlotThread("active", i)}
                        title="Delete">×</button
                      >
                    </div>
                  </div>
                {/each}

                {#each char.customData?.plot?.resolved || [] as thread, i}
                  <div class="plot-item resolved">
                    <span class="bullet">○</span>
                    <span class="text">{thread}</span>
                    <button
                      class="icon-btn danger"
                      onclick={() => deletePlotThread("resolved", i)}
                      title="Delete">×</button
                    >
                  </div>
                {/each}
              </div>
            {:else}
              <!-- READ ONLY MODE -->
              <ul class="plot-read-only">
                {#each char.customData?.plot?.active || [] as thread}
                  <li>
                    <span class="bullet" style="color: var(--hero-color)"
                      >●</span
                    >
                    {thread}
                  </li>
                {/each}
                {#if (char.customData?.plot?.active || []).length === 0}
                  <li class="empty">No active plot threads.</li>
                {/if}
                {#each char.customData?.plot?.resolved || [] as thread}
                  <li class="resolved">
                    {thread}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Modal>
{/if}

{#snippet magicField(label, parent, key, fieldKey, rows = 3)}
  <div class="field-wrapper">
    {#if label}<label for={getScholarId(fieldKey)}>{label}</label>{/if}
    <div class="magic-wrapper">
      {#if isEditing}
        <textarea
          id={getScholarId(fieldKey)}
          class="clean-box"
          bind:value={parent[key]}
          readonly={magicBusy[fieldKey]}
          {rows}
        ></textarea>
      {:else}
        <div class="read-only-box" style="height: {rows * 1.5 + 2}rem;">
          <span class="read-only-text">{parent[key] || ""}</span>
        </div>
      {/if}

      {#if isEditing}
        <button
          id={getMagicBtnId(fieldKey)}
          class="magic-btn"
          onclick={() => consultScholar(fieldKey, char.type)}
          disabled={magicBusy[fieldKey]}
          title="Consult Scholar"
        >
          {magicBusy[fieldKey] ? "⏳" : "✨"}
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
  .profile-card {
    width: 850px;
    height: 650px;
    background: #09090b;
    border: 1px solid #27272a;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0; /* [FIX] Prevent flex squashing */
  }

  /* SATELLITE CONTAINER */
  .satellite {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* [TIGHTENED] From 1.5rem */

    /* Spawning Animation Vars */
    width: 0;
    padding: 0;
    opacity: 0;
    margin: 0;
    transform: rotateY(15deg) scale(0.9);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

    &.visible {
      width: 320px;
      opacity: 1;
      margin: 0 1.5rem;
      transform: rotateY(0) scale(1);
    }

    &.left {
      order: -1;
      transform-origin: right center;
      justify-content: center;
    }
    &.right {
      order: 1;
      transform-origin: left center;
      justify-content: center;
    }
  }

  /* PANEL BOX: The actual visual container (glassy/border) */
  .panel-box {
    background: #09090b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 1rem; /* [TIGHTENED] From 1.5rem */
    overflow-y: auto;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);

    &.top {
      flex: 1.2;
    } /* Visual prompts need more space */
    &.bottom {
      flex: 0.8;
    }
  }

  .panel-section {
    margin-bottom: 0.75rem; /* [TIGHTENED] From 1.5rem */
    &:last-child {
      margin-bottom: 0;
    }
  }

  /* HERO LAYOUT INTERNAL */
  .hero-layout {
    display: grid;
    grid-template-columns: 35% 65%;
    height: 100%;
  }

  .hero-visuals {
    background: #000;
    position: relative;
    overflow: hidden;
    .image-layer {
      width: 100%;
      height: 100%;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        &.no-bg {
          object-fit: contain;
        }
        &.flipped {
          transform: scaleX(-1);
        }
      }
      .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: #333;
      }
    }
  }

  .hero-data {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* No border bottom, cleaner look */
    .name-input {
      font-family: serif;
      font-weight: 900;
      font-size: 2.5rem;
      background: transparent;
      border: none;
      width: 100%;
      outline: none;
      transition: color 0.3s;
      &::placeholder {
        color: #333;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
  }

  .scroll-content {
    padding: 0 2rem 2rem 2rem;
    overflow-y: auto;
    flex: 1;
  }

  .subtitle {
    font-family: "Inter", sans-serif;
    font-size: 1rem;
    color: #a1a1aa;
    background: transparent;
    border: none;
    width: 100%;
    padding: 0;
    resize: none;
    margin-bottom: 2rem;
  }

  /* GRID MATRIX SYSTEM */
  .matrix-grid {
    display: grid;
    grid-template-columns: 80px 1fr 1fr;
    gap: 1.5rem;
    align-items: center; /* [FIX] Center items vertically */
    margin-top: 1rem;
  }

  .grid-header {
    font-size: 0.7rem;
    font-weight: bold;
    color: #52525b;
    text-transform: uppercase;
    letter-spacing: 1px;
    &.left {
      grid-column: 2;
    }
    &.right {
      grid-column: 3;
    }
  }

  .label-col {
    text-align: right;
    padding-top: 0.5rem;
    .main-label {
      font-weight: 900;
      font-size: 0.8rem;
      color: var(--hero-color);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      /* Ensure text breaks if needed, but centering handles main alignment */
    }
    .sub-label {
      font-size: 0.65rem;
      color: #52525b;
      line-height: 1.2;
      margin-top: 2px;
    }
  }

  .span-2 {
    grid-column: 2 / 4;
  }

  /* MAGIC BOX */
  .magic-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .magic-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    cursor: pointer;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    opacity: 0.4;
    transition: all 0.2s;
    font-size: 1rem;
    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }
    &:disabled {
      cursor: wait;
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }

  .clean-area,
  .clean-box {
    width: 100%;
    background: #121215;
    border: 1px solid #1f1f22;
    color: #d4d4d8;
    font-family: "Inter", sans-serif;
    line-height: 1.5;
    resize: none;
    padding: 1rem;
    border-radius: 8px;
    transition: border-color 0.2s;
    &:focus {
      outline: none;
      border-color: var(--hero-color);
    }
    &[readonly] {
      background: transparent;
      border-color: transparent;
      padding-left: 0;
    }
  }

  /* READ ONLY TEXT DISPLAY */
  .read-only-box {
    width: 100%;
    background: transparent;
    border: 1px solid transparent; /* Maintain sizing alignment */
    color: #d4d4d8;
    font-family: "Inter", sans-serif;
    padding: 1rem 0; /* Vertical padding */
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-start; /* [FIX] Left Align Text */
    padding-left: 1rem; /* [FIX] Add padding for left alignment */
    overflow: hidden;
  }
  .read-only-text {
    max-height: 100%;
    overflow-y: auto;
    width: 100%;
  }

  /* Darker boxes for the grid items to match screenshot */
  .clean-box {
    background: #0e0e11;
    border-color: #1a1a1d;
  }

  /* VISUAL ENGINE STYLES */
  .visual-engine {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .visual-engine textarea {
    background: #000;
    color: #a1a1aa;
    border: 1px solid #333;
    font-family: monospace;
    font-size: 0.8rem;
    padding: 0.75rem;
    border-radius: 6px;
    resize: vertical;
    &:focus {
      border-color: var(--hero-color);
      outline: none;
    }
  }
  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  button {
    background: #18181b;
    border: 1px solid #27272a;
    color: #e4e4e7;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) {
      background: #27272a;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &.primary {
      background: var(--hero-color);
      color: #000;
      border-color: var(--hero-color);
      font-weight: bold;
    }
    &.ghost {
      background: transparent;
      border-color: transparent;
      color: #a1a1aa;
    }
  }

  /* FORM ROW / FIELD STACK */
  .field-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
    .color-swatch {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0;
      cursor: pointer;
      transition: transform 0.2s;
      &:hover {
        transform: scale(1.1);
      }
      &.active {
        border: 2px solid white;
        transform: scale(1.1);
      }
    }
  }

  select {
    width: 100%;
    background: #18181b;
    border: 1px solid #27272a;
    color: #e4e4e7;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  /* DEV DASHBOARD */
  /* Replaced by Plot Widget */

  /* Dynamics */
  .dynamics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    .dynamic-item {
      .label {
        font-size: 0.7rem;
        color: #a1a1aa;
        text-transform: uppercase;
      }
      .bar-bg {
        height: 4px;
        background: #27272a;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 0.25rem;
      }
      .bar-fill {
        height: 100%;
        background: var(--hero-color);
      }
    }
  }
  /* NEW CONTROLS STYLING */
  .controls-grid.compact {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .toggle-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #71717a;
    font-size: 0.75rem;
    padding: 0.4rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #e4e4e7;
    }
    &.active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--hero-color);
      border-color: var(--hero-color);
      box-shadow: 0 0 10px -2px var(--hero-color);
    }
  }

  /* PLOT WIDGET */
  .plot-widget {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .plot-controls {
    display: flex;
    gap: 0.5rem;
    .rpg-input.small {
      font-size: 0.8rem;
      padding: 0.4rem;
      margin-bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }
  }

  .plot-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .plot-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.25rem 0.5rem; /* Compact padding */
    border-radius: 4px;

    .bullet {
      font-size: 0.7rem;
      flex-shrink: 0;
    }
    .text {
      flex: 1;
      color: #d4d4d8;
      word-break: break-word;
    }

    .actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .actions {
      opacity: 1;
    }

    &.resolved {
      opacity: 0.5;
      .text {
        text-decoration: line-through;
      }
    }
  }

  .icon-btn {
    background: transparent;
    border: none;
    color: #71717a;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0 0.25rem;
    &:hover {
      color: #e4e4e7;
    }
    &.danger:hover {
      color: #ef4444;
    }
  }
  /* AUDIO CONTROLS */
  .voice-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
    height: 48px; /* Force uniformity */

    select {
      flex: 1;
      height: 100%; /* Fill container */
      margin-bottom: 0;
    }

    button {
      height: 100%; /* Match select */
      aspect-ratio: 1; /* Square */
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
    }
  }

  textarea:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  input[type="range"] {
    accent-color: var(--hero-color);
  }

  /* READ ONLY TEXT DISPLAY */
  .read-only-box {
    width: 100%;
    background: transparent;
    border: 1px solid transparent; /* Maintain sizing alignment */
    color: #d4d4d8;
    font-family: "Inter", sans-serif;
    padding: 1rem 0; /* Vertical padding */
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-start; /* [FIX] Left Align Text */
    padding-left: 0.5rem; /* [FIX] Check padding */
    overflow: hidden;
    text-align: left;
  }
  .read-only-text {
    max-height: 100%;
    overflow-y: auto;
    width: 100%;
  }

  .slider-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    input[type="range"] {
      margin: 0;
      width: 100%;
    }
  }

  /* DYNAMICS SLIDER */
  .dynamic-slider {
    margin: 0;
    height: 4px; /* Thin look */
    accent-color: var(--hero-color);
  }

  /* READ ONLY PLOT */
  .plot-read-only {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.9rem;
    color: #e4e4e7;
    li {
      margin-bottom: 0.5rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      &.empty {
        font-style: italic;
        color: #71717a;
      }
      &.resolved {
        text-decoration: line-through;
        opacity: 0.5;
      }
      .bullet {
        font-size: 0.6rem;
      }
    }
  }
</style>
