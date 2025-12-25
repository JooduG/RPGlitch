import { sanitizeHtml } from "../../../core/utils.js";
import { createIconBtn } from "../../services/ui-utils.js";
import { getVisualState } from "../../../data/models.js";
import { state } from "../../../core/state.js";
import { ThemeService } from "../../services/theme.js";
import { LightboxService } from "../../services/lightbox.js";
import { renderChat } from "./feed.js";
import { TurnManager } from "../../../engine/director.js";

// --- STATE: Active Edits ---
const activeEdits = new Map(); // messageId -> { text: string }

// --- HELPER: Markdown Formatter ---
function formatMessageText(text) {
  if (!text) return "";

  // 1. Sanitize FIRST
  let safeText = sanitizeHtml(text);

  // 1.5. Bold Italic (***text***) -> <b><i>text</i></b>
  safeText = safeText.replace(/\*\*\*(.*?)\*\*\*/g, "<b><i>$1</i></b>");

  // 2. Bold (**text**) -> <b>text</b>
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  safeText = safeText.replace(/__([^_]+)__/g, "<b>$1</b>");

  // 3. Italics (*text*) -> <i>text</i>
  safeText = safeText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>");
  safeText = safeText.replace(/(?<!_)_([^_]+)_(?!_)/g, "<i>$1</i>");

  // 4. Line Breaks -> <br>
  safeText = safeText.replace(/\n/g, "<br>");

  return safeText;
}

// --- HELPER: Image Attachment ---
function renderImageAttachment(imageUrl, options) {
  const wrapper = document.createElement("div");
  wrapper.className = "image-wrapper";

  // Check Reroll State
  if (
    options.messageId &&
    window.setRerollState &&
    window.activeRerolls?.has(options.messageId)
  ) {
    wrapper.classList.add("rerolling");

    // Add Spinner Overlay
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

  // [NEW] Open Lightbox on Click
  img.style.cursor = "zoom-in";
  img.onclick = (e) => {
    e.stopPropagation();
    // Pass options with callback
    LightboxService.open(imageUrl, {
      ...options,
      onReroll: () => {
        if (window.setRerollState) {
          window.setRerollState(options.messageId, true);
          // Immediate DOM update
          if (wrapper) wrapper.classList.add("rerolling");
        }
      },
    });
  };

  wrapper.appendChild(img);
  return wrapper;
}

// --- STATE: Active Rerolls ---
export const activeRerolls = new Set();
window.activeRerolls = activeRerolls;

export function setRerollState(messageId, isActive) {
  if (isActive) {
    activeRerolls.add(messageId);
  } else {
    activeRerolls.delete(messageId);
  }
}
window.setRerollState = setRerollState;

// --- CORE: Render Message ---
export function renderMessage(
  container,
  role,
  text,
  characterName,
  type,
  entities,
  options = {},
) {
  const div = document.createElement("div");

  // Handle DEBUG / Physics Logs
  if (type === "DEBUG") {
    div.className = "debug-block developer-content";
    // [FIX] Strip the raw [STATUS_HUD] block, as we often have a formatted "PHYSICS UPDATE" below it
    const cleanDebugText = (text || "").replace(
      /\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g,
      "",
    );
    div.innerHTML = `<div class="physics-log">${sanitizeHtml(cleanDebugText.trim())}</div>`;
    container.appendChild(div);
    return;
  }

  // Handle IMAGE Type
  if (type === "IMAGE") {
    div.className = "story-message system story-image-container";
    const imageContainer = renderImageAttachment(text, { ...options, role });
    div.appendChild(imageContainer);
    container.appendChild(div);
    return;
  }

  const roleClass = role === "user" || role === "ai" ? role : "narrator";
  let classList = ["story-message", roleClass];

  // [MAESTRO] Fractal Divine Protocol
  // FIX: Detect 'Fractal' via simulation property, as type might be normalized to 'character'
  if (role === "ai" && entities?.ai?.simulation) {
    classList.push("chat-bubble--fractal");
  }

  let signatureColor = null;
  let visuals = null;

  if (role === "user" && entities?.user) {
    signatureColor = entities.user.signatureColor;
    visuals = getVisualState(entities.user);
  } else if (role === "ai" && entities?.ai) {
    signatureColor = entities.ai.signatureColor;
    visuals = getVisualState(entities.ai);
  }

  div.className = classList.join(" ");
  div.setAttribute("role", "log-item");
  div.setAttribute("data-type", type || "IC");

  // [FIX] Add message ID for DOM targeting (Reroll Feedback)
  if (options.messageId) {
    div.setAttribute("data-message-id", options.messageId);
  }

  if (signatureColor && signatureColor !== "default") {
    ThemeService.apply(div, signatureColor);
  }

  if (visuals && visuals.flipped) {
    div.setAttribute("data-flipped", "true");
  }

  if (characterName) {
    div.setAttribute("data-character-name", characterName);
  }

  // --- TIMESTAMP FORMATTER ---
  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // --- READ RECEIPT LOGIC ---
  let statusHtml = "";
  if (role === "user" && options.timestamp) {
    const statusText = options.isLast ? "Delivered" : "Read";
    statusHtml = `<div class="message-status">
      <span class="status-text">${statusText}</span>
    </div>`;
  }

  const timeHtml = options.timestamp
    ? `<span class="message-time">${formatTime(options.timestamp)}</span>`
    : "";

  // --- Content Rendering ---

  if (activeEdits.has(options.messageId)) {
    div.classList.add("is-editing");

    const onSave = async (id, newText) => {
      if (TurnManager) {
        if (role === "user") {
          await TurnManager.editUserMessage(id, newText);
        } else if (role === "ai") {
          await TurnManager.editAiMessage(id, newText);
        }
      }
    };

    const editUI = renderEditInterface(options.messageId, role, onSave);
    div.appendChild(editUI);
  } else {
    let contentHtml = "";

    // --- HUD EXTRACTOR (V5) ---
    // Remove the raw stats block from visible text.
    // We create a special debug container for it.
    let debugHtml = "";
    let cleanText = text;

    // [NEW] Parity: Inject Metadata Info (e.g. Token Counts)
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      const jsonStr = JSON.stringify(options.metadata, null, 2);
      debugHtml += `
          <div class="debug-block developer-content">
              <div class="physics-log"><strong>[METADATA]</strong>\n${jsonStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>`;
    }

    const promptMap = new Map();

    if (role === "ai") {
      // 1. Extract HUD
      const hudMatch = cleanText.match(
        /\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/,
      );
      if (hudMatch) {
        debugHtml += `
          <div class="debug-block developer-content">
              <div class="physics-log"><strong>[AI INTENT]</strong>\n${sanitizeHtml(hudMatch[1].trim())}</div>
          </div>`;
        cleanText = cleanText.replace(hudMatch[0], "");
      }

      // 2. Extract JSON (The "dynamics" block) -> [STATUS HUD]
      const jsonMatch = cleanText.match(/\{[\s\S]*?"dynamics"[\s\S]*?\}/);
      if (jsonMatch) {
        debugHtml += `
          <div class="debug-block developer-content status-hud">
              <div class="physics-log"><strong>[STATE DATA]</strong>\n${sanitizeHtml(jsonMatch[0].trim())}</div>
          </div>`;
        cleanText = cleanText.replace(jsonMatch[0], "");
      }

      // 2.5 Extract Image Prompt (X-Ray Vision)
      // [ROBUSTNESS FIX] Use placeholder strategy to survive DOMPurify/Markdown formatting
      const promptRegex = /<image_prompt[\s\S]*?>([\s\S]*?)<\/image_prompt>/g;

      let promptIdx = 0;

      cleanText = cleanText.replace(promptRegex, (match, content) => {
        const placeholder = `[[__IMAGE_PROMPT_${promptIdx}__]]`;
        promptMap.set(placeholder, content.trim());
        promptIdx++;
        return placeholder;
      });

      // 3. Extract Physiology Tags (e.g., <Orion.Biceps>)
      // Matches: <Name.Property> Value (until newline)
      const physMatches = cleanText.match(
        /<[a-zA-Z0-9]+\.[a-zA-Z0-9]+>.*?(?:\n|$)/g,
      );
      if (physMatches) {
        physMatches.forEach((match) => {
          debugHtml += `
            <div class="debug-block developer-content">
                <div class="physics-log"><strong>[PHYSIOLOGY]</strong>\n${sanitizeHtml(match.trim())}</div>
            </div>`;
          cleanText = cleanText.replace(match, "");
        });
      }

      cleanText = cleanText.trim();
    }

    const thinkMatch = cleanText.match(/<think>([\s\S]*?)<\/think>/i);
    let thoughtContent = "";
    let mainContent = cleanText;

    if (thinkMatch) {
      thoughtContent = thinkMatch[1].trim();
      mainContent = cleanText.replace(thinkMatch[0], "").trim();
    }

    // Sanitize Meta-Leaks
    mainContent = mainContent.replace(/\*\*Step \d:.*?\*\*/gi, "");
    mainContent = mainContent.replace(/^Step \d:.*?$/gim, "");
    mainContent = mainContent.replace(/\n{3,}/g, "\n\n").trim();

    let formattedMain = formatMessageText(mainContent);
    const formattedThought = formatMessageText(thoughtContent);

    // [ROBUSTNESS FIX] Restore Image Prompts after formatting
    if (promptMap.size > 0) {
      promptMap.forEach((content, placeholder) => {
        const debugBlock = `<div class="debug-console-output">
        <span class="debug-label">🎨 PROMPT:</span>
        <span class="debug-content">${sanitizeHtml(content)}</span>
     </div>`;
        // Replace placeholder (global replacement in case it appears multiple times, though unlikely for unique ID)
        formattedMain = formattedMain.split(placeholder).join(debugBlock);
      });
    }

    if (thoughtContent) {
      contentHtml = `<div class="thought-trace developer-content"><div class="thought-label">AI REASONING</div>${formattedThought}</div><div class="message-content">${formattedMain}</div>`;
    } else {
      contentHtml = formattedMain;
    }

    // Append the hidden Debug HUD (It will show only if .developer-mode is active via CSS)
    div.innerHTML = contentHtml + timeHtml + statusHtml + debugHtml;

    if (options.attachmentUrl) {
      const imageContainer = renderImageAttachment(options.attachmentUrl, {
        ...options,
        role,
      });
      div.appendChild(imageContainer);
    } else if (
      options.metadata &&
      options.metadata.visualPrompt &&
      role === "ai"
    ) {
      // [UX] PLACEHOLDER FOR GENERATING IMAGE
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Generating Visual...</span>
      `;
      div.appendChild(placeholder);
    }

    // --- Message Actions (Hover) ---
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";

    // --- Message Actions (Hover) ---
    // [MODIFIED] Image Actions moved to Lightbox
    // We only keep text actions here.

    // [MODIFIED] Image Actions moved to Lightbox
    // We only keep text actions here.

    // [TEXT ACTIONS]
    if (role === "ai" && options.isLast) {
      const btnContinue = createIconBtn(
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
        "Continue",
        () => {
          if (TurnManager) TurnManager.extendAiResponse();
        },
      );
      actionsDiv.appendChild(btnContinue);

      // --- FIX: REROLL LOGIC MOVED HERE ---
      // Replaced the 'orchestrator' call with direct Logic + Shift detection
      const btnReroll = createIconBtn(
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
        "Reroll Message",
        () => {}, // Handled globally by ui-handlers.js (capture phase)
        "ghost-icon-btn btn-regenerate",
      );
      actionsDiv.appendChild(btnReroll);

      const btnEdit = createIconBtn(
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        "Edit Message",
        (e) => {
          startEditMode(options.messageId, text);
        },
      );
      actionsDiv.appendChild(btnEdit);
    } else if (role === "user" && options.isLastUserMessage) {
      const btnEdit = createIconBtn(
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        "Edit Message",
        (e) => {
          startEditMode(options.messageId, text);
        },
      );
      actionsDiv.appendChild(btnEdit);
    }

    if (actionsDiv.hasChildNodes()) {
      div.appendChild(actionsDiv);
    }
  }

  container.appendChild(div);
}

// --- EDITING LOGIC ---

export function startEditMode(messageId, originalText) {
  if (activeEdits.has(messageId)) return;

  const cleanText = originalText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();

  activeEdits.set(messageId, { text: cleanText });
  if (state.story.activeId) renderChat(state.story.activeId);
}

function renderEditInterface(messageId, role, onSaveCallback) {
  const draft = activeEdits.get(messageId);
  const textValue = draft ? draft.text : "";

  const editContainer = document.createElement("div");
  editContainer.className = "edit-container";

  const textarea = document.createElement("textarea");
  textarea.value = textValue;
  textarea.className = "edit-textarea";

  textarea.oninput = (e) => {
    activeEdits.set(messageId, { ...draft, text: e.target.value });
  };

  const controlsDiv = document.createElement("div");
  controlsDiv.className = "edit-controls";

  const btnSave = document.createElement("button");
  btnSave.className = "primary small";
  btnSave.textContent = "Save";

  const btnCancel = document.createElement("button");
  btnCancel.className = "secondary outline small";
  btnCancel.textContent = "Cancel";

  controlsDiv.appendChild(btnCancel);
  controlsDiv.appendChild(btnSave);

  editContainer.appendChild(textarea);
  editContainer.appendChild(controlsDiv);

  requestAnimationFrame(() => {
    if (document.activeElement !== textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  });

  btnCancel.onclick = (e) => {
    e.stopPropagation();
    activeEdits.delete(messageId);
    if (state.story.activeId) renderChat(state.story.activeId);
  };

  btnSave.onclick = async (e) => {
    e.stopPropagation();
    const newText = textarea.value.trim();
    if (!newText) return;

    if (onSaveCallback) {
      await onSaveCallback(messageId, newText);
    }

    activeEdits.delete(messageId);
    if (state.story.activeId) renderChat(state.story.activeId);
  };

  return editContainer;
}
