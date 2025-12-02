// apps/rpglitch/js/story-controller.js
import { db } from "./db.js";
import { state, applyPatch } from "./store.js";
import { generateStream } from "./ai-service.js";
import { entities } from "./entities.js";
import { renderMessage, updatePortraits } from "./views.js";
import { error } from "./utils.js"; // Removed 'log'
import { ContextBuilder } from "./context-builder.js";

export const StoryController = {
  requireActive: () => {
    if (!state.story.activeId) throw new Error("No active story.");
    return state.story.activeId;
  },

  createFromSelection: async (data) => {
    const id = await db.stories.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    applyPatch({ story: { activeId: id, byId: { [id]: data } } });
    return id;
  },

  load: async (storyId) => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) throw new Error("Story not found.");

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.storyTitle,
        mode: "gameplay"
      });

      await StoryController.loadMessages(story.id);

      const [ai, user] = await Promise.all([
        entities.get("character", story.aiCharacterId),
        entities.get("character", story.userCharacterId)
      ]);

      updatePortraits(ai, user);
      await StoryController.render(story.id);

      // Set ambient color based on World
      if (story.worldId) {
        const world = await entities.get("world", story.worldId);
        if (world && world.signatureColour) {
          const colorMap = {
            pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
            orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
          };
          const rgb = colorMap[world.signatureColour] || colorMap.default;
          document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
        }
      }

      document.body.classList.remove("mode-storyboard");
      document.body.classList.add("mode-gameplay");

    } catch (e) {
      error("Failed to load story:", e);
      alert("Could not load story.");
    }
  },

  loadMessages: async (storyId) => {
    const msgs = await db.messages.where("storyId").equals(storyId).sortBy("createdAt");
    applyPatch({ messages: { byStoryId: { [storyId]: msgs } } });
    return msgs;
  },

  render: async (storyId) => {
    const feed = document.querySelector("#chat-feed");
    if (!feed) return;

    const msgs = state.messages.byStoryId[storyId] || [];
    const story = state.story.byId[storyId];

    let [ai, user] = await Promise.all([
      story?.aiCharacterId ? entities.get("character", story.aiCharacterId) : null,
      story?.userCharacterId ? entities.get("character", story.userCharacterId) : null
    ]);

    feed.innerHTML = "";
    const noMsg = document.querySelector("#no-messages");

    if (msgs.length === 0) {
      if (noMsg) { noMsg.hidden = false; feed.appendChild(noMsg); }
      return;
    }

    if (noMsg) noMsg.hidden = true;

    // Render using view logic
    msgs.forEach(m => renderMessage(
      feed,
      m.role,
      m.text,
      m.characterName,
      m.type || "IC",
      { aiCharacter: ai, userCharacter: user }
    ));

    feed.scrollTop = feed.scrollHeight;
  },

  send: async (text) => {
    if (!text) return;
    const storyId = StoryController.requireActive();
    const story = state.story.byId[storyId];

    // 1. Save User Message
    await db.messages.add({
      storyId,
      role: "user",
      type: "IC",
      text,
      createdAt: Date.now()
    });

    await StoryController.loadMessages(storyId);
    await StoryController.render(storyId);

    const typing = document.querySelector("#typing-indicator");
    if (typing) typing.hidden = false;

    try {
      // 2. Build Prompt
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      // Log for debugging
      console.log("[RPGlitch] System Prompt:", payload.system);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      // 3. Generate Response
      const response = await generateStream({ payload, signal: ctrl.signal });

      // 4. Save AI Response
      // Note: We use 'ai' role now, not 'narrator', for active characters
      const aiChar = await entities.get("character", story.aiCharacterId);

      await db.messages.add({
        storyId,
        role: "ai", // Correct semantic role
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
      applyPatch({ ui: { fsm: "done" } });

    } catch (e) {
      error("AI Error", e);
      applyPatch({ ui: { fsm: "error", lastError: e.message } });
      alert("AI Error: " + e.message);
    } finally {
      if (typing) typing.hidden = true;
    }
  },

  generateOpening: async (storyId) => {
    // Removed unused 'story' variable
    const typing = document.querySelector("#typing-indicator");
    if (typing) { typing.textContent = "Generating opening..."; typing.hidden = false; }

    try {
      // Use the centralized builder for consistency
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildOpening();

      console.log("[RPGlitch] Opening Prompt:", payload.system);

      const response = await generateStream({ payload, signal: null });

      await db.messages.add({
        storyId,
        role: "narrator", // Openings are usually narration
        type: "OOC",
        text: response,
        createdAt: Date.now()
      });

      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
    } finally {
      if (typing) typing.hidden = true;
    }
  }
};