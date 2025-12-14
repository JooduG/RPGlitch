import { getPictureHTML } from "./core-utils.js";
import { getVisualState } from "./entity-structs.js";
import { state } from "./app-state.js";

// --- VISUALS: Director Mode & Ambience ---

export function updateDirectorModeClass() {
  if (state.settings.directorMode) {
    document.body.classList.add("mode-director");
  } else {
    document.body.classList.remove("mode-director");
  }
}

export function applyFractalAmbience(fractal) {
  console.log(
    "[Ambience] Applying for:",
    fractal?.name,
    "Image:",
    fractal?.profilePictureUrl,
  );
  // 1. Colour Ambience
  if (!fractal || !fractal.signatureColour) {
    document.documentElement.style.removeProperty("--fractal-ambience-rgb");
  } else {
    const rgbMap = {
      pink: "236, 72, 153",
      emerald: "16, 185, 129",
      cyan: "6, 182, 212",
      orange: "249, 115, 22",
      purple: "168, 85, 247",
      default: "255, 255, 255",
    };
    const rgb = rgbMap[fractal.signatureColour] || rgbMap.default;
    document.documentElement.style.setProperty("--fractal-ambience-rgb", rgb);
  }

  // 2. Cinematic Background
  const bgEl = document.getElementById("fractal-background");
  if (!bgEl) return;

  if (fractal && fractal.profilePictureUrl) {
    bgEl.style.backgroundImage = `url('${fractal.profilePictureUrl}')`;
    bgEl.style.backgroundColor = "transparent";
    bgEl.style.opacity = "1";

    const visuals = getVisualState(fractal);
    bgEl.style.transform = visuals.flipped ? "scaleX(-1)" : "none";
  } else if (fractal) {
    // Placeholder Logic
    const rgbMap = {
      pink: "236, 72, 153",
      emerald: "16, 185, 129",
      cyan: "6, 182, 212",
      orange: "249, 115, 22",
      purple: "168, 85, 247",
      default: "255, 255, 255",
    };
    const rgb = rgbMap[fractal.signatureColour] || rgbMap.default;
    bgEl.style.backgroundImage = "none";
    bgEl.style.backgroundColor = `rgba(${rgb}, 0.5)`;
    bgEl.style.opacity = "1";
    bgEl.style.transform = "none";
  } else {
    bgEl.style.opacity = "0";
    setTimeout(() => {
      if (bgEl.style.opacity === "0") {
        bgEl.style.backgroundImage = "none";
        bgEl.style.backgroundColor = "transparent";
        bgEl.style.transform = "none";
      }
    }, 2000);
  }
}

// --- VISUALS: Portraits ---

export function updatePortraits(aiCharacter, userCharacter) {
  const setPort = (id, ent, label) => {
    const container = document.querySelector(id);
    if (!container) return;

    container.className = "character-portrait";
    if (ent && ent.signatureColour && ent.signatureColour !== "default") {
      container.classList.add(`signature-${ent.signatureColour}`);
    }

    const imgDiv = container.querySelector(".portrait-image");
    let nameDiv =
      container.querySelector(".character-name-overlay") ||
      container.querySelector(".portrait-name");
    if (nameDiv) nameDiv.className = "character-name-overlay";

    if (imgDiv) {
      imgDiv.innerHTML = "";
      if (ent) {
        const isFractal = ent.type === "fractal";
        const picture = getPictureHTML(ent, {
          cover: true,
          landscape: isFractal,
        });
        if (picture) {
          const visuals = getVisualState(ent);
          if (visuals && visuals.flipped) {
            const img = picture.querySelector("img");
            if (img) img.classList.add("img-flipped");
          }
          imgDiv.appendChild(picture);
        }
      }
    }

    if (nameDiv) {
      nameDiv.innerHTML = `<h2>${ent?.name || label}</h2>`;
    }
  };
  setPort("#gameplay-user-portrait", userCharacter, "You");
  setPort("#gameplay-ai-portrait", aiCharacter, "AI");
}
