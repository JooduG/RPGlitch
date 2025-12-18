// apps/rpglitch/js/manager-setup.js
import { state, applyPatch } from "../core/state.js";
import { entities } from "../data/repo.js";
import { TurnManager } from "../engine/director.js";
import { updatePortraits, applyFractalAmbience } from "./image-gen-ui.js";
import { error } from "../core/utils.js";

// MODIFIED: Exported for testing
// MODIFIED: Exported for testing
export function generateDynamicTitle(ai, user, fractal) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Detect Vibe (Tech/App vs. Epic/Fantasy)
  // [SCALABLE] Checks 'cssTheme' trait, not specific entity names.
  // Any "theme-smartphone" fractal will trigger Tech Titles (e.g. "Terminal", "Datapad").
  const isTechVibe = fractal?.simulation?.cssTheme === "theme-smartphone";

  // 2. Define Prefix Pools
  const epicPrefixes = [
    "The Story of",
    "The Adventures of",
    "The Tale of",
    "The Legend of",
    "The Saga of",
    "Chronicles of",
    "The Journey of",
  ];

  const techPrefixes = [
    "Chat Log:",
    "Session:",
    "Messenger.exe:",
    "New Thread:",
    "Encrypted Feed:",
    "Connection:",
    "Archive:",
    "RELAY //",
  ];

  const chars = [ai, user].filter(Boolean);
  const totalChars = chars.length;

  // 3. Construct Content
  let content = "";
  const names = chars.map((c) => c.name).join(" & ");

  if (isTechVibe) {
    // Tech Vibe: "Chat Log: Glitch & Orion" (No "in Messenger")
    const prefix = pick(techPrefixes);
    if (totalChars > 0) {
      return `${prefix} ${names}`;
    } else {
      return `${prefix} Guest User`;
    }
  } else {
    // Epic Vibe: "The Saga of Glitch & Orion in Nova City"
    const prefix = pick(epicPrefixes);
    const hasFractal = !!fractal;

    if (totalChars > 0 && hasFractal) {
      content = `${names} in ${fractal.name}`;
    } else if (totalChars > 0 && !hasFractal) {
      content = names;
    } else if (totalChars === 0 && hasFractal) {
      // Empty state
      const fractalPrefixes = [
        "Adventures in",
        "Tales from",
        "The World of",
        "Journey to",
      ];
      return `${pick(fractalPrefixes)} ${fractal.name}`;
    } else {
      return "My New Story";
    }

    return `${prefix} ${content}`;
  }
}

// --- CONTROLLER ACTIONS ---

async function handleBeginStory() {
  const { selectedAI, selectedUser, selectedFractal, storyTitle } = state;
  if (!selectedAI || !selectedUser || !selectedFractal)
    return alert("Please select all entities.");

  try {
    const id = await TurnManager.createFromSelection({
      storyTitle,
      aiId: selectedAI.id,
      userId: selectedUser.id,
      fractalId: selectedFractal.id,
    });

    document.body.classList.remove("mode-storyboard");
    document.body.classList.add("storymode");
    applyPatch({ mode: "storymode" });

    updatePortraits(selectedAI, selectedUser);

    // [PERF] Yield to main thread to allow UI repaint (Switch to StoryMode) before heavy AI call
    await new Promise((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );

    await TurnManager.generateOpening(id);

    // CRITICAL FIX: Force load to switch UI to Snapshots
    await TurnManager.load(id);
  } catch (e) {
    error("Begin Story Failed", e);
    alert("Could not start story.");
  }
}

async function handleShuffle(views) {
  try {
    const chars = await entities.list("character");
    const fractals = await entities.list("fractal");

    if (chars.length < 1) {
      console.warn("Not enough characters to shuffle");
      return;
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const ai = pick(chars);
    let user = pick(chars);

    if (chars.length > 1) {
      while (user.id === ai.id) {
        user = pick(chars);
      }
    }

    const fractal = fractals.length > 0 ? pick(fractals) : null;
    views.updateStoryboardSelection({
      aiCharacter: ai,
      userCharacter: user,
      fractal: fractal,
    });
  } catch (e) {
    error("Shuffle failed:", e);
  }
}

export const SetupManager = {
  startStory: handleBeginStory,
  shuffle: handleShuffle,
};

// --- INIT LOGIC ---
export function initStoryboardStage(views) {
  const titleStoryboard = document.querySelector("#title-storyboard");
  const titleStorymode = document.querySelector("#title-storymode");
  const beginBtn = document.querySelector("#begin-story");
  const shuffleBtn = document.querySelector("#btn-shuffle");

  views.setOnSelectionChanged((sel) => {
    const { aiCharacter, userCharacter, fractal } = sel;
    applyPatch({
      selectedAI: aiCharacter,
      selectedUser: userCharacter,
      selectedFractal: fractal,
    });

    // --- PURIFIED: Ambience logic now uses a helper function ---
    if (fractal) applyFractalAmbience(fractal);

    if (!state.isCustomTitle && titleStoryboard && titleStorymode) {
      const newTitle = generateDynamicTitle(
        aiCharacter,
        userCharacter,
        fractal,
      );
      titleStoryboard.textContent = newTitle;
      titleStorymode.textContent = newTitle;
      applyPatch({ storyTitle: newTitle });
    }

    const ready = aiCharacter && userCharacter && fractal;
    if (beginBtn) {
      beginBtn.disabled = !ready;
      beginBtn.classList.toggle("disabled", !ready);
    }
  });

  if (titleStoryboard) {
    titleStoryboard.setAttribute("contenteditable", "true");
    titleStoryboard.title = "Double-click to re-roll title";

    const handleInput = (e) => {
      const val = e.target.textContent.trim();
      if (titleStorymode) titleStorymode.textContent = val;
      applyPatch({ isCustomTitle: true, storyTitle: val });
    };

    const handleReset = () => {
      const { selectedAI, selectedUser, selectedFractal } = state;
      const newTitle = generateDynamicTitle(
        selectedAI,
        selectedUser,
        selectedFractal,
      );

      titleStoryboard.textContent = newTitle;
      if (titleStorymode) titleStorymode.textContent = newTitle;

      applyPatch({ isCustomTitle: false, storyTitle: newTitle });
    };

    titleStoryboard.addEventListener("input", handleInput);
    titleStoryboard.addEventListener("dblclick", handleReset);
  }

  if (beginBtn) {
    beginBtn.removeEventListener("click", handleBeginStory);
    beginBtn.addEventListener("click", handleBeginStory);
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleShuffle(views);
    });
  }
}
// Renaming for the new manager structure
// export const StoryboardController = SetupManager; // Removed legacy alias
