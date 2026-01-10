import {
  events,
  EVENTS,
  store as state,
} from "../../../../gamemaster/index.js";
import { entities } from "../../../../scholar/repository.js";
import { VirtualFeed } from "./virtual-feed.js";
import { renderMessage, getBubbleClass } from "./bubble.js"; // Circular safe
import { updatePortraits, applyFractalAmbience } from "../visuals/generator.js";
import { ThemeService } from "../../core/theme.js";
import { log } from "../../../../gamemaster/utils.js";

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
  // [DEPRECATED] State is now managed centrally in input.js via events.
  // Keeping function signature to prevent crashes if called elsewhere.
  /*
  const form = document.querySelector("#story-form");
  if (!form) return;
  // ... Legacy code removed to prevent conflicts ...
  */
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

    // [ARCHITECT] Refined Role & Color Resolution
    let resolvedRole = type;
    let signatureColor = null;

    if (type === "ai") {
      const ai = selectedEntities.ai;
      if (ai) {
        signatureColor = ai.signatureColor;
        // [ARCHITECT] Only shift to fractal role IF we don't have an explicit character role
        if (ai.type === "fractal" && !typeOrOptions.role) {
          resolvedRole = "fractal";
        }
      }
    } else if (type === "user") {
      signatureColor = selectedEntities.user?.signatureColor;
    } else if (type === "fractal") {
      signatureColor = selectedEntities.fractal?.signatureColor || "pink";
    }

    // Explicit Overrides
    if (typeof typeOrOptions === "object") {
      if (typeOrOptions.role) resolvedRole = typeOrOptions.role;
      if (typeOrOptions.signatureColor)
        signatureColor = typeOrOptions.signatureColor;
    }

    let modifier =
      explicitClass || getBubbleClass(resolvedRole, selectedEntities);

    // Final Class Composition
    let classes = ["chat-bubble", "typing-bubble", modifier];

    if (signatureColor && signatureColor !== "default") {
      classes.push(`signature-${signatureColor}`);
      ThemeService.apply(bubble, signatureColor);
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

  // Enforce Developer Mode class on Body based on settings
  if (state.settings && state.settings.developerMode) {
    document.body.classList.add("mode-developer");
  } else {
    document.body.classList.remove("mode-developer");
  }

  if (!virtualFeed) {
    virtualFeed = new VirtualFeed(
      feed,
      (container, message, index) => {
        renderMessage(
          container,
          message.role,
          message.text,
          message.characterName,
          message.type || "IC",
          message._contextEntities,
          {
            ...message._renderOptions,
            isEpilogue: message.isEpilogue,
            metadata: message.metadata,
          },
        );
      },
      {
        // ⚡ BOLT OPTIMIZATION: Custom Cache Logic
        // Decouples VirtualFeed from item structure
        getItemCacheKey: (item) => {
          const opts = item._renderOptions || {};
          const ctx = item._contextEntities || {};
          // Construct a unique string key for the visual state
          // Using JSON.stringify ensures robust key generation avoiding separator collisions
          return JSON.stringify([
            item.id,
            item.text,
            item.role || "",
            opts.isLast ? "1" : "0",
            ctx.ai?.id || "",
            ctx.user?.id || "",
            ctx.fractal?.id || "",
          ]);
        },
      },
    );
  }

  const msgs = state.messages.byStoryId[storyId] || [];
  const story = state.story.byId[storyId];

  if (!story) return;

  let [ai, user, fractal] = await Promise.all([
    entities.get("character", story.aiId),
    entities.get("character", story.userId),
    entities.get("fractal", story.fractalId),
  ]);

  selectedEntities.ai = ai;
  selectedEntities.user = user;
  selectedEntities.fractal = fractal;

  // [NEW] Epilogue State Locking
  const epilogueBanner = document.querySelector("#story-epilogue-banner");
  const form = document.querySelector("#story-form");

  // Clean up old banners if any
  if (epilogueBanner) epilogueBanner.hidden = true;

  if (story.isConcluded) {
    if (epilogueBanner) {
      epilogueBanner.hidden = true; // FORCE HIDE (User request)
      epilogueBanner.remove(); // DESTROY
    }

    // Hide Form if present
    if (form) {
      form.hidden = true;
      form.style.display = "none";
    }

    // Inject Epilogue Controls - Independent of Form
    const cleanupSelectors = [".concluded-controls", ".epilogue-controls"];
    cleanupSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove());
    });

    const tpl = document.getElementById("tpl-epilogue-controls");

    if (tpl) {
      const clone = tpl.content.cloneNode(true);
      // [FIX] Inject into the MAIN story container so it hides when switching views
      // Must use #stage-center to avoid injecting into sidebars (which clip content)
      const container = document.querySelector(
        "#stage-center .stage-content--storymode",
      );
      if (container) container.appendChild(clone);
    }

    // Re-query to ensure we get the fresh element
    const controls = document.querySelector(".epilogue-controls");
    if (!controls) return;

    // bind events
    if (controls) {
      const btnSettings = controls.querySelector("#btn-epilogue-nav-settings");
      const btnDelete = controls.querySelector("#btn-epilogue-nav-delete");
      const btnClose = controls.querySelector("#btn-epilogue-nav-close");

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
          const { showConfirm } = await import("../../core/orchestrator.js");
          if (await showConfirm("Delete Story?", "This cannot be undone.")) {
            const db = await import("../../../../scholar/db.js").then(
              (m) => m.db,
            );
            await db.stories.delete(storyId);
            // Redirect to home/storyboard cleanly, stripping query params to avoid "ghost story" 404
            window.location.href = window.location.pathname;
          }
        };
      }
      if (btnClose) {
        btnClose.onclick = async () => {
          // Clear active story so we boot into a fresh storyboard
          const db = await import("../../../../scholar/db.js").then(
            (m) => m.db,
          );
          await db.settings.put({ id: "active_story", value: null });

          controls.remove();
          window.location.hash = "";
          window.location.reload();
        };
      }
    }
  } else {
    // CLEANUP: Ensure controls are removed if we revived the story
    const controls = document.querySelector(".epilogue-controls");
    if (controls) controls.remove();

    if (epilogueBanner) epilogueBanner.hidden = true;
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
      _contextEntities: { ai: ai, user: user, fractal: fractal },
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
