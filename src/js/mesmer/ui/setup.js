// apps/rpglitch/js/ui/setup.js
import {
  events,
  EVENTS,
  store as state,
  applyPatch,
} from "../../gamemaster/index.js";
import { entities } from "../../scholar/repository.js";
import { GameMaster } from "../../gamemaster/index.js";
import {
  updatePortraits,
  applyFractalAmbience,
  updateDeveloperModeClass,
} from "./image-gen-ui.js";
import { error } from "../../gamemaster/utils.js";
import { showAlert } from "./orchestrator.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateDynamicTitle = (ai, user, fractal) => {
  const isTechVibe = fractal?.simulation?.cssTheme === "theme-smartphone";

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
  const names = chars.map((c) => c.name).join(" & ");

  if (isTechVibe) {
    const prefix = pick(techPrefixes);
    return totalChars > 0 ? `${prefix} ${names}` : `${prefix} Guest User`;
  }

  const prefix = pick(epicPrefixes);
  const hasFractal = !!fractal;

  if (totalChars > 0 && hasFractal)
    return `${prefix} ${names} in ${fractal.name}`;
  if (totalChars > 0) return `${prefix} ${names}`;
  if (hasFractal) {
    const fractalPrefixes = [
      "Adventures in",
      "Tales from",
      "The World of",
      "Journey to",
    ];
    return `${pick(fractalPrefixes)} ${fractal.name}`;
  }
  return "My New Story";
};

const handleBeginStory = async () => {
  // [FIX] Race Condition Hardening
  // Sometimes button enables before state propagation completes.
  let { selectedAI, selectedUser, selectedFractal, storyTitle } = state;

  if (!selectedAI || !selectedUser || !selectedFractal) {
    // Wait briefly for any pending updates
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Re-read state
    ({ selectedAI, selectedUser, selectedFractal, storyTitle } = state);
  }

  if (!selectedAI || !selectedUser || !selectedFractal) {
    return showAlert("Selection Incomplete", "Please select all entities.");
  }

  // Prevent double-clicks
  const beginBtn = document.querySelector("#begin-story");
  if (beginBtn) beginBtn.disabled = true;

  try {
    const id = await GameMaster.createFromSelection({
      storyTitle,
      aiId: selectedAI.id,
      userId: selectedUser.id,
      fractalId: selectedFractal.id,
    });

    applyPatch({ mode: "storymode" });

    updatePortraits(selectedAI, selectedUser);

    await new Promise((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );

    await GameMaster.generatePrologue(id);
    await GameMaster.load(id);
  } catch (e) {
    error("Begin Story Failed", e);
    showAlert("Error", "Could not start story.");
    // Re-enable on failure
    if (beginBtn) beginBtn.disabled = false;
  }
};

const handleShuffle = async (views) => {
  try {
    const chars = await entities.list("character");
    const fractals = await entities.list("fractal");

    if (chars.length < 1) return;

    const ai = pick(chars);
    let user = pick(chars);

    if (chars.length > 1) {
      while (user.id === ai.id) user = pick(chars);
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
};

export const SetupManager = {
  startStory: handleBeginStory,
  shuffle: handleShuffle,
};

export const initStoryboardStage = (views) => {
  const titleStoryboard = document.querySelector("#title-storyboard");
  const titleStorymode = document.querySelector("#title-storymode");
  const beginBtn = document.querySelector("#begin-story");
  const shuffleBtn = document.querySelector("#btn-shuffle");

  updateDeveloperModeClass();

  views.setOnSelectionChanged((sel) => {
    const { aiCharacter, userCharacter, fractal } = sel;
    applyPatch({
      selectedAI: aiCharacter,
      selectedUser: userCharacter,
      selectedFractal: fractal,
    });

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

  events.addEventListener(EVENTS.DB_UPDATED, async (data) => {
    if (!state.story.activeId) {
      const updatedId = data?.detail?.id;
      if (!updatedId) return;
      const { getOnUpdateSelection } =
        await import("./components/profile/controller.js");
      const _onUpdateSelection = getOnUpdateSelection();

      if (_onUpdateSelection) {
        const updates = {};
        if (state.selectedAI)
          updates.aiCharacter = await entities.get(
            "character",
            state.selectedAI.id,
          );
        if (state.selectedUser)
          updates.userCharacter = await entities.get(
            "character",
            state.selectedUser.id,
          );
        if (state.selectedFractal)
          updates.fractal = await entities.get(
            "fractal",
            state.selectedFractal.id,
          );

        if (Object.keys(updates).length > 0) _onUpdateSelection(updates);
      }
    }
  });

  events.addEventListener(EVENTS.ENTITY_UPDATED, (e) => {
    const entity = e.detail;
    if (state.story.activeId && entity) {
      if (state.selectedAI?.id === entity.id)
        applyPatch({ selectedAI: entity });
      if (state.selectedUser?.id === entity.id)
        applyPatch({ selectedUser: entity });
      if (state.selectedFractal?.id === entity.id)
        applyPatch({ selectedFractal: entity });
    }
  });

  if (titleStoryboard) {
    titleStoryboard.setAttribute("contenteditable", "true");
    titleStoryboard.title = "Double-click to re-roll title";

    titleStoryboard.addEventListener("input", (e) => {
      const val = e.target.textContent.trim();
      if (titleStorymode) titleStorymode.textContent = val;
      applyPatch({ isCustomTitle: true, storyTitle: val });
    });

    titleStoryboard.addEventListener("dblclick", () => {
      const { selectedAI, selectedUser, selectedFractal } = state;
      const newTitle = generateDynamicTitle(
        selectedAI,
        selectedUser,
        selectedFractal,
      );
      titleStoryboard.textContent = newTitle;
      if (titleStorymode) titleStorymode.textContent = newTitle;
      applyPatch({ isCustomTitle: false, storyTitle: newTitle });
    });
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
};
