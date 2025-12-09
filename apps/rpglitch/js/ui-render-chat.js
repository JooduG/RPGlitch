import { state } from "./app-state.js";
import { getPictureHTML, sanitizeHtml } from "./core-utils.js";
import { entities } from "./entity-crud.js";
// [NEW] Import the visual helper
import { getVisualState } from "./entity-structs.js";

const selectedEntities = {
    aiCharacter: null,
    userCharacter: null,
    world: null,
};

export async function renderChat(storyId) {
    const feed = document.querySelector("#chat-feed");
    if (!feed) return;

    const msgs = state.messages.byStoryId[storyId] || [];
    const story = state.story.byId[storyId];

    if (!story) return;

    let [ai, user] = await Promise.all([
        entities.get("character", story.aiCharacterId),
        entities.get("character", story.userCharacterId)
    ]);

    feed.innerHTML = "";
    const noMsg = document.querySelector("#no-messages");

    if (msgs.length === 0) {
        if (noMsg) { noMsg.hidden = false; feed.appendChild(noMsg); }
        return;
    }

    if (noMsg) noMsg.hidden = true;

    const lastUserMsg = msgs.slice().reverse().find(m => m.role === "user");
    const lastUserMsgId = lastUserMsg ? lastUserMsg.id : null;

    msgs.forEach((m, index) => {
        const isLast = index === msgs.length - 1;
        const isLastUserMessage = m.id === lastUserMsgId;

        renderMessage(
            feed,
            m.role,
            m.text,
            m.characterName,
            m.type || "IC",
            { aiCharacter: ai, userCharacter: user },
            { isLast, messageId: m.id, isLastUserMessage }
        );
    });

    feed.scrollTop = feed.scrollHeight;
}

// --- STATE LISTENER ---
// Listen for changes to directorMode and toggle body class instantly.
document.addEventListener("state:changed", (e) => {
    if (e.detail.patch.settings && 'directorMode' in e.detail.patch.settings) {
        updateDirectorModeClass();
    }
});

// [NEW] Listen for visual updates (Flip) and re-render portraits instantly
window.addEventListener("entity-visual-update", async (e) => {
    const id = e.detail.id;
    // Check if the updated entity is currently on stage
    if (selectedEntities.aiCharacter?.id === id) {
        // Refresh the entity data from DB to get new visual state
        selectedEntities.aiCharacter = await entities.get("character", id);
        updatePortraits(selectedEntities.aiCharacter, selectedEntities.userCharacter);
    }
    else if (selectedEntities.userCharacter?.id === id) {
        selectedEntities.userCharacter = await entities.get("character", id);
        updatePortraits(selectedEntities.aiCharacter, selectedEntities.userCharacter);
    }
    else if (selectedEntities.world?.id === id) {
        selectedEntities.world = await entities.get("world", id);
        applyWorldAmbience(selectedEntities.world);
    }
});


function updateDirectorModeClass() {
    if (state.settings.directorMode) {
        document.body.classList.add("mode-director");
    } else {
        document.body.classList.remove("mode-director");
    }
}
// Run once on load to sync state
updateDirectorModeClass();


export function applyWorldAmbience(world) {
    // console.log("[RPGlitch] Applying World Ambience:", world ? world.name : "None");
    const colorMap = {
        pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
        orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
    };

    // 1. Colour Ambience (Existing)
    if (!world || !world.signatureColour) {
        document.documentElement.style.removeProperty('--world-ambience-rgb');
    } else {
        const rgb = colorMap[world.signatureColour] || colorMap.default;
        document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
    }

    // 2. Cinematic Background (New)
    const bgEl = document.getElementById("world-background");
    if (!bgEl) return;

    if (world && world.profilePictureUrl) {
        bgEl.style.backgroundImage = `url('${world.profilePictureUrl}')`;
        bgEl.style.backgroundColor = "transparent";
        bgEl.style.opacity = "1";

        // [NEW] Flip Support for World Background
        const visuals = getVisualState(world);
        bgEl.style.transform = visuals.flipped ? "scaleX(-1)" : "none";

    } else if (world) {
        // [FIX] Respect Placeholder Logic: Use signature color if no image
        const rgb = colorMap[world.signatureColour] || colorMap.default;
        bgEl.style.backgroundImage = "none";
        bgEl.style.backgroundColor = `rgba(${rgb}, 0.5)`; // Increased opacity for visibility
        bgEl.style.opacity = "1";
        bgEl.style.transform = "none";
    } else {
        bgEl.style.opacity = "0";
        // Clear after fade out
        setTimeout(() => {
            if (bgEl.style.opacity === "0") {
                bgEl.style.backgroundImage = "none";
                bgEl.style.backgroundColor = "transparent";
                bgEl.style.transform = "none";
            }
        }, 2000);
    }
}

export function setGameplayEntities(ai, user, world) {
    if (ai) selectedEntities.aiCharacter = ai;
    if (user) selectedEntities.userCharacter = user;
    if (world) selectedEntities.world = world;
}

export function updatePortraits(aiCharacter, userCharacter) {
    const setPort = (id, ent, label) => {
        const container = document.querySelector(id);
        if (!container) return;

        container.className = "character-portrait";
        if (ent && ent.signatureColour && ent.signatureColour !== "default") {
            container.classList.add(`signature-${ent.signatureColour}`);
        }

        const imgDiv = container.querySelector(".portrait-image");
        let nameDiv = container.querySelector(".character-name-overlay") || container.querySelector(".portrait-name");
        if (nameDiv) nameDiv.className = "character-name-overlay";

        if (imgDiv) {
            imgDiv.innerHTML = "";
            if (ent) {
                const isWorld = ent.type === 'world';
                const picture = getPictureHTML(ent, { cover: true, landscape: isWorld });
                if (picture) {
                    // [NEW] Visual Flip Logic
                    const visuals = getVisualState(ent);
                    if (visuals.flipped) {
                        const img = picture.querySelector("img");
                        // We use inline style here to ensure it works regardless of SCSS scope
                        if (img) img.style.transform = "scaleX(-1)";
                    }
                    imgDiv.appendChild(picture);
                }
            }
        }

        if (nameDiv) {
            nameDiv.innerHTML = `<h2>${ent?.name || label}</h2>`;
        }
    };
    setPort("#gameplay-ai-portrait", aiCharacter, "AI");
    setPort("#gameplay-user-portrait", userCharacter, "You");
}

export function setChatGeneratingState(isGenerating) {
    const feed = document.querySelector("#chat-feed");
    if (feed) {
        if (isGenerating) {
            feed.classList.add("generating");
        } else {
            feed.classList.remove("generating");
        }
    }
}

// [UPDATED] Lite Markdown Parser
function formatMessageText(text) {
    if (!text) return "";

    // 1. Sanitize FIRST
    let safeText = sanitizeHtml(text);

    // 2. Bold (**text**) -> <b>**text**</b> (Keeps asterisks visible)
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<b>**$1**</b>');

    // 3. Italics (*text*) -> <i>*text*</i> (Keeps asterisks visible)
    safeText = safeText.replace(/\*([^*]+)\*/g, '<i>*$1*</i>');

    // 4. Line Breaks -> <br>
    safeText = safeText.replace(/\n/g, '<br>');

    return safeText;
}

export function renderMessage(container, role, text, characterName, type, entities, options = {}) {
    const div = document.createElement("div");

    // Handle DEBUG / Physics Logs
    if (type === 'DEBUG') {
        div.className = "story-message system director-content";
        div.innerHTML = `<div class="physics-log">${sanitizeHtml(text || "")}</div>`;
        container.appendChild(div);
        return;
    }

    const roleClass = (role === "user" || role === "ai") ? role : "narrator";
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

    // [NEW] Data attribute for styling if we add avatars to chat later
    if (visuals && visuals.flipped) {
        div.setAttribute("data-flipped", "true");
    }

    if (characterName) {
        div.setAttribute("data-character-name", characterName);
    }

    // --- Content Rendering ---
    let contentHtml = "";

    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
    let thoughtContent = "";
    let mainContent = text;

    if (thinkMatch) {
        thoughtContent = thinkMatch[1].trim();
        mainContent = text.replace(thinkMatch[0], "").trim();
    }

    const formattedMain = formatMessageText(mainContent);
    const formattedThought = formatMessageText(thoughtContent);

    if (thoughtContent) {
        contentHtml = `<div class="thought-trace director-content"><div class="thought-label">INTERNAL MONOLOGUE</div>${formattedThought}</div><div class="message-content">${formattedMain}</div>`;
    } else {
        contentHtml = formattedMain;
    }

    div.innerHTML = contentHtml;

    // --- Message Actions (Hover) ---
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";

    if (role === "ai" && options.isLast) {
        // Reroll
        const btnReroll = document.createElement("button");
        btnReroll.className = "ghost-icon-btn";
        btnReroll.innerHTML = "🎲";
        btnReroll.title = "Reroll Message";
        btnReroll.onclick = () => {
            if (window.StoryController) window.StoryController.regenerate();
        };
        actionsDiv.appendChild(btnReroll);

        // Edit
        const btnEdit = document.createElement("button");
        btnEdit.className = "ghost-icon-btn";
        btnEdit.innerHTML = "✎";
        btnEdit.title = "Edit Message";
        btnEdit.onclick = () => toggleEditMode(div, text, role, options.messageId);
        actionsDiv.appendChild(btnEdit);
    } else if (role === "user" && options.isLastUserMessage) {
        // Edit User Message
        const btnEdit = document.createElement("button");
        btnEdit.className = "ghost-icon-btn";
        btnEdit.innerHTML = "✎";
        btnEdit.title = "Edit Message";
        btnEdit.onclick = () => toggleEditMode(div, text, role, options.messageId);
        actionsDiv.appendChild(btnEdit);
    }

    if (actionsDiv.hasChildNodes()) {
        div.appendChild(actionsDiv);
    }

    container.appendChild(div);
}

function toggleEditMode(messageElement, originalText, role, messageId) {
    if (messageElement.classList.contains("is-editing")) return;
    messageElement.classList.add("is-editing");

    const cleanText = originalText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    const editContainer = document.createElement("div");
    editContainer.className = "edit-container";

    const textarea = document.createElement("textarea");
    textarea.value = cleanText;
    textarea.className = "edit-textarea";

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

    messageElement.appendChild(editContainer);
    textarea.focus();

    btnCancel.onclick = () => {
        messageElement.classList.remove("is-editing");
        editContainer.remove();
    };

    btnSave.onclick = async () => {
        const newText = textarea.value.trim();
        if (!newText) return;

        if (window.StoryController) {
            if (role === "user") {
                await window.StoryController.editUserMessage(messageId, newText);
            } else if (role === "ai") {
                await window.StoryController.editAiMessage(messageId, newText);
            }
        }
        messageElement.classList.remove("is-editing");
        editContainer.remove();
    };
}

export function showTypingIndicator(container, type = 'ai', entityId = null) {
    removeTypingIndicator(container);

    const bubble = document.createElement("div");
    bubble.id = "active-typing-indicator";

    let signatureColour = null;
    if (type === 'ai' && selectedEntities.aiCharacter) {
        signatureColour = selectedEntities.aiCharacter.signatureColour;
    } else if (type === 'user' && selectedEntities.userCharacter) {
        signatureColour = selectedEntities.userCharacter.signatureColour;
    }

    let classes = ["story-message", "typing-bubble"];

    if (type === 'narrator' || type === 'system') {
        classes.push("narrator");
    } else {
        classes.push("ai");
    }

    if (signatureColour && signatureColour !== "default") {
        classes.push(`signature-${signatureColour}`);
    }

    bubble.className = classes.join(" ");

    bubble.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

export function removeTypingIndicator(container) {
    const existing = container.querySelector("#active-typing-indicator");
    if (existing) existing.remove();
}

export function setSendLock(isLocked) {
    const form = document.querySelector("#story-form");
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const input = form.querySelector('input[name="message"]');

    if (btn) {
        if (isLocked) {
            btn.disabled = true;
            btn.dataset.locked = "true";
            btn.classList.add("muted");
        } else {
            delete btn.dataset.locked;
            btn.classList.remove("muted");

            const hasText = input && input.value.trim().length > 0;
            btn.disabled = !hasText;
        }
    }

    if (!isLocked && input) {
        input.focus();
    }
}