// apps/rpglitch/js/ui-render-chat.js
import { state } from "./app-state.js";
import { getPictureHTML } from "./entity-structs.js";

const selectedEntities = {
    aiCharacter: null,
    userCharacter: null,
    world: null,
};

export function applyWorldAmbience(world) {
    if (!world || !world.signatureColour) {
        document.documentElement.style.removeProperty('--world-ambience-rgb');
        return;
    }
    const colorMap = {
        pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
        orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
    };
    const rgb = colorMap[world.signatureColour] || colorMap.default;
    document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
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
                if (picture) imgDiv.appendChild(picture);
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

export function renderMessage(container, role, text, characterName, type, entities, options = {}) {
    const div = document.createElement("div");

    const roleClass = (role === "user" || role === "ai") ? role : "narrator";
    let classList = ["story-message", roleClass];

    let signatureColour = null;
    if (role === "user" && entities?.userCharacter?.signatureColour) {
        signatureColour = entities.userCharacter.signatureColour;
    } else if (role === "ai" && entities?.aiCharacter?.signatureColour) {
        signatureColour = entities.aiCharacter.signatureColour;
    }

    if (signatureColour && signatureColour !== "default") {
        classList.push(`signature-${signatureColour}`);
    }

    div.className = classList.join(" ");
    div.setAttribute("role", "log-item");
    div.setAttribute("data-type", type || "IC");

    if (characterName) {
        div.setAttribute("data-character-name", characterName);
    }

    // --- Content Rendering ---
    let contentHtml = "";

    // Director's Mode: Handle <think> tags
    if (state.settings.directorMode) {
        // Replace <think> with styled div
        contentHtml = text.replace(/<think>([\s\S]*?)<\/think>/gi,
            '<div class="thought-trace"><div class="thought-label">INTERNAL MONOLOGUE</div>$1</div>'
        );
    } else {
        // Remove <think> blocks entirely
        contentHtml = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
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
        btnEdit.className = "ghost-icon-btn"; // Use ghost style
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

    // Purge thoughts for editing
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