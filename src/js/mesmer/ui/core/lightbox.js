/**
 * LightboxService
 * Handles the full-screen display of generated images.
 */
import { downloadImage, createIconBtn } from "./utils.js";
import { GameMaster, store as state } from "../../../gamemaster/index.js";
import { sanitizeHtml } from "../../../gamemaster/utils.js";

const LIGHTBOX_ID = "lightbox-overlay";

export const LightboxService = {
  element: null,
  imageEl: null,
  actionsEl: null,
  debugVisible: false,

  init() {
    if (document.getElementById(LIGHTBOX_ID)) return;

    // 1. Create Overlay
    const overlay = document.createElement("div");
    overlay.id = LIGHTBOX_ID;
    overlay.className = "lightbox-overlay";

    // [MODIFIED] No Close Button (User Request)

    // 3. Create Content Container
    const content = document.createElement("div");
    content.className = "lightbox-content";

    const img = document.createElement("img");
    img.alt = "Fullscreen View";
    content.appendChild(img);

    const actions = document.createElement("div");
    actions.className = "lightbox-actions";

    // [NEW] Debug Info Container
    const debug = document.createElement("div");
    debug.className = "lightbox-debug developer-content";

    // Append actions and debug TO content
    content.appendChild(actions);
    content.appendChild(debug);

    // Append content to overlay
    overlay.appendChild(content);

    // 5. Append to Body
    document.body.appendChild(overlay);

    // 6. Bind Elements
    this.element = overlay;
    this.imageEl = img;
    this.actionsEl = actions;
    this.debugEl = debug;

    // 7. Bind Events (Backdrop Click)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target === content) {
        this.close();
      }
    });

    // Escape Key Listener
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        this.close();
      }
    });
  },

  isOpen() {
    return this.element && this.element.classList.contains("is-visible");
  },

  /**
   * Opens the lightbox with a specific image.
   * @param {string} imageUrl - Source URL
   * @param {object} context - { messageId, isLast, role, metadata }
   */
  open(imageUrl, context = {}) {
    if (!this.element) this.init();

    this.imageEl.src = imageUrl;
    this.element.classList.add("is-visible");
    this.debugVisible = false; // Reset toggle on open
    this._renderActions(imageUrl, context);
    this._renderDebug(context.metadata);
  },

  close() {
    if (!this.element) return;
    this.element.classList.remove("is-visible");
    // Clear src after fade out to prevent visual glitches?
    // Actually better to leave it so next open doesn't flash white.
  },

  _renderActions(imageUrl, context) {
    this.actionsEl.innerHTML = ""; // Clear previous

    // 1. Create Download Button (Standard Right-Side Action)
    const btnDownload = createIconBtn(
      `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
      "Download", // Label kept for A11y
      () => downloadImage(imageUrl, `rpglitch-${Date.now()}.png`),
      "btn-ghost",
    );

    // 2. Check Reroll Condition
    const showReroll =
      context.role === "ai" &&
      context.isLast &&
      context.messageId &&
      GameMaster;

    // 3. Append in Correct Order (Maestro Spec: Reroll Left | Download Right)
    if (showReroll) {
      const btnReroll = createIconBtn(
        `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
        "Reroll Image", // Label kept for A11y
        () => {
          this.close();
          if (context.onReroll) {
            context.onReroll();
          }
          GameMaster.regenerateMessageImage(context.messageId);
        },
        "btn-ghost",
      );
      // Append Reroll First (Left)
      this.actionsEl.appendChild(btnReroll);
    }

    // 3. Inspector Button (Dev Mode)
    const isDev = state.settings?.developerMode;
    if (isDev && context.metadata) {
      const btnInfo = createIconBtn(
        `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
        "Toggle Metadata",
        () => {
          this.debugVisible = !this.debugVisible;
          this.debugEl.classList.toggle("is-active", this.debugVisible);
        },
        "btn-ghost btn-metadata-toggle",
      );
      this.actionsEl.appendChild(btnInfo);
    }

    // Append Download Last (Right)
    this.actionsEl.appendChild(btnDownload);
  },

  _renderDebug(metadata) {
    if (!this.debugEl) return;
    this.debugEl.innerHTML = "";

    this.debugEl.classList.remove("is-active");

    const isDev = state.settings?.developerMode;
    if (!isDev || !metadata) {
      return;
    }

    // Adapted from bubble.js Visual Director card
    const rawPrompt =
      metadata.visualPrompt ||
      metadata.visualPrompts?.[0]?.prompt ||
      "No prompt data";
    const target =
      metadata.targetType || metadata.visualPrompts?.[0]?.target || "Unknown";
    const aspect =
      metadata.aspect || metadata.visualPrompts?.[0]?.aspect || "Portrait";
    const refined =
      metadata.refinedPrompt || metadata.refinedPrompts?.[0] || null;
    const thoughts = metadata.opticsThoughts?.[0] || null;

    const safeRaw = sanitizeHtml(rawPrompt);
    const safeRefined = refined ? sanitizeHtml(refined) : null;
    const safeThoughts = thoughts ? sanitizeHtml(thoughts) : null;

    this.debugEl.innerHTML = `
      <div class="metadata-glass">
        <div class="metadata-header">
          <span class="metadata-title">VISUAL_DIRECTOR_OUTPUT</span>
          <div class="metadata-badges">
            <span class="badge">${target.toUpperCase()}</span>
            <span class="badge">${aspect.toUpperCase()}</span>
          </div>
        </div>
        <div class="metadata-body">
          ${safeThoughts ? `<div class="metadata-thought">“${safeThoughts}”</div>` : ""}
          <div class="metadata-row">
            <span class="label">INTENT</span>
            <span class="value italic">${safeRaw}</span>
          </div>
          ${
            safeRefined
              ? `<div class="metadata-row">
            <span class="label">OUTPUT</span>
            <span class="value mono">${safeRefined}</span>
          </div>`
              : ""
          }
        </div>
      </div>
    `;
  },
};
