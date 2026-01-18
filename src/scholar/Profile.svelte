<script>
  import DOMPurify from "dompurify";
  import Button from "../artificer/Button.svelte";
  import Modal from "../artificer/Modal.svelte";
  import { CONFIG } from "../gamemaster/config.js";
  import { app } from "../gamemaster/state.svelte.js";
  import { soundEffects } from "../mesmer/audio/sound-effects.js";
  import { textToSpeech } from "../mesmer/audio/text-to-speech.svelte.js";
  import { TextToImage } from "../mesmer/logic/text-to-image.js";
  import { themeStore } from "../mesmer/logic/theme.svelte.js";
  import ProfilePicture from "../mesmer/ui/ProfilePicture.svelte";
  import { entities } from "./database/repository.js";
  import { Scholar } from "./index.js";
  import { runtime } from "./runtime.svelte.js";

  // --- UTILS ---
  function formatMarkdownLite(text) {
    if (!text) return "";
    // Bold: **text**
    let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    return html;
  }

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
  let voices = $derived(textToSpeech.voices);
  let selectedVoice = $derived(voices.find((v) => v.uri === char.voice?.uri));
  let isNaturalVoice = $derived(
    selectedVoice &&
      (selectedVoice.name?.toLowerCase().includes("natural") ||
        selectedVoice.name?.includes("Neural")),
  );

  // Plot Logic (Dev Mode)
  let plotInput = $state("");

  async function save() {
    isSaving = true;
    try {
      console.log("[Profile] Saving character...", char);

      // [CRITICAL] Unwrap Svelte 5 Proxy before saving to DB
      // IndexedDB cannot clone Proxies, so we must deep copy raw data
      const rawChar = JSON.parse(JSON.stringify(char));

      // Type should already be lowercase
      const type = rawChar.type || "character";
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

  $effect(() => {
    // Watch for ID changes to reset local UI state
    // This replaces the {#key} wrapper which was causing reconciliation crashes
    if (char?.id) {
      visualPrompt = "";
      magicBusy = {};
      isEditing = false;
    }
  });

  // --- AUDIO & VISUAL LOGIC ---

  async function handleExtract() {
    visualPrompt = TextToImage.composePrompt(char);
  }

  async function handlePaint() {
    try {
      visualBusy = true;
      const url = await TextToImage.generate(visualPrompt, {
        resolution: char.type === "fractal" ? "768x768" : "512x768",
        removeBackground: char.visuals.noBackground,
      });
      if (url) {
        char.visuals.profilePictureUrl = url;
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
      char.visuals.profilePictureUrl = visualPrompt.trim();
      visualPrompt = "";
    }
  }

  async function handleEnhancePrompt() {
    try {
      visualBusy = true;
      // Use new AI-powered enhancer
      visualPrompt = await Scholar.enhanceVisual(visualPrompt, char);
      soundEffects.play("notification");
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
      const url = await TextToImage.upload(file);
      if (url) char.visuals.profilePictureUrl = url;
    } catch (err) {
      console.error(err);
    } finally {
      visualBusy = false;
    }
  }

  // --- MAGIC BUTTON HANDLERS ---

  async function consultScholar(field) {
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
      normalize();
      isEditing = false;
    } else {
      // Hard Close: Exit profile
      app.toggleProfile(false);
    }
  }
</script>

{#if char && char.id}
  {#key char.id}
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
                    <Button
                      label="🔮 Extract"
                      onclick={handleExtract}
                      disabled={visualBusy}
                      title="Extract description from profile"
                    />
                    <Button
                      label="📂 Upload"
                      onclick={handleUpload}
                      disabled={visualBusy}
                      title="Upload Reference"
                    />
                  {:else if isPromptUrl}
                    <Button
                      label="🔗 Use URL"
                      onclick={handleUploadUrl}
                      disabled={visualBusy}
                    />
                    <Button
                      label="❌ Clear"
                      variant="ghost"
                      onclick={() => (visualPrompt = "")}
                      disabled={visualBusy}
                    />
                  {:else}
                    <Button
                      label="✨ Enhance"
                      onclick={handleEnhancePrompt}
                      disabled={visualBusy}
                      title="Enhance prompt with AI"
                    />
                    <Button
                      label={visualBusy ? "🎨 Painting..." : "🎨 Paint"}
                      variant="primary"
                      onclick={handlePaint}
                      disabled={visualBusy}
                      title="Generate Image"
                    />
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
                  <Button
                    variant="ghost"
                    className="toggle-btn {char.visuals.noBackground
                      ? 'active'
                      : ''}"
                    disabled={visualBusy}
                    onclick={() =>
                      (char.visuals.noBackground = !char.visuals.noBackground)}
                    title="Toggle Transparent Background"
                  >
                    {char.visuals.noBackground ? "No BG: ON" : "No BG: OFF"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="toggle-btn {char.visuals.flipped
                      ? 'active'
                      : ''}"
                    disabled={visualBusy}
                    onclick={() =>
                      (char.visuals.flipped = !char.visuals.flipped)}
                    title="Flip Image Horizontally"
                  >
                    {char.visuals.flipped ? "Flip: ON" : "Flip: OFF"}
                  </Button>
                </div>

                <div class="range-row">
                  <div class="color-grid">
                    <!-- Ensure Orange (#f97316) is available -->
                    {#each Object.entries(CONFIG.PALETTE || {}) as [name, hex] (name)}
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
                    {#each voices as voice, i (i)}
                      <option value={voice.uri}>{voice.name}</option>
                    {/each}
                  </select>
                  <Button
                    variant="ghost"
                    className="icon-btn"
                    onclick={() =>
                      textToSpeech.preview(
                        char.voice?.uri,
                        char.voice?.rate,
                        char.voice?.pitch,
                      )}
                    title="Preview Voice">🔊</Button
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
              <ProfilePicture entity={char} />
            </div>

            <!-- DATA BOARD -->
            <div class="hero-data">
              <div class="header">
                <textarea
                  class="name-input"
                  rows="2"
                  bind:value={char.name}
                  readonly={!isEditing}
                  placeholder="Name"
                  style="color: var(--hero-color)"
                ></textarea>
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
                  <div class="field-cell">
                    {@render magicField(
                      null,
                      char.eternal,
                      "mental",
                      "eternal.mental",
                      4,
                    )}
                  </div>
                  <div class="field-cell">
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
                  <div class="field-cell">
                    {@render magicField(
                      null,
                      char.present,
                      "mental",
                      "present.mental",
                      4,
                    )}
                  </div>
                  <div class="field-cell">
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
              <div class="card-footer">
                {#if isEditing}
                  <Button
                    label="Delete"
                    variant="danger"
                    onclick={deleteEntity}
                  />
                  <Button
                    label="Save Changes"
                    variant="primary"
                    onclick={save}
                    disabled={isSaving}
                  />
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
              {#each Object.entries(char.dynamics || {}) as [k, v] (k)}
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
                  {#each char.customData?.plot?.active || [] as thread, i (i)}
                    <div class="plot-item active">
                      <span class="bullet" style="color: var(--hero-color)"
                        >●</span
                      >
                      <span class="text">{thread}</span>
                      <div class="actions">
                        <Button
                          variant="ghost"
                          className="icon-btn"
                          onclick={() => resolvePlotThread(i)}
                          title="Resolve">✓</Button
                        >
                        <Button
                          variant="ghost"
                          className="icon-btn danger"
                          onclick={() => deletePlotThread("active", i)}
                          title="Delete">×</Button
                        >
                      </div>
                    </div>
                  {/each}

                  {#each char.customData?.plot?.resolved || [] as thread, i (i)}
                    <div class="plot-item resolved">
                      <span class="bullet">○</span>
                      <span class="text">{thread}</span>
                      <Button
                        variant="ghost"
                        className="icon-btn danger"
                        onclick={() => deletePlotThread("resolved", i)}
                        title="Delete">×</Button
                      >
                    </div>
                  {/each}
                </div>
              {:else}
                <!-- READ ONLY MODE -->
                <ul class="plot-read-only">
                  {#each char.customData?.plot?.active || [] as thread, i (i)}
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
                  {#each char.customData?.plot?.resolved || [] as thread, i (i)}
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
  {/key}
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
        <div class="read-only-box">
          <!-- eslint-disable svelte/no-at-html-tags -->
          <span class="read-only-text"
            >{@html DOMPurify.sanitize(
              formatMarkdownLite(parent[key] || ""),
            )}</span
          >
          <!-- eslint-enable svelte/no-at-html-tags -->
        </div>
      {/if}

      {#if isEditing}
        <Button
          id={getMagicBtnId(fieldKey)}
          className="magic-btn"
          variant="ghost"
          onclick={() => consultScholar(fieldKey, char.type)}
          disabled={magicBusy[fieldKey]}
          title="Consult Scholar"
        >
          {magicBusy[fieldKey] ? "⏳" : "✨"}
        </Button>
      {/if}
    </div>
  </div>
{/snippet}

<style lang="scss">
  @use "../mesmer/scss/abstracts/variables" as *;
  @use "../mesmer/scss/abstracts/mixins" as *;
  @use "../mesmer/scss/abstracts/placeholders" as *;

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
    width: 90vw;
    max-width: 1100px;
    height: 100%; /* [FIX] Fill Modal Height */
    background: var(--app-component-bg);
    border: 5px solid var(--hero-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;
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
  }

  .hero-data {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto; /* [FIX] Unified Scrolling */
  }

  .header {
    padding: 2rem 2rem 0.5rem 2rem; /* [DESIGN] More top padding, condensed bottom */
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* [FIX] Allow top alignment for multi-line */
    /* No border bottom, cleaner look */
    .name-input {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 3.5rem;
      line-height: 1.15; /* [FIX] Tighter line height for 2-line titles */
      background: transparent;
      border: none;
      width: 100%;
      text-wrap-style: balance;
      align-content: end;
      outline: none;
      text-align: left;
      transition: color 0.3s;
      resize: none; /* [FIX] Prevent manual resizing */
      overflow: hidden; /* [FIX] Hide scrollbar */
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
    border-top: 0;
    background: rgba(0, 0, 0, 0.2);
  }

  .scroll-content {
    padding: 0 2rem;
    flex: 1;
    box-sizing: border-box; /* [FIX] Ensure padding is included in width */
  }

  .subtitle {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: #a1a1aa;
    opacity: var(--text-secondary);
    background: transparent;
    border: none;
    width: 100%;
    padding: 0;
    resize: none;
    margin: 0 0 1.5rem 0; /* [DESIGN] Add breathing room before labels */
    text-align: left; /* [FIX] Left-align */
  }

  /* GRID MATRIX SYSTEM */
  .matrix-grid {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    align-items: stretch;
    margin: 0;
  }

  /* [FIX] Field cells use flexbox to stretch children to full height */
  .field-cell {
    display: flex;
    flex-direction: column;

    /* All direct children stretch to fill */
    > * {
      flex: 1;
    }
  }

  .grid-header {
    font-family: var(--font-heading);
    font-size: 0.7rem;
    font-weight: bold;
    color: #a1a1aa; /* [FIX] Brighter color - was #52525b */
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    &.left {
      grid-column: 2;
    }
    &.right {
      grid-column: 3;
    }
  }

  .label-col {
    text-align: right;
    display: flex; /* [FIX] Enable flexbox for centering */
    flex-direction: column;
    justify-content: center; /* [FIX] Vertically center the label with text fields */
    align-items: flex-end; /* [FIX] Keep text right-aligned */
    min-height: 100%; /* [FIX] Match height of sibling fields */

    .main-label {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.95rem; /* [POLISH] Slightly larger */
      color: var(--hero-color);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .sub-label {
      font-family: var(--font-body);
      font-size: 0.65rem;
      color: #9ca3af; /* [FIX] Brighter sub-label - was #52525b */
      line-height: 1.2;
    }
  }

  .span-2 {
    grid-column: 2 / 4;
  }

  /* [FIX] Wrappers for height sync */
  .field-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    label {
      flex-shrink: 0;
      margin-bottom: 0.25rem;
    }
  }

  .magic-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    height: 100%; /* Ensure it fills parent */
  }

  .clean-area,
  .clean-box {
    width: 100%;
    height: 100%; /* [FIX] Sync heights - both fields fill grid cell */
    min-height: 80px;
    background: #121215;
    border: 1px solid #1f1f22;
    color: #d4d4d8;
    font-family: var(--font-body);
    line-height: 1.6;
    resize: none;
    border-radius: 8px;
    transition: border-color 0.2s;
    white-space: pre-wrap;
    text-align: left;
    box-sizing: border-box;
    overflow: hidden;
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
    height: 100%;
    background: transparent;
    border: 1px solid transparent; /* Maintain sizing alignment */
    color: #d4d4d8;
    font-family: var(--font-body);
    font-size: 0.85rem;
    line-height: 1.6; /* Increased for readability */
    padding: 0; /* Clear padding */
    border-radius: 8px;
    display: block; /* Allow natural block flow */
    white-space: pre-wrap; /* Respect line breaks from AI */
    word-break: break-word; /* Prevent overflow */
  }
  .read-only-text {
    display: block;
    width: 100%;
    text-align: left;
  }

  /* Darker boxes for the grid items to match screenshot */
  .clean-box {
    background: rgba(255, 255, 255, 0.03); /* [POLISH] Subtle surface */
    border-color: rgba(255, 255, 255, 0.05);
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
    font-family: var(--font-mono);
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
  /* button { ... } Removed: All buttons refactored to Button.svelte */

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
  }

  textarea:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  input[type="range"] {
    accent-color: var(--hero-color);
  }

  /* READ ONLY TEXT DISPLAY - Enhanced for flowing content */
  .read-only-box {
    width: 100%;
    background: rgba(255, 255, 255, 0.03); /* Subtle visible background */
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #d4d4d8;
    font-family: var(--font-body);
    font-size: 0.85rem;
    line-height: 1.65; /* Generous line-height for readability */
    padding: 0.75rem 1rem;
    border-radius: 8px;
    display: block;
    white-space: pre-wrap; /* Respect line breaks */
    word-break: break-word;
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }
  }
  .read-only-text {
    display: block;
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
