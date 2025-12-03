// apps/rpglitch/js/ui-render-chat.js
import { state } from "./app-state.js"; // Removed applyPatch
import { getPictureHTML } from "./entity-structs.js"; // Assumed split (from entities.js)
import { sanitizeHtml } from "./core-utils.js"; // Removed escapeHtml

// Global scope for entity selection (needed by multiple view components)
const selectedEntities = {
    aiCharacter: null,
    userCharacter: null,
    world: null,
};

// --- AMBIENCE PURIFICATION (Moved from story-controller/storyboard-controller.js) ---
export function applyWorldAmbience(world) {
    if (!world || !world.signatureColour) {
        document.documentElement.style.removeProperty('--world-ambience-rgb');
        return;
    }

    // NOTE: This color map remains here temporarily until 'config.js' is built.
    const colorMap = {
        pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
        orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
    };
    const rgb = colorMap[world.signatureColour] || colorMap.default;
    document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
}

// Placeholder for entity selection helper (migrated from views.js)
export function setGameplayEntities(ai, user, world) {
    if (ai) selectedEntities.aiCharacter = ai;
    if (user) selectedEntities.userCharacter = user;
    if (world) selectedEntities.world = world;
}

// --- CORE RENDERING FUNCTIONS (MIGRATED & MODIFIED) ---

export function updatePortraits(aiCharacter, userCharacter) {
    // ... (existing portrait logic remains, imported from old views.js)
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

// --- RENDER MESSAGE (Chat Bubbles) - LOBOTOMY REVERSAL ---
export function renderMessage(container, role, text, characterName, type, entities) {
    const div = document.createElement("div");

    const roleClass = (role === "user" || role === "ai") ? role : "narrator";
    let classList = ["story-message", roleClass];

    // Determine signature color
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
    div.setAttribute("data-type", type || "IC"); // Will be 'DEBUG' for physics logs

    if (characterName) {
        div.setAttribute("data-character-name", characterName);
    }

    // === CONTENT PIPELINE ===

    // 1. STRIP THOUGHTS (MODIFIED: LOBOTOMY REVERSAL FOR DIRECTOR MODE)
    const isDirectorMode = state.settings.directorMode;

    // Regex to capture the content inside <think> and </think>
    let rawContent = text.replace(/<think>([\s\S]*?)<\/think>/gi, (match, p1) => {
        // 1. Sanitize the captured thought content (p1)
        const sanitizedThought = sanitizeHtml(p1).trim();

        // 2. Wrap the sanitized thought in the new structure
        // The 'thought-trace' class and 'hidden' attribute are handled by SCSS/JS toggle logic
        return `
          <div class="thought-trace" ${isDirectorMode ? '' : 'hidden'}>
              <strong>// AI Internal Monologue //</strong>
              <pre>${sanitizedThought}</pre>
          </div>
      `;
    }).trim();

    // 2. SANITIZE (Run Sanitization on the final content after thoughts are extracted/masked)
    let safeContent = sanitizeHtml(rawContent);

    // 3. LITE MARKDOWN (Preserving Asterisks)
    safeContent = safeContent.replace(/\*\*([^*]+)\*\*/g, '<strong>**$1**</strong>');
    safeContent = safeContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>*$1*</em>');

    // 4. NAME PREFIX
    if (characterName && roleClass === "user") {
        const safeName = sanitizeHtml(characterName);
        safeContent = `<span class="narrator-prefix">${safeName}:</span> ${safeContent}`;
    } else if (roleClass === "narrator" && characterName) {
        const safeName = sanitizeHtml(characterName);
        safeContent = `<span class="narrator-prefix">${safeName}:</span> ${safeContent}`;
    }

    div.innerHTML = safeContent;
    container.appendChild(div);
}

// --- TYPING INDICATOR / INPUT LOCK LOGIC (MIGRATED) ---
export function showTypingIndicator(container, type = 'ai', entityId = null) {
    // 1. Cleanup existing
    removeTypingIndicator(container);

    // 2. Create Bubble
    const bubble = document.createElement("div");
    bubble.id = "active-typing-indicator";

    // 3. Resolve Signature Color
    let signatureColour = null;
    if (type === 'ai' && selectedEntities.aiCharacter) {
        signatureColour = selectedEntities.aiCharacter.signatureColour;
    } else if (type === 'user' && selectedEntities.userCharacter) {
        signatureColour = selectedEntities.userCharacter.signatureColour;
    }

    // 4. Build Classes
    let classes = ["story-message", "typing-bubble"];

    if (type === 'narrator' || type === 'system') {
        classes.push("narrator");
    } else {
        classes.push("ai");
    }

    // Apply Signature Class
    if (signatureColour && signatureColour !== "default") {
        classes.push(`signature-${signatureColour}`);
    }

    bubble.className = classes.join(" ");

    // 5. Content
    // NOTE: This should ideally use the <template id="tpl-typing-indicator"> from index.html
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