import { sanitizeHtml } from "../../../core/utils.js";
import { createIconBtn } from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { state } from "../../../core/state.js";
import { ThemeService } from "../../services/theme.js";
import { LightboxService } from "../../services/lightbox.js";
import { renderChat } from "./feed.js";
import { TurnManager } from "../../../engine/director.js";
import { voiceService } from "../../../services/voice-service.js";

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
  img.loading = "lazy";
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
  if (role === "fractal" || (role === "ai" && entities?.ai?.type === "fractal"))
    return "chat-bubble--fractal";
  if (role === "fractal" || role === "system" || !role)
    return "chat-bubble--fractal";
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
    div.className = "debug-card developer-content";
    const cleanDebugText = (text || "").replace(
      /\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g,
      "",
    );
    div.innerHTML = `<div class="debug-content">${sanitizeHtml(cleanDebugText.trim())}</div>`;
    container.appendChild(div);
    return;
  }

  const bubbleModifier = getBubbleClass(role, entities);

  if (type === "IMAGE") {
    div.className = `chat-bubble ${bubbleModifier} story-image-container`;
    const imageContainer = renderImageAttachment(text, { ...options, role });
    div.appendChild(imageContainer);
    container.appendChild(div);
    return;
  }

  let classList = ["chat-bubble", bubbleModifier];
  let signatureColor = null;
  let visuals = null;

  if (role === "user" && entities?.user) {
    signatureColor = entities.user.signatureColor;
    visuals = getVisualState(entities.user);
  } else if (role === "ai" && entities?.ai) {
    signatureColor = entities.ai.signatureColor;
    visuals = getVisualState(entities.ai);
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
      if (TurnManager) {
        if (role === "user") await TurnManager.editUserMessage(id, newText);
        else if (role === "ai") await TurnManager.editAiMessage(id, newText);
      }
    };
    div.appendChild(renderEditInterface(options.messageId, role, onSave));
  } else {
    let debugHtml = "";
    let cleanText = text;

    const excludedKeys = ["visualPrompt", "targetType", "refinedPrompt"];
    const debugMeta = options.metadata
      ? Object.fromEntries(
          Object.entries(options.metadata).filter(
            ([k]) => !excludedKeys.includes(k),
          ),
        )
      : {};

    if (Object.keys(debugMeta).length > 0) {
      const jsonStr = JSON.stringify(debugMeta, null, 2);
      debugHtml += `<div class="debug-card developer-content"><div class="debug-header">METADATA</div><div class="debug-content">${jsonStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></div>`;
    }

    if (role === "ai") {
      const hudMatch = cleanText.match(
        /\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/,
      );
      if (hudMatch) {
        debugHtml += `<div class="debug-card developer-content"><div class="debug-header">AI INTENT</div><div class="debug-content">${sanitizeHtml(hudMatch[1].trim())}</div></div>`;
        cleanText = cleanText.replace(hudMatch[0], "");
      }

      const jsonMatch = cleanText.match(/\{[\s\S]*?"dynamics"[\s\S]*?\}/);
      if (jsonMatch) {
        debugHtml += `<div class="debug-card debug-card--hud developer-content"><div class="debug-header">STATE DATA</div><div class="debug-content">${sanitizeHtml(jsonMatch[0].trim())}</div></div>`;
        cleanText = cleanText.replace(jsonMatch[0], "");
      }

      cleanText = cleanText
        .replace(/<(?:image_prompt|image)(.*?)>/g, "{{IMGPROMPT$1}}")
        .replace(/<\/(?:image_prompt|image)>/g, "{{/IMGPROMPT}}");

      const physMatches = cleanText.match(
        /<[a-zA-Z0-9]+\.[a-zA-Z0-9]+>.*?(?:\n|$)/g,
      );
      if (physMatches) {
        physMatches.forEach((match) => {
          debugHtml += `<div class="debug-card developer-content"><div class="debug-content"><strong>[PHYSIOLOGY]</strong>\n${sanitizeHtml(match.trim())}</div></div>`;
          cleanText = cleanText.replace(match, "");
        });
      }
      cleanText = cleanText.trim();
    }

    const thinkMatch = cleanText.match(/<think>([\s\S]*?)<\/think>/i);
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
      .replace(
        /\{\{IMGPROMPT.*?\}\}([\s\S]*?)\{\{\/IMGPROMPT\}\}/g,
        (match, content) => {
          // [REFINE] Rich Visual Director Card
          // If we have metadata, use it for a "Clean" display
          const meta = options.metadata || {};
          const rawPrompt = meta.visualPrompt || content; // Fallback to content if metadata missing
          const target = meta.targetType || "Unknown";
          const refined = meta.refinedPrompt;

          // Escape for safe HTML
          const safeRaw = sanitizeHtml(rawPrompt);
          const safeRefined = refined ? sanitizeHtml(refined) : null;

          return `
        <div class="debug-card debug-card--prompt developer-content">
          <div class="debug-header">
            <span>Visual Director</span>
            <span style="font-weight:normal; opacity:0.7">Target: ${target}</span>
          </div>
          <div class="debug-content">
            <div class="director-grid">
              <div class="director-row">
                <div class="director-label">Intent</div>
                <div class="director-value">${safeRaw}</div>
              </div>
              ${
                safeRefined
                  ? `
              <div class="director-row">
                <div class="director-label">Refined</div>
                <div class="director-value">${safeRefined}</div>
              </div>`
                  : ""
              }
            </div>
          </div>
        </div>`;
        },
      )
      .replace(/\{\{\/IMGPROMPT\}\}/g, "");

    formattedMain = formattedMain.replace(/(!NOTE|Note:|Important:)\s*/g, "");

    const contentHtml = thoughtContent
      ? `<div class="debug-card debug-card--thought developer-content"><div class="debug-header">AI REASONING</div><div class="debug-content">${formattedThought}</div></div><div class="message-content">${formattedMain}</div>`
      : formattedMain;

    div.innerHTML = contentHtml + timeHtml + statusHtml + debugHtml;

    if (options.attachmentUrl) {
      div.appendChild(
        renderImageAttachment(options.attachmentUrl, { ...options, role }),
      );
    } else if (options.metadata?.visualPrompt && role === "ai") {
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.innerHTML = `<div class="loading-spinner"></div><span>Generating Visual...</span>`;
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
          () => TurnManager?.extendAiResponse(),
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
  container.appendChild(div);
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
