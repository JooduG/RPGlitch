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
      jade: "16, 185, 129", // Mapped to Emerald
      violet: "139, 92, 246",
      yellow: "234, 179, 8",
      green: "34, 197, 94",
      blue: "59, 130, 246",
      azure: "14, 165, 233",
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

    // Safe Class Management (Don't overwrite .phone-avatar)
    const currentClasses = Array.from(container.classList);
    const signatureClasses = currentClasses.filter((c) =>
      c.startsWith("signature-"),
    );
    signatureClasses.forEach((c) => container.classList.remove(c));

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

  // PHONE HEADER MIRRORS
  setPort("#phone-user-portrait", userCharacter, "You");
  setPort("#phone-ai-portrait", aiCharacter, "AI");

  // Update Phone Contact Name
  const phoneName = document.querySelector("#phone-contact-name");
  if (phoneName && aiCharacter) {
    phoneName.textContent = aiCharacter.name;
  }

  // Set User Signature Color Variable for UI highlights
  if (userCharacter && userCharacter.signatureColour) {
    const rgbMap = {
      pink: "236, 72, 153",
      emerald: "16, 185, 129",
      cyan: "6, 182, 212",
      orange: "249, 115, 22",
      purple: "168, 85, 247",
      jade: "16, 185, 129", // Mapped to Emerald
      violet: "139, 92, 246",
      yellow: "234, 179, 8",
      green: "34, 197, 94",
      blue: "59, 130, 246",
      azure: "14, 165, 233",
      default: "255, 255, 255", // or whatever default is
    };
    const rgb = rgbMap[userCharacter.signatureColour] || rgbMap.default;
    document.documentElement.style.setProperty("--user-signature-rgb", rgb);
  }

  // Set AI Signature Color Variable for Name Highlight
  if (aiCharacter && aiCharacter.signatureColour) {
    const rgbMap = {
      pink: "236, 72, 153",
      emerald: "16, 185, 129",
      cyan: "6, 182, 212",
      orange: "249, 115, 22",
      purple: "168, 85, 247",
      jade: "16, 185, 129",
      violet: "139, 92, 246",
      yellow: "234, 179, 8",
      green: "34, 197, 94",
      blue: "59, 130, 246",
      azure: "14, 165, 233",
      default: "255, 255, 255",
    };
    const rgb = rgbMap[aiCharacter.signatureColour] || rgbMap.default;
    document.documentElement.style.setProperty("--ai-signature-rgb", rgb);
  }
}
