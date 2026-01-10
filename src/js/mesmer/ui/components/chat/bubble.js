import { sanitizeHtml } from "../../../../gamemaster/utils.js";
import { createIconBtn } from "../../core/utils.js";
import { VisualManager } from "../visuals/manager.js";
import { store as state } from "../../../../gamemaster/index.js";
import { ThemeService } from "../../core/theme.js";
import { LightboxService } from "../../core/lightbox.js";
import { renderChat } from "./feed.js";
import { GameMaster } from "../../../../gamemaster/index.js";
import { voiceService } from "../../../audio/voice.js";

const activeEdits = new Map();
export const activeRerolls = new Set();
window.activeRerolls = activeRerolls;

// ICONS
const ICON_PLAY = `<svg class="icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const ICON_STOP = `<svg class="icon" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>`;

const formatMessageText = (text) => {
  if (!text) return "";
  let safeText = sanitizeHtml(text);
  safeText = safeText.replace(/\*\*\*(.*?)\*\*\*/g, "<b><i>$1</i></b>");
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  safeText = safeText.replace(/__([^_]+)__/g, "<b>$1</b>");
  safeText = safeText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>");
  safeText = safeText.replace(/(?<!_)_([^_]+)_(?!_)/g, "<i>$1</i>");
  safeText = safeText.replace(/\n/g, "<br>");
  return safeText;
};

const renderImageAttachment = (imageUrl, options) => {
  const wrapper = document.createElement("div");
  wrapper.className = "image-wrapper";

  if (options.messageId && window.activeRerolls?.has(options.messageId)) {
    wrapper.classList.add("rerolling");
    const overlay = document.createElement("div");
    overlay.className = "reroll-overlay";
    overlay.innerHTML = `<div class="reroll-spinner"></div>`;
    wrapper.appendChild(overlay);
  }

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Generated Image";
  img.className = "generated-image";
  img.loading = "eager"; // [INTERVENTION] Disable lazy loading for story moments
  img.decoding = "async";
  img.style.cursor = "zoom-in";
  img.onclick = (e) => {
    e.stopPropagation();
    LightboxService.open(imageUrl, {
      ...options,
      onReroll: () => {
        if (window.setRerollState) {
          window.setRerollState(options.messageId, true);
          if (wrapper) wrapper.classList.add("rerolling");
        }
      },
    });
  };

  // [VISUAL REFINEMENT] Dynamic Sizing Logic
  // 1. Messenger Check: If "Messenger" (entity-F4), keep default behavior (inside bubble).
  // 2. Cinematic Check: If NOT Messenger, apply explicit width classes based on aspect ratio.
  const isMessenger =
    options.entities?.fractal?.id === "entity-F4" ||
    (options.role === "fractal" &&
      options.entities?.fractal?.name === "Messenger"); // Fallback check

  if (!isMessenger) {
    img.onload = () => {
      const bubble = wrapper.closest(".chat-bubble");
      if (bubble) {
        // Reset specific alignment classes first
        bubble.classList.remove("is-portrait", "is-landscape");

        if (img.naturalWidth > img.naturalHeight) {
          bubble.classList.add("is-landscape");
        } else {
          bubble.classList.add("is-portrait");
        }
      }
    };
  }

  wrapper.appendChild(img);
  return wrapper;
};

export const setRerollState = (messageId, isActive) => {
  if (isActive) activeRerolls.add(messageId);
  else activeRerolls.delete(messageId);
};
window.setRerollState = setRerollState;

export const getBubbleClass = (role, entities) => {
  if (role === "user") return "chat-bubble--user";

  // Strict Fractal Detection (Type based)
  const isFractal =
    role === "fractal" ||
    role === "narrator" ||
    role === "system" ||
    entities?.ai?.type === "fractal";

  if (isFractal) return "chat-bubble--fractal";

  return "chat-bubble--character";
};

export const renderMessage = (
  container,
  role,
  text,
  characterName,
  type,
  entities,
  options = {},
) => {
  const div = document.createElement("div");

  if (type === "DEBUG") {
    const details = document.createElement("details");
    details.className = "debug-card developer-content";
    const debugTitle = options.metadata?.debugType || "DEBUG INFO";

    if (debugTitle === "PULSE HEARTBEAT") {
      details.classList.add("debug-card--pulse");
    }

    details.open = true; // [USER REQUEST] Expanded by default

    let contentHtml = sanitizeHtml((text || "").trim());

    // [POLISH] Rich Pulse Heartbeat
    if (debugTitle === "PULSE HEARTBEAT") {
      try {
        const data = JSON.parse(text);
        // Helper to render state (string or object)
        const renderState = (val) => {
          if (typeof val === "string") return sanitizeHtml(val);
          if (typeof val === "object" && val !== null) {
            return Object.entries(val)
              .map(
                ([k, v]) =>
                  `<div style="margin-top:0.25rem"><strong style="opacity:0.8">${sanitizeHtml(k)}:</strong> ${sanitizeHtml(v)}</div>`,
              )
              .join("");
          }
          return "";
        };

        contentHtml = `<div class="director-grid">${data.entity ? `<div class="director-row" style="border-left: 2px solid #a78bfa;"><div class="director-label" style="color:#a78bfa;">Target Entity</div><div class="director-value" style="font-weight:bold; color:#a78bfa;">${sanitizeHtml(data.entity)}</div></div>` : ""}${data.log_entry ? `<div class="director-row"><div class="director-label">Log Entry</div><div class="director-value">${sanitizeHtml(data.log_entry)}</div></div>` : ""}${data.dynamics ? `<div class="director-row"><div class="director-label">Dynamics</div><div class="director-value" style="display:flex; gap:1rem; flex-wrap:wrap;"><span>Entropy: ${data.dynamics.entropy}</span><span>Velocity: ${data.dynamics.velocity}</span><span>Resonance: ${data.dynamics.resonance}</span><span>Permeability: ${data.dynamics.permeability}</span></div></div>` : ""}${data.state?.physical ? `<div class="director-row"><div class="director-label">Physical</div><div class="director-value">${renderState(data.state.physical)}</div></div>` : ""}${data.state?.mental ? `<div class="director-row"><div class="director-label">Mental</div><div class="director-value">${renderState(data.state.mental)}</div></div>` : ""}${data.plot?.new_threads && data.plot.new_threads.length > 0 ? `<div class="director-row"><div class="director-label">New Threads</div><div class="director-value">${data.plot.new_threads.map((t) => `<div>• ${sanitizeHtml(t)}</div>`).join("")}</div></div>` : ""}${data.plot?.resolved_debug && data.plot.resolved_debug.length > 0 ? `<div class="director-row"><div class="director-label" style="color:#f87171;">Resolved</div><div class="director-value" style="color:#f87171; text-decoration: line-through; opacity: 0.8;">${data.plot.resolved_debug.map((t) => `<div>• ${sanitizeHtml(t)}</div>`).join("")}</div></div>` : ""}</div>`;
      } catch (e) {
        // Fallback to raw if parse fails
      }
    }

    details.innerHTML = `
      <summary class="debug-header">${debugTitle}</summary>
      <div class="debug-content">${contentHtml}</div>
    `;
    container.appendChild(details);
    return;
  }

  const bubbleModifier = getBubbleClass(role, entities);

  // [VISUAL REFINEMENT] Logic for "Inside Bubble" vs "Cinematic"
  // 1. Messenger: Inside Bubble (No special container class, inherits default chat-bubble styles)
  // 2. Others: Cinematic (story-image-container strips padding/bg)
  const isMessenger =
    entities?.fractal?.id === "entity-F4" ||
    (role === "fractal" && entities?.fractal?.name === "Messenger");

  if (type === "IMAGE") {
    const imgSrc =
      options.attachmentUrl ||
      (options.attachments && options.attachments[0]) ||
      text;

    const containerClass = isMessenger ? "" : "story-image-container";
    div.className = `chat-bubble ${bubbleModifier} ${containerClass}`;

    // Pass entities to allow Messenger detection
    const imageContainer = renderImageAttachment(imgSrc, {
      ...options,
      role,
      entities,
    });
    div.appendChild(imageContainer);
    container.appendChild(div);
    return;
  }

  let classList = ["chat-bubble", bubbleModifier];
  let signatureColor = null;
  let visuals = null;

  if (role === "user" && entities?.user) {
    signatureColor = entities.user.signatureColor;
    visuals = VisualManager.getVisualState(entities.user);
  } else if (role === "ai" && entities?.ai) {
    signatureColor = entities.ai.signatureColor;
    visuals = VisualManager.getVisualState(entities.ai);
  } else if (
    (role === "fractal" || bubbleModifier === "chat-bubble--fractal") &&
    entities?.fractal
  ) {
    signatureColor = entities.fractal.signatureColor;
  } else if (
    bubbleModifier === "chat-bubble--fractal" &&
    entities?.ai?.simulation
  ) {
    signatureColor = entities.ai.signatureColor;
  }

  div.className = classList.join(" ");
  div.setAttribute("role", "log-item");
  div.setAttribute("data-type", type || "IC");

  if (options.messageId) div.setAttribute("data-message-id", options.messageId);
  if (signatureColor && signatureColor !== "default")
    ThemeService.apply(div, signatureColor);
  if (visuals?.flipped) div.setAttribute("data-flipped", "true");
  if (characterName) div.setAttribute("data-character-name", characterName);
  if (options.isEpilogue) div.classList.add("is-epilogue");

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  let statusHtml = "";
  if (role === "user" && options.timestamp) {
    const statusText = options.isLast ? "Delivered" : "Read";
    statusHtml = `<div class="message-status"><span class="status-text">${statusText}</span></div>`;
  }

  const timeHtml = options.timestamp
    ? `<span class="message-time">${formatTime(options.timestamp)}</span>`
    : "";

  if (activeEdits.has(options.messageId)) {
    div.classList.add("is-editing");
    const onSave = async (id, newText) => {
      if (GameMaster) {
        if (role === "user") await GameMaster.editUserMessage(id, newText);
        else if (role === "ai") await GameMaster.editAiMessage(id, newText);
      }
    };
    div.appendChild(renderEditInterface(options.messageId, role, onSave));
  } else {
    let debugHtml = "";
    let cleanText = text;

    // [REMOVED] DEBUG METADATA block (Now in Lightbox)

    if (role === "ai") {
      const jsonMatch = cleanText.match(/\{[\s\S]*?"dynamics"[\s\S]*?\}/);
      if (jsonMatch) {
        debugHtml += `<details class="debug-card debug-card--hud developer-content"><summary class="debug-header">STATE DATA</summary><div class="debug-content">${sanitizeHtml(jsonMatch[0].trim())}</div></details>`;
        cleanText = cleanText.replace(jsonMatch[0], "");
      }

      cleanText = cleanText
        .replace(/<(?:image_prompt|image)(.*?)>/g, "{{IMGPROMPT$1}}")
        .replace(/<\/(?:image_prompt|image)>/g, "{{/IMGPROMPT}}");

      cleanText = cleanText.trim();
    }

    // [MODIFIED] Support both <think> and legacy [THOUGHTS]
    const thinkMatch = cleanText.match(
      /(?:<think>|\[THOUGHTS\])([\s\S]*?)(?:<\/think>|\[\/THOUGHTS\]|$)/i,
    );
    let mainContent = cleanText;
    let thoughtContent = "";

    if (thinkMatch) {
      thoughtContent = thinkMatch[1].trim();
      mainContent = cleanText.replace(thinkMatch[0], "").trim();
    }

    mainContent = mainContent
      .replace(/\*\*Step \d:.*?\*\*/gi, "")
      .replace(/^Step \d:.*?$/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    let formattedMain = formatMessageText(mainContent);
    const formattedThought = formatMessageText(thoughtContent);

    formattedMain = formattedMain
      // .replace(/\{\{IMGPROMPT\}\}/g, "") // Clean up unused marker if regex was weird
      .replace(/\{\{IMGPROMPT.*?\}\}[\s\S]*?\{\{\/IMGPROMPT\}\}/g, "")
      .replace(/\{\/IMGPROMPT\}\}/g, "");

    formattedMain = formattedMain.replace(/(!NOTE|Note:|Important:)\s*/g, "");

    const contentHtml = thoughtContent
      ? `<details class="debug-card debug-card--thought developer-content" open><summary class="debug-header">AI REASONING</summary><div class="debug-content">${formattedThought}</div></details><div class="message-content">${formattedMain}</div>`
      : formattedMain;

    div.innerHTML = contentHtml + timeHtml + statusHtml + debugHtml;

    /*
    // [TODO] Revive Gallery Mode if we support multiple attachments again.
    // Currently styled inline and unused.
    if (options.attachments && options.attachments.length > 0) {
      // [NEW] Gallery Mode
      const gallery = document.createElement("div");
      gallery.className = "image-gallery";

      // Basic Grid Styling (Inline for safety, but ideal in CSS)
      if (options.attachments.length > 1) {
        gallery.style.display = "grid";
        gallery.style.gap = "0.5rem";
        // 2 images = 2 cols, 3 images = 3 cols (or 2+1 layout)
        gallery.style.gridTemplateColumns = `repeat(${Math.min(options.attachments.length, 3)}, 1fr)`;
      } else {
        gallery.className = "image-wrapper"; // Fallback to single wrapper style if just 1
      }

      options.attachments.forEach((url, index) => {
        // Reuse renderImageAttachment logic but maybe simplified wrapper?
        // Actually, renderImageAttachment creates a wrapper. We might need to append wrappers to the gallery.
        const imgWrapper = renderImageAttachment(url, { ...options, index });
        gallery.appendChild(imgWrapper);
      });

      div.appendChild(gallery);
      div.appendChild(gallery);
    } else */ if (options.attachmentUrl && isMessenger) {
      // Messenger: Keep image INSIDE the bubble padding
      div.appendChild(
        renderImageAttachment(options.attachmentUrl, {
          ...options,
          role,
          entities,
        }),
      );
    } else if (options.metadata?.visualPrompt && role === "ai" && isMessenger) {
      // Messenger: Keep placeholder inside bubble
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.innerHTML = `<div class="loading-spinner"></div><span>Generating Visuals...</span>`;
      div.appendChild(placeholder);
    }

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";

    // [MODIFIED] Dynamic Read/Stop Button
    if (role !== "user") {
      let targetEntity = null;
      if (role === "ai") targetEntity = entities?.ai;
      else if (role === "fractal") targetEntity = entities?.fractal;

      const voiceId = targetEntity?.voiceId || null;
      const modifiers = {
        rate: targetEntity?.voiceRate || 1.0,
        pitch: targetEntity?.voicePitch || 1.0,
      };

      // Create the button using a container to allow easy icon swapping
      const readBtn = createIconBtn(
        ICON_PLAY,
        "Read Message",
        () => {
          // Click handler logic defined below to keep closure scope
        },
        "btn-action-read js-voice-control", // Add marker class
      );

      // --- Internal State Management for this Button ---
      const updateButtonState = (isSpeaking) => {
        if (isSpeaking) {
          readBtn.innerHTML = ICON_STOP; // Directly set if createIconBtn wraps it
          // Actually, createIconBtn in this repo usually returns a button with the SVG inside.
          // Let's be safe and just replace innerHTML for the whole button content if needed,
          // or target the .icon class.
          const iconEl = readBtn.querySelector(".icon");
          if (iconEl) iconEl.outerHTML = ICON_STOP;
          else readBtn.innerHTML = ICON_STOP;

          readBtn.title = "Stop Speaking";
          readBtn.onclick = (e) => {
            e.stopPropagation();
            voiceService.stop();
          };
          readBtn.classList.add("active-speaking");
        } else {
          const iconEl = readBtn.querySelector(".icon");
          if (iconEl) iconEl.outerHTML = ICON_PLAY;
          else readBtn.innerHTML = ICON_PLAY;

          readBtn.title = "Read Message";
          readBtn.onclick = (e) => {
            e.stopPropagation();
            voiceService.speak(mainContent, voiceId, modifiers);
          };
          readBtn.classList.remove("active-speaking");
        }
      };

      // Initial State
      updateButtonState(voiceService.isSpeaking);

      // Event Listener (Self-Managed)
      const safeHandler = (e) => {
        if (!div.isConnected) {
          document.removeEventListener("voice:state-change", safeHandler);
          return;
        }
        updateButtonState(e.detail.isSpeaking);
      };

      document.addEventListener("voice:state-change", safeHandler);

      actionsDiv.appendChild(readBtn);
    }

    if (role === "ai" && options.isLast) {
      actionsDiv.appendChild(
        createIconBtn(
          `<svg class="icon" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
          "Continue",
          () => GameMaster?.extendAiResponse(),
        ),
      );
      actionsDiv.appendChild(
        createIconBtn(
          `<svg class="icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
          "Reroll Message",
          () => {},
          "ghost-icon-btn btn-regenerate",
        ),
      );
      actionsDiv.appendChild(
        createIconBtn(
          `<svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
          "Edit Message",
          () => startEditMode(options.messageId, text),
        ),
      );
    } else if (role === "user" && options.isLastUserMessage) {
      actionsDiv.appendChild(
        createIconBtn(
          `<svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
          "Edit Message",
          () => startEditMode(options.messageId, text),
        ),
      );
    }

    if (actionsDiv.hasChildNodes()) div.appendChild(actionsDiv);
  }

  // 1. Append the main bubble (Text/Actions)
  container.appendChild(div);

  // 2. [VISUAL REFINEMENT] Split Rendering for Cinematic Attachments
  // If we have an image/placeholder and it's NOT Messenger, render it as a separate sibling
  if (!isMessenger) {
    const imgSrc =
      options.attachmentUrl || (options.attachments && options.attachments[0]);

    if (imgSrc) {
      const imageBubbleDiv = document.createElement("div");
      imageBubbleDiv.className = `chat-bubble ${bubbleModifier} story-image-container`;

      // Apply signature variables to the separate bubble
      if (signatureColor && signatureColor !== "default") {
        ThemeService.apply(imageBubbleDiv, signatureColor);
      }

      imageBubbleDiv.appendChild(
        renderImageAttachment(imgSrc, {
          ...options,
          role,
          entities,
        }),
      );
      container.appendChild(imageBubbleDiv);
    } else if (options.metadata?.visualPrompt && role === "ai") {
      // Separate Placeholder for Cinematic Generation
      const placeholderBubble = document.createElement("div");
      placeholderBubble.className = `chat-bubble ${bubbleModifier} story-image-container`;

      if (signatureColor && signatureColor !== "default") {
        ThemeService.apply(placeholderBubble, signatureColor);
      }

      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.innerHTML = `<div class="loading-spinner"></div><span>Generating Visuals...</span>`;
      placeholderBubble.appendChild(placeholder);
      container.appendChild(placeholderBubble);
    }
  }
};

export const startEditMode = (messageId, originalText) => {
  if (activeEdits.has(messageId)) return;
  const cleanText = originalText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
  activeEdits.set(messageId, { text: cleanText });
  if (state.story.activeId) renderChat(state.story.activeId);
};

const renderEditInterface = (messageId, role, onSaveCallback) => {
  const draft = activeEdits.get(messageId);
  const container = document.createElement("div");
  container.className = "edit-container";

  const textarea = document.createElement("textarea");
  textarea.value = draft?.text || "";
  textarea.className = "edit-textarea";
  textarea.oninput = (e) =>
    activeEdits.set(messageId, { ...draft, text: e.target.value });

  const controls = document.createElement("div");
  controls.className = "edit-controls";

  const btnSave = document.createElement("button");
  btnSave.className = "primary small";
  btnSave.textContent = "Save";

  const btnCancel = document.createElement("button");
  btnCancel.className = "secondary outline small";
  btnCancel.textContent = "Cancel";

  controls.appendChild(btnCancel);
  controls.appendChild(btnSave);
  container.appendChild(textarea);
  container.appendChild(controls);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  });

  btnCancel.onclick = (e) => {
    e.stopPropagation();
    activeEdits.delete(messageId);
    if (state.story.activeId) renderChat(state.story.activeId);
  };

  btnSave.onclick = async (e) => {
    e.stopPropagation();
    const newText = textarea.value.trim();
    if (newText && onSaveCallback) await onSaveCallback(messageId, newText);
    activeEdits.delete(messageId);
    if (state.story.activeId) renderChat(state.story.activeId);
  };

  return container;
};
