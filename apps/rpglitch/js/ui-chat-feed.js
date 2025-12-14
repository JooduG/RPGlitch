import { state } from "./app-state.js";
import { entities } from "./entity-crud.js";
import { VirtualFeed } from "./utils-virtual-feed.js";
import { events, EVENTS } from "./core-events.js";
import { renderMessage } from "./ui-chat-message.js"; // Circular safe
import {
  updateDirectorModeClass,
  updatePortraits,
  applyFractalAmbience,
} from "./ui-chat-visuals.js";

// --- STATE ---
export const selectedEntities = {
  aiCharacter: null,
  userCharacter: null,
  fractal: null,
};

let virtualFeed = null;

// --- EXPORTED ACTIONS ---

export function setGameplayEntities(ai, user, fractal) {
  if (ai) selectedEntities.aiCharacter = ai;
  if (user) selectedEntities.userCharacter = user;
  if (fractal) selectedEntities.fractal = fractal;
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

export function setSendLock(isLocked, disableInput = false) {
  const form = document.querySelector("#story-form");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const input = form.querySelector('[name="message"]');

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

  if (input) {
    input.disabled = isLocked && disableInput;
    if (!isLocked) {
      input.focus();
    }
  }
}

// --- INDICATORS ---

export function showTypingIndicator(container, type = "ai", entityId = null) {
  if (virtualFeed && container.id === "chat-feed") {
    const bubble = document.createElement("div");
    bubble.id = "active-typing-indicator";

    let signatureColour = null;
    if (type === "ai" && selectedEntities.aiCharacter) {
      signatureColour = selectedEntities.aiCharacter.signatureColour;
    } else if (type === "user" && selectedEntities.userCharacter) {
      signatureColour = selectedEntities.userCharacter.signatureColour;
    }

    let classes = ["story-message", "typing-bubble"];

    if (type === "narrator" || type === "system") {
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

    virtualFeed.setFooter(bubble);
    return;
  }
}

export function removeTypingIndicator(container) {
  if (virtualFeed && container.id === "chat-feed") {
    virtualFeed.setFooter(null);
  }
  const existing = container.querySelector("#active-typing-indicator");
  if (existing) existing.remove();
}

// --- MAIN RENDERER ---

export async function renderChat(storyId) {
  const feed = document.querySelector("#chat-feed");
  if (!feed) return;

  // [FIX] Ensure Director Mode class is updated on every render/state change
  updateDirectorModeClass();

  if (!virtualFeed) {
    virtualFeed = new VirtualFeed(feed, (container, message, index) => {
      renderMessage(
        container,
        message.role,
        message.text,
        message.characterName,
        message.type || "IC",
        message._contextEntities,
        message._renderOptions,
      );
    });
  }

  const msgs = state.messages.byStoryId[storyId] || [];
  const story = state.story.byId[storyId];

  if (!story) return;

  let [ai, user] = await Promise.all([
    entities.get("character", story.aiCharacterId),
    entities.get("character", story.userCharacterId),
  ]);

  selectedEntities.aiCharacter = ai;
  selectedEntities.userCharacter = user;

  const noMsg = document.querySelector("#no-messages");

  if (msgs.length === 0) {
    if (noMsg) {
      noMsg.hidden = false;
      feed.appendChild(noMsg);
    }
    virtualFeed.setItems([]);
    return;
  }

  if (noMsg) noMsg.hidden = true;

  const lastUserMsg = msgs
    .slice()
    .reverse()
    .find((m) => m.role === "user");
  const lastUserMsgId = lastUserMsg ? lastUserMsg.id : null;

  const renderItems = msgs.map((m, index) => {
    const isLast = index === msgs.length - 1;
    const isLastUserMessage = m.id === lastUserMsgId;

    return {
      ...m,
      _contextEntities: { aiCharacter: ai, userCharacter: user },
      _renderOptions: {
        isLast,
        messageId: m.id,
        isLastUserMessage,
        attachmentUrl: m.attachmentUrl,
        metadata: m.metadata,
      },
    };
  });

  virtualFeed.setItems(renderItems);
}

// --- DEBUG HELPERS ---
window.injectTestImage = function (
  url = "https://via.placeholder.com/512x768",
) {
  const feed = document.querySelector("#chat-feed");
  if (!feed) return console.error("No chat feed found");

  renderMessage(
    feed,
    "ai",
    url,
    "Debug AI",
    "IMAGE",
    {},
    {
      isLast: true,
      messageId: "debug-" + Date.now(),
      metadata: { visualPrompt: "Debug Prompt", targetType: "ai" },
    },
  );
  console.log("Injected test image");
};

// --- LISTENERS ---

// Re-render on state changes involving messages
events.addEventListener(EVENTS.STATE_CHANGED, (e) => {
  if (state.story.activeId) renderChat(state.story.activeId);
});

events.addEventListener(EVENTS.DB_UPDATED, (e) => {
  if (e.detail.store === "messages" && state.story.activeId) {
    renderChat(state.story.activeId);
  }
});

events.addEventListener(EVENTS.STORY_LOADED, (e) => {
  if (state.story.activeId) renderChat(state.story.activeId);
});

// Update visuals dynamically
window.addEventListener("entity-visual-update", async (e) => {
  const id = e.detail.id;
  if (selectedEntities.aiCharacter?.id === id) {
    selectedEntities.aiCharacter = await entities.get("character", id);
    updatePortraits(
      selectedEntities.aiCharacter,
      selectedEntities.userCharacter,
    );
  } else if (selectedEntities.userCharacter?.id === id) {
    selectedEntities.userCharacter = await entities.get("character", id);
    updatePortraits(
      selectedEntities.aiCharacter,
      selectedEntities.userCharacter,
    );
  } else if (selectedEntities.fractal?.id === id) {
    selectedEntities.fractal = await entities.get("fractal", id);
    applyFractalAmbience(selectedEntities.fractal);
  }
});
