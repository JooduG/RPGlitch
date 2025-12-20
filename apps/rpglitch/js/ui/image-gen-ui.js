import { escapeHtml, log } from "../core/utils.js";
import { getPictureHTML } from "./services/ui-utils.js";
import { getVisualState } from "../data/models.js";
import { state } from "../core/state.js";
import { RGB_MAP } from "../core/constants.js";
import { ThemeService } from "./services/theme.js";
import { openProfileModal } from "./components/profile/controller.js";

// --- VISUALS: Developer Mode & Ambience ---

export function updateDeveloperModeClass() {
  if (state.settings.developerMode) {
    document.body.classList.add("mode-developer");
  } else {
    document.body.classList.remove("mode-developer");
  }
}

export function applyFractalAmbience(fractal) {
  log(
    "[Ambience] Applying for:",
    fractal?.name,
    "Image:",
    fractal?.profilePictureUrl,
  );
  // 1. Colour Ambience
  if (!fractal || !fractal.signatureColor) {
    document.documentElement.style.removeProperty("--fractal-ambience-rgb");
  } else {
    const rgb =
      RGB_MAP[fractal.signatureColor] || RGB_MAP.default || "255, 255, 255";
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
    const rgb =
      RGB_MAP[fractal.signatureColor] || RGB_MAP.default || "255, 255, 255";
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

    // Ensure click opens profile
    container.onclick = () => {
      if (ent) openProfileModal(ent.type || "character", ent.id);
    };

    // Use ThemeService to apply signature logic centrally
    if (ent && ent.signatureColor && ent.signatureColor !== "default") {
      ThemeService.apply(container, ent.signatureColor);
    } else {
      // Clean up if no signature
      const classes = Array.from(container.classList);
      classes.forEach((c) => {
        if (c.startsWith("signature-")) container.classList.remove(c);
      });
      container.classList.remove("themed-signature");
      container.style.removeProperty("--signature-color");
      container.style.removeProperty("--signature-rgb");
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
            picture.classList.add("img-flipped"); // FIX APPLIED HERE
          }
          imgDiv.appendChild(picture);
        }
      }
    }

    if (nameDiv) {
      nameDiv.innerHTML = `<h2>${escapeHtml(ent?.name || label)}</h2>`;
    }
  };
  setPort("#storymode-user-portrait", userCharacter, "You");
  setPort("#storymode-ai-portrait", aiCharacter, "AI");

  // PHONE HEADER MIRRORS
  setPort("#phone-user-portrait", userCharacter, "You");
  setPort("#phone-ai-portrait", aiCharacter, "AI");

  // Update Phone Contact Name
  const phoneName = document.querySelector("#phone-contact-name");
  if (phoneName && aiCharacter) {
    phoneName.textContent = aiCharacter.name;
  }

  // Set User Signature Color Variable for UI highlights
  if (userCharacter && userCharacter.signatureColor) {
    const rgb =
      RGB_MAP[userCharacter.signatureColor] ||
      RGB_MAP.default ||
      "255, 255, 255";
    document.documentElement.style.setProperty("--user-signature-rgb", rgb);
  }

  // Set AI Signature Color Variable for Name Highlight
  if (aiCharacter && aiCharacter.signatureColor) {
    const rgb =
      RGB_MAP[aiCharacter.signatureColor] || RGB_MAP.default || "255, 255, 255";
    document.documentElement.style.setProperty("--ai-signature-rgb", rgb);
  }
}
