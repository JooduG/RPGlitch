/**
 * LightboxService
 * Handles the full-screen display of generated images.
 */
import { downloadImage, createIconBtn } from "./utils.js";
import { GameMaster } from "../../../gamemaster/index.js";

const LIGHTBOX_ID = "lightbox-overlay";

export const LightboxService = {
  element: null,
  imageEl: null,
  actionsEl: null,

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

    // 4. Create Actions Container
    const actions = document.createElement("div");
    actions.className = "lightbox-actions";
    // Append actions TO content (Unified Card)
    content.appendChild(actions);

    // Append content to overlay
    overlay.appendChild(content);

    // 5. Append to Body
    document.body.appendChild(overlay);

    // 6. Bind Elements
    this.element = overlay;
    this.imageEl = img;
    this.actionsEl = actions;

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
    this._renderActions(imageUrl, context);
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

    // Append Download Last (Right)
    this.actionsEl.appendChild(btnDownload);
  },
};
