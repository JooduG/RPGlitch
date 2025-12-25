import { state } from "../../../core/state.js";
import { entities } from "../../../data/repo.js";
import { VirtualFeed } from "./virtual-feed.js";
import { events, EVENTS } from "../../../core/events.js";
import { renderMessage, getBubbleClass } from "./bubble.js"; // Circular safe
import { updatePortraits, applyFractalAmbience } from "../../image-gen-ui.js";
import { log } from "../../../core/utils.js";

// --- STATE ---
export const selectedEntities = {
  ai: null,
  user: null,
  fractal: null,
};

let virtualFeed = null;

// --- EXPORTED ACTIONS ---

export function setStorymodeEntities(ai, user, fractal) {
  if (ai) selectedEntities.ai = ai;
  if (user) selectedEntities.user = user;
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

export function showTypingIndicator(
  container,
  typeOrOptions = "ai",
  entityId = null,
) {
  if (virtualFeed && container.id === "chat-feed") {
    const bubble = document.createElement("div");
    bubble.id = "active-typing-indicator";

    let type = typeOrOptions;
    let explicitClass = null;

    if (typeof typeOrOptions === "object" && typeOrOptions !== null) {
      explicitClass = typeOrOptions.class;
      type = typeOrOptions.role || "ai"; // Fallback role if needed
    }

    let signatureColor = null;
    if (type === "ai" && selectedEntities.ai) {
      signatureColor = selectedEntities.ai.signatureColor;
    } else if (type === "user" && selectedEntities.user) {
      signatureColor = selectedEntities.user.signatureColor;
    } else if (type === "fractal" && selectedEntities.fractal) {
      signatureColor = selectedEntities.fractal.signatureColor;
    }

    // [ARCHITECT] Use shared classification logic or explicit class
    const modifier = explicitClass || getBubbleClass(type, selectedEntities);
    let classes = ["chat-bubble", "typing-bubble", modifier];

    if (signatureColor && signatureColor !== "default") {
      classes.push(`signature-${signatureColor}`);
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

  // [FIX] Enforce Developer Mode class on Body based on settings
  if (state.settings && state.settings.developerMode) {
    document.body.classList.add("mode-developer");
  } else {
    document.body.classList.remove("mode-developer");
  }

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
    entities.get("character", story.aiId),
    entities.get("character", story.userId),
  ]);

  selectedEntities.ai = ai;
  selectedEntities.user = user;

  // [NEW] Concluded State Locking
  const concludedBanner = document.querySelector("#story-concluded");
  const form = document.querySelector("#story-form");

  if (story.isConcluded) {
    if (concludedBanner) {
      concludedBanner.hidden = false;
    }

    // Hide Form if present
    if (form) {
      form.hidden = true;
      form.style.display = "none";
    }

    // [FIX] Inject Concluded Controls - Independent of Form
    const existingControls = document.querySelectorAll(".concluded-controls");

    // Only inject if not already present to prevent flickering/thrashing
    if (existingControls.length === 0) {
      const tpl = document.getElementById("tpl-concluded-controls");

      if (tpl) {
        const clone = tpl.content.cloneNode(true);
        document.body.appendChild(clone);
      }
    } else {
      // Ensure they are visible if hidden
      existingControls.forEach((el) => (el.hidden = false));
    }

    // Re-query to ensure we get the fresh element
    const controls = document.querySelector(".concluded-controls");
    if (controls) {
      // Bind Events
      const btnSettings = controls.querySelector("#btn-concluded-settings");
      const btnDelete = controls.querySelector("#btn-concluded-delete");
      const btnClose = controls.querySelector("#btn-concluded-close");

      if (btnSettings) {
        btnSettings.onclick = () => {
          // Proxy click to existing settings button to ensure init logic runs
          const placeholder = document.getElementById(
            "btn-settings-placeholder",
          );
          if (placeholder) placeholder.click();
        };
      }
      if (btnDelete) {
        btnDelete.onclick = async () => {
          const { showConfirm } = await import("../../orchestrator.js");
          if (await showConfirm("Delete Story?", "This cannot be undone.")) {
            const db = await import("../../../core/db.js").then((m) => m.db);
            await db.stories.delete(storyId);
            // Redirect to home/storyboard cleanly, stripping query params to avoid "ghost story" 404
            window.location.href = window.location.pathname;
          }
        };
      }
      if (btnClose) {
        btnClose.onclick = () => {
          controls.remove();
          window.location.hash = "";
          window.location.reload();
        };
      }
    }
  } else {
    // CLEANUP: Ensure controls are removed if we revived the story
    const controls = document.querySelector(".concluded-controls");
    if (controls) controls.remove();

    if (concludedBanner) concludedBanner.hidden = true;
    if (form) {
      form.hidden = false;
      form.style.display = "";
    }
    setSendLock(false);
  }

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
      _contextEntities: { ai: ai, user: user },
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
  log("Injected test image");
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
  if (selectedEntities.ai?.id === id) {
    selectedEntities.ai = await entities.get("character", id);
    updatePortraits(selectedEntities.ai, selectedEntities.user);
  } else if (selectedEntities.user?.id === id) {
    selectedEntities.user = await entities.get("character", id);
    updatePortraits(selectedEntities.ai, selectedEntities.user);
  } else if (selectedEntities.fractal?.id === id) {
    selectedEntities.fractal = await entities.get("fractal", id);
    applyFractalAmbience(selectedEntities.fractal);
  }
});
