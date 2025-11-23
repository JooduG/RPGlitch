// apps/rpglitch/js/storyboard-controller.js
import { state, applyPatch } from "./store.js";
import { entities } from "./entities.js";
import { StoryController } from "./story-controller.js";
import { updatePortraits } from "./views.js";
import { error } from "./utils.js";

function updateWorldAmbience(worldEntity) {
    if (!worldEntity || !worldEntity.signatureColour) return;
    const colorMap = {
        pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
        orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
    };
    const rgb = colorMap[worldEntity.signatureColour] || colorMap.default;
    document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
}

function generateDynamicTitle(ai, user, world) {
    // Helper to pick random variation
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const prefixes = [
        "The Story of",
        "The Adventures of",
        "The Tale of",
        "The Legend of",
        "The Saga of",
        "Chronicles of",
        "The Journey of"
    ];

    const chars = [ai, user].filter(Boolean);
    const hasWorld = !!world;
    const totalChars = chars.length;

    // 1. Select Prefix
    const prefix = pick(prefixes);

    // 2. Build Content String based on selection
    let content = "";

    if (totalChars === 2 && hasWorld) {
        content = `${chars[0].name} & ${chars[1].name} in ${world.name}`;
    }
    else if (totalChars === 2 && !hasWorld) {
        content = `${chars[0].name} & ${chars[1].name}`;
    }
    else if (totalChars === 1 && hasWorld) {
        content = `${chars[0].name} in ${world.name}`;
    }
    else if (totalChars === 1 && !hasWorld) {
        content = chars[0].name;
    }
    else if (totalChars === 0 && hasWorld) {
        const worldPrefixes = ["Adventures in", "Tales from", "The World of", "Journey to"];
        return `${pick(worldPrefixes)} ${world.name}`;
    }
    else {
        return "My New Story";
    }

    // 3. Combine
    return `${prefix} ${content}`;
}

async function handleBeginStory() {
    const { selectedAI, selectedUser, selectedWorld, storyTitle } = state;
    if (!selectedAI || !selectedUser || !selectedWorld) return alert("Please select all entities.");

    try {
        const id = await StoryController.createFromSelection({
            storyTitle,
            aiCharacterId: selectedAI.id,
            userCharacterId: selectedUser.id,
            worldId: selectedWorld.id
        });

        document.body.classList.remove("mode-storyboard");
        document.body.classList.add("mode-gameplay");
        applyPatch({ mode: "gameplay" });

        // Portraits update logic is handled inside StoryController.generateOpening
        updatePortraits(selectedAI, selectedUser);
        await StoryController.generateOpening(id);
    } catch (e) {
        error("Begin Story Failed", e);
        alert("Could not start story.");
    }
}

async function handleShuffle(views) {
    try {
        const chars = await entities.list('character');
        const worlds = await entities.list('world');

        if (chars.length < 1) {
            console.warn("Not enough characters to shuffle");
            return;
        }

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        // Pick random entities
        const ai = pick(chars);
        let user = pick(chars);

        // Try to ensure they are different if possible
        if (chars.length > 1) {
            while (user.id === ai.id) {
                user = pick(chars);
            }
        }

        const world = worlds.length > 0 ? pick(worlds) : null;

        // Use the views object to update the selection
        views.updateStoryboardSelection({ aiCharacter: ai, userCharacter: user, world });

    } catch (e) {
        error("Shuffle failed:", e);
    }
}

export function initStoryboardStage(views) {
    const titleStoryboard = document.querySelector("#title-storyboard");
    const titleGameplay = document.querySelector("#title-gameplay");
    const beginBtn = document.querySelector("#begin-story");
    const shuffleBtn = document.querySelector("#btn-shuffle");

    // Bind Selection Change Listener from views
    views.setOnSelectionChanged((sel) => {
        const { aiCharacter, userCharacter, world } = sel;
        applyPatch({ selectedAI: aiCharacter, selectedUser: userCharacter, selectedWorld: world });
        if (world) updateWorldAmbience(world);

        // Only auto-generate if the user hasn't manually edited the title
        if (!state.isCustomTitle && titleStoryboard && titleGameplay) {
            const newTitle = generateDynamicTitle(aiCharacter, userCharacter, world);
            titleStoryboard.textContent = newTitle;
            titleGameplay.textContent = newTitle;
            applyPatch({ storyTitle: newTitle });
        }

        const ready = aiCharacter && userCharacter && world;
        if (beginBtn) {
            beginBtn.disabled = !ready;
            beginBtn.classList.toggle("disabled", !ready);
        }
    });

    // 1. Title Logic (Manual Edit & Double Click)
    if (titleStoryboard) {
        titleStoryboard.setAttribute("contenteditable", "true");
        titleStoryboard.title = "Double-click to re-roll title";

        const handleInput = (e) => {
            const val = e.target.textContent.trim();
            if (titleGameplay) titleGameplay.textContent = val;
            applyPatch({ isCustomTitle: true, storyTitle: val });
        };

        const handleReset = () => {
            const { selectedAI, selectedUser, selectedWorld } = state;
            const newTitle = generateDynamicTitle(selectedAI, selectedUser, selectedWorld);

            titleStoryboard.textContent = newTitle;
            if (titleGameplay) titleGameplay.textContent = newTitle;

            applyPatch({ isCustomTitle: false, storyTitle: newTitle });
        };

        titleStoryboard.addEventListener("input", handleInput);
        titleStoryboard.addEventListener("dblclick", handleReset);
    }

    // 2. Begin Story Button
    if (beginBtn) beginBtn.addEventListener("click", handleBeginStory);

    // 3. Shuffle Button
    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleShuffle(views); // Pass the views object for updating the selection
        });
    }
}