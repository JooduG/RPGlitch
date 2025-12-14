import { sanitizeHtml, downloadImage } from "./core-utils.js";
import { getVisualState } from "./entity-structs.js";
import { state } from "./app-state.js";
import { renderChat } from "./ui-chat-feed.js";

// --- STATE: Active Edits ---
const activeEdits = new Map(); // messageId -> { text: string }

// --- HELPER: Markdown Formatter ---
function formatMessageText(text) {
  if (!text) return "";

  // 1. Sanitize FIRST
  let safeText = sanitizeHtml(text);

  // 2. Bold (**text**) -> <b>**text**</b>
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<b>**$1**</b>");

  // 3. Italics (*text*) -> <i>*text*</i>
  safeText = safeText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>*$1*</i>");

  // 4. Line Breaks -> <br>
  safeText = safeText.replace(/\n/g, "<br>");

  return safeText;
}

// --- HELPER: Image Attachment ---
function renderImageAttachment(imageUrl, options) {
  const wrapper = document.createElement("div");
  wrapper.className = "image-wrapper";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Generated Image";
  img.className = "generated-image";
  img.loading = "lazy";

  wrapper.appendChild(img);
  return wrapper;
}

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
    div.className = "story-message system director-content";
    div.innerHTML = `<div class="physics-log">${sanitizeHtml(text || "")}</div>`;
    container.appendChild(div);
    return;
  }

  // Handle IMAGE Type
  if (type === "IMAGE") {
    div.className = "story-message system story-image-container";
    const imageContainer = renderImageAttachment(text, options);
    div.appendChild(imageContainer);
    container.appendChild(div);
    return;
  }

  const roleClass = role === "user" || role === "ai" ? role : "narrator";
  let classList = ["story-message", roleClass];

  let signatureColour = null;
  let visuals = null;

  if (role === "user" && entities?.userCharacter) {
    signatureColour = entities.userCharacter.signatureColour;
    visuals = getVisualState(entities.userCharacter);
  } else if (role === "ai" && entities?.aiCharacter) {
    signatureColour = entities.aiCharacter.signatureColour;
    visuals = getVisualState(entities.aiCharacter);
  }

  if (signatureColour && signatureColour !== "default") {
    classList.push(`signature-${signatureColour}`);
  }

  div.className = classList.join(" ");
  div.setAttribute("role", "log-item");
  div.setAttribute("data-type", type || "IC");

  if (visuals && visuals.flipped) {
    div.setAttribute("data-flipped", "true");
  }

  if (characterName) {
    div.setAttribute("data-character-name", characterName);
  }

  // --- Content Rendering ---

  if (activeEdits.has(options.messageId)) {
    div.classList.add("is-editing");

    const onSave = async (id, newText) => {
      if (window.StoryController) {
        if (role === "user") {
          await window.StoryController.editUserMessage(id, newText);
        } else if (role === "ai") {
          await window.StoryController.editAiMessage(id, newText);
        }
      }
    };

    const editUI = renderEditInterface(options.messageId, role, onSave);
    div.appendChild(editUI);
  } else {
    let contentHtml = "";

    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
    let thoughtContent = "";
    let mainContent = text;

    if (thinkMatch) {
      thoughtContent = thinkMatch[1].trim();
      mainContent = text.replace(thinkMatch[0], "").trim();
    }

    // Sanitize Meta-Leaks
    mainContent = mainContent.replace(/\*\*Step \d:.*?\*\*/gi, "");
    mainContent = mainContent.replace(/^Step \d:.*?$/gim, "");
    mainContent = mainContent.replace(/\n{3,}/g, "\n\n").trim();

    const formattedMain = formatMessageText(mainContent);
    const formattedThought = formatMessageText(thoughtContent);

    if (thoughtContent) {
      contentHtml = `<div class="thought-trace director-content"><div class="thought-label">INTERNAL MONOLOGUE</div>${formattedThought}</div><div class="message-content">${formattedMain}</div>`;
    } else {
      contentHtml = formattedMain;
    }

    div.innerHTML = contentHtml;

    if (options.attachmentUrl) {
      const imageContainer = renderImageAttachment(
        options.attachmentUrl,
        options,
      );
      div.appendChild(imageContainer);
    }

    // --- Message Actions (Hover) ---
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";

    // DEBUG: Trace why buttons disappear
    if (role === "ai" && options.isLast) {
      console.log("[RenderMessage] AI Last Message:", {
        id: options.messageId,
        hasAttachment: !!options.attachmentUrl,
        hasMetadata: !!options.metadata,
        visualPrompt: options.metadata?.visualPrompt,
      });
    }

    // [IMAGE ACTIONS] Download Button
    if (options.attachmentUrl) {
      const btnDownload = document.createElement("button");
      btnDownload.className = "ghost-icon-btn";
      btnDownload.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
      btnDownload.title = "Download Image";
      btnDownload.onclick = (e) => {
        e.stopPropagation();
        downloadImage(options.attachmentUrl, `rpglitch-${Date.now()}.png`);
      };
      actionsDiv.appendChild(btnDownload);
    }

    // [IMAGE ACTIONS] Reroll Image Button
    if (
      options.attachmentUrl &&
      options.metadata &&
      options.metadata.visualPrompt &&
      options.isLast &&
      role === "ai"
    ) {
      const btnRerollImg = document.createElement("button");
      btnRerollImg.className = "ghost-icon-btn";
      btnRerollImg.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
      btnRerollImg.title = "Reroll Image";
      btnRerollImg.onclick = (e) => {
        e.stopPropagation();
        if (window.StoryController && options.messageId) {
          window.StoryController.regenerateMessageImage(options.messageId);
        }
      };
      actionsDiv.appendChild(btnRerollImg);
    }

    // [TEXT ACTIONS]
    if (role === "ai" && options.isLast) {
      const btnReroll = document.createElement("button");
      btnReroll.className = "ghost-icon-btn";
      btnReroll.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`;
      btnReroll.title = "Reroll Message";
      btnReroll.onclick = () => {
        if (window.StoryController) window.StoryController.regenerate();
      };
      actionsDiv.appendChild(btnReroll);

      const btnEdit = document.createElement("button");
      btnEdit.className = "ghost-icon-btn";
      btnEdit.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
      btnEdit.title = "Edit Message";
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        startEditMode(options.messageId, text);
      };
      actionsDiv.appendChild(btnEdit);
    } else if (role === "user" && options.isLastUserMessage) {
      const btnEdit = document.createElement("button");
      btnEdit.className = "ghost-icon-btn";
      btnEdit.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
      btnEdit.title = "Edit Message";
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        startEditMode(options.messageId, text);
      };
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
