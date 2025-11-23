// apps/rpglitch/js/story-controller.js
import { db } from "./db.js";
import { state, applyPatch } from "./store.js";
import { generateStream } from "./ai-service.js";
import { entities } from "./entities.js";
import { renderMessage, updatePortraits } from "./views.js";
import { error } from "./utils.js";
import { ContextBuilder } from "./context-builder.js";

// --- Controller API ---

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
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      
      // DEBUG: Log context payload (use console.log, no import needed)
      console.log("%c[ContextBuilder Payload]", "color: #00ffff; font-weight: bold;", payload);
      console.log("%c[System Prompt Preview]", "color: #00ffff;", payload.system);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({ payload, signal: ctrl.signal });

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "IC",
        text: response,
        characterName: (await entities.get("character", story.aiCharacterId))?.name,
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
    const story = state.story.byId[storyId];
    const typing = document.querySelector("#typing-indicator");
    if (typing) { typing.textContent = "Generating opening..."; typing.hidden = false; }

    try {
      const [world, ai] = await Promise.all([
        entities.get("world", story.worldId),
        entities.get("character", story.aiCharacterId)
      ]);

      const prompt = state.settings.openingPrompt || 
        `Generate a short, atmospheric opening scene for a story set in ${world.name}. The character is ${ai.name}. Focus on setting the mood.`;

      const text = await window.ai(prompt, { temperature: 0.8, max_tokens: 400 });

      await db.messages.add({ storyId, role: "narrator", type: "OOC", text, createdAt: Date.now() });
      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
    } finally {
      if (typing) typing.hidden = true;
    }
  }
};