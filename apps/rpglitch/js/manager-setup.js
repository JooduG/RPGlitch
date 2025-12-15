// apps/rpglitch/js/manager-setup.js
import { state, applyPatch } from "./app-state.js";
import { entities } from "./entity-crud.js";
import { StoryController } from "./manager-turns.js";
import { updatePortraits, applyFractalAmbience } from "./ui-chat-visuals.js";
import { error } from "./core-utils.js";

// --- PURIFIED: Ambience logic is now handled by a dedicated helper function (assumed to be imported) ---

// MODIFIED: Exported for testing
export function generateDynamicTitle(ai, user, fractal) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const prefixes = [
    "The Story of",
    "The Adventures of",
    "The Tale of",
    "The Legend of",
    "The Saga of",
    "Chronicles of",
    "The Journey of",
  ];

  const chars = [ai, user].filter(Boolean);
  const hasFractal = !!fractal;
  const totalChars = chars.length;

  const prefix = pick(prefixes);
  let content = "";

  if (totalChars === 2 && hasFractal) {
    content = `${chars[0].name} & ${chars[1].name} in ${fractal.name}`;
  } else if (totalChars === 2 && !hasFractal) {
    content = `${chars[0].name} & ${chars[1].name}`;
  } else if (totalChars === 1 && hasFractal) {
    content = `${chars[0].name} in ${fractal.name}`;
  } else if (totalChars === 1 && !hasFractal) {
    content = chars[0].name;
  } else if (totalChars === 0 && hasFractal) {
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

// --- CONTROLLER ACTIONS ---

async function handleBeginStory() {
  const { selectedAI, selectedUser, selectedFractal, storyTitle } = state;
  if (!selectedAI || !selectedUser || !selectedFractal)
    return alert("Please select all entities.");

  try {
    const id = await StoryController.createFromSelection({
      storyTitle,
      aiCharacterId: selectedAI.id,
      userCharacterId: selectedUser.id,
      fractalId: selectedFractal.id,
    });

    document.body.classList.remove("mode-storyboard");
    document.body.classList.add("mode-gameplay");
    applyPatch({ mode: "gameplay" });

    updatePortraits(selectedAI, selectedUser);

    // [PERF] Yield to main thread to allow UI repaint (Switch to Gameplay Mode) before heavy AI call
    await new Promise((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );

    await StoryController.generateOpening(id);

    // CRITICAL FIX: Force load to switch UI to Snapshots
    await StoryController.load(id);
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
  const titleGameplay = document.querySelector("#title-gameplay");
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

    if (!state.isCustomTitle && titleStoryboard && titleGameplay) {
      const newTitle = generateDynamicTitle(
        aiCharacter,
        userCharacter,
        fractal,
      );
      titleStoryboard.textContent = newTitle;
      titleGameplay.textContent = newTitle;
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
      if (titleGameplay) titleGameplay.textContent = val;
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
      if (titleGameplay) titleGameplay.textContent = newTitle;

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
export const StoryboardController = SetupManager;
