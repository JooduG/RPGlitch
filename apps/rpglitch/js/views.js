// apps/rpglitch/js/views.js
// Consolidated view layer: routing, profile rendering, and entity form rendering
// Merged from: profile-router.js, profile.js, entity-form.js

import { entities, getPictureHTML } from "./entities.js";
import {
  hideEl,
  showEl,
  getHashQuery,
  navigateBackOrReturnDefault,
  escapeHtml,
  applyBrand,
  buildHero,
  replaceEventHandler,
  handleAsyncError,
  BASE_COLOUR_MAP,
  setProfileLayoutSizing,
  debounce,
  goBackWithFallback,
  dismissLoadingUI,
  chin,
  log,
  unlockNow,
  setTopBarRight,
  PROFILE_RESIZE_DEBOUNCE_MS,
} from "./utils.js";

let refreshAllLists;

export function initViews(dependencies) {
  refreshAllLists = dependencies.refreshAllLists;
}

// ============================================================================
// ROUTER MODULE (from profile-router.js)
// ============================================================================

function showStoryboard() {
  showEl("#storyboard-screen");
  hideEl("#profile-screen");
  hideEl("#character-form-screen");
  hideEl("#world-form-screen");
}

function parseHash() {
  const [path] = location.hash.slice(1).split("?");
  return path.split("/").filter(Boolean);
}

function handleRoute() {
  try {
    dismissLoadingUI?.();
  } catch (e) {
    void e;
  }
  const [section, type, id] = parseHash();
  const isType = (t) => t === "character" || t === "world";
  chin.closeAll?.();
  try {
    log?.("router.handleRoute", {
      section,
      type,
      id,
    });
  } catch (e) {
    void e;
  }
  if (section === "profile" && isType(type) && id) {
    setTopBarRight?.("profile");
    hideEl("#storyboard-screen");
    hideEl("#character-form-screen");
    hideEl("#world-form-screen");
    renderProfile?.(type, id);
    try {
      chin.closeAll?.();
      dismissLoadingUI?.();
      unlockNow?.();
    } catch (e) {
      void e;
    }
  } else if (section === "form" && isType(type)) {
    setTopBarRight?.("form");
    hideEl("#storyboard-screen");
    hideEl("#profile-screen");
    renderForm?.(type, id || "new");
    try {
      chin.closeAll?.();
      dismissLoadingUI?.();
      unlockNow?.();
    } catch (e) {
      void e;
    }
  } else {
    setTopBarRight?.("storyboard");
    showStoryboard();
    try {
      log?.("router.defaultedToStoryboard");
    } catch (e) {
      void e;
    }
  }
}

window.addEventListener("hashchange", handleRoute);

document.addEventListener(
  "DOMContentLoaded",
  () => {
    handleRoute();

    document.querySelectorAll("button[data-chin]").forEach((btn) => {
      btn.classList.add("chin-button");
    });

    document.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener("submit", (e) => e.preventDefault());
      const btn = form.querySelector("button");
      if (btn) {
        btn.type = "button";
        btn.addEventListener("click", () => {
          form.querySelectorAll('input[type="search"]').forEach((i) => {
            i.value = "";
          });
          refreshAllLists?.();
        });
      }
    });
  },
  {
    once: true,
  }
);

export const router = {
  navigate(hash) {
    location.hash = hash;
  },
  parseHash,
  handleRoute,
};

// ============================================================================
// PROFILE VIEW MODULE (from profile.js)
// ============================================================================

let profileResizeBound = false;

export async function renderProfile(type, id) {
  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  await handleAsyncError(
    async () => {
      const entity = await entities.get(type, id);

      if (!entity) {
        throw new Error(`Entity not found for profile: ${type}/${id}`);
      }

      const screen = document.querySelector("#profile-screen");
      if (!screen) return;

      screen.textContent = "";
      screen.setAttribute("aria-live", "polite");
      screen.className = "profile-view";

      const layout = document.createElement("div");
      layout.className = "profile-layout";

      const leftCol = document.createElement("div");
      leftCol.className = "profile-left";
      const hero = buildHero(entity, { singleTag: true });
      leftCol.appendChild(hero);
      applyBrand?.(leftCol, entity);

      const rightCol = document.createElement("div");
      rightCol.className = "profile-right";

      const content = document.createElement("div");
      content.className = "profile-right-content";

      const h1 = document.createElement("h1");
      h1.className = "profile-name";
      h1.textContent = entity.name || "Empty";

      // Signature Colour implementation
      const signatureColour = entity.signatureColour || "default";
      const colourMap = { default: "var(--pico-h1-color)", ...BASE_COLOUR_MAP };
      h1.style.color = colourMap[signatureColour] || colourMap.default;

      content.appendChild(h1);

      if (entity.description) {
        const p = document.createElement("p");
        p.className = "profile-description";
        p.textContent = entity.description;
        content.appendChild(p);
      }

      const sections = entity.sections || {};
      const secWrap = document.createElement("div");
      secWrap.className = "profile-fields";

      ["forever", "past", "present", "future"].forEach((key) => {
        const value = sections[key] !== undefined ? sections[key] : null;
        if (value) {
          const field = document.createElement("div");
          field.className = "profile-field";

          const label = document.createElement("div");
          label.className = "profile-field-label";
          label.textContent = key.charAt(0).toUpperCase() + key.slice(1);

          const text = document.createElement("div");
          text.className = "profile-field-text";
          text.textContent = value;

          field.append(label, text);
          secWrap.appendChild(field);
        }
      });
      content.appendChild(secWrap);

      rightCol.appendChild(content);
      layout.append(leftCol, rightCol);
      screen.appendChild(layout);
      showEl(screen);

      try {
        setProfileLayoutSizing?.(0.35);
        if (!profileResizeBound) {
          profileResizeBound = true;
          window.addEventListener(
            "resize",
            debounce(
              () => setProfileLayoutSizing?.(0.35),
              PROFILE_RESIZE_DEBOUNCE_MS
            )
          );
        }
      } catch {
        /* noop */
      }

      const backBtn = document.querySelector("#profile-back");
      const editBtn = document.querySelector("#profile-edit");
      const copyBtn = document.querySelector("#profile-copy");

      if (copyBtn) {
        const copyHandler = async () => {
          const newEntity = await copyEntity?.(type, id);
          if (newEntity) {
            window.ephemeralEntity = newEntity;
            router.navigate(
              `#form/${type}/new?clone=true&return=#profile/${type}/${id}`
            );
          } else {
            console.error("Copy operation failed or returned no entity.");
          }
        };
        replaceEventHandler(copyBtn, "click", copyHandler, "_copyHandler");
      }

      if (copyBtn) copyBtn.hidden = !entity.isPremade;
      if (editBtn) editBtn.hidden = entity.isPremade;
      if (backBtn)
        backBtn.addEventListener("click", () =>
          goBackWithFallback("#storyboard", "#storyboard", router)
        );
      editBtn?.addEventListener("click", () => {
        router.navigate(
          `#form/${type}/${entity.id}?return=#profile/${type}/${entity.id}`
        );
      });
    },
    {
      errorMessage: "Could not load profile. Please try again.",
      context: "load profile",
      fallback: null,
    }
  );

  // Navigate away on error (after handleAsyncError shows alert)
  if (!document.querySelector("#profile-screen")?.textContent) {
    router.navigate("#");
  }
}

// Helper function needed by profile (was in utils.js but specific to this module)
async function copyEntity(type, id) {
  console.log(`Attempting to copy entity of type ${type} with id ${id}`);

  const entityToCopy = await entities.get(type, id);
  if (!entityToCopy) {
    console.error(`Entity with type ${type} and id ${id} not found.`);
    return null;
  }

  const newEntity = {
    ...entityToCopy,
    sections: { ...entityToCopy.sections },
  };

  delete newEntity.id;
  newEntity.isPremade = false;
  newEntity.name = `${newEntity.name || "Untitled"} (Clone)`;

  return newEntity;
}

// ============================================================================
// ENTITY FORM MODULE (from entity-form.js)
// ============================================================================

const SECTIONS = [
  ["Forever", "forever"],
  ["Past", "past"],
  ["Present", "present"],
  ["Future", "future"],
];

function createField(id, labelText, inputEl) {
  const field = document.createElement("div");
  field.className = "profile-field";

  const label = document.createElement("label");
  label.className = "profile-field-label";
  label.setAttribute("for", id);
  label.textContent = labelText;

  inputEl.id = id;
  field.append(label, inputEl);
  return field;
}

export async function renderForm(type, id) {
  const cancelBtn = document.querySelector("#form-cancel");
  if (cancelBtn) {
    const cancelHandler = (e) => {
      e?.preventDefault();
      navigateBackOrReturnDefault(undefined, router);
    };
    replaceEventHandler(cancelBtn, "click", cancelHandler, "_cancelHandler");
  }

  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  const params = getHashQuery();
  const isClone = params.get("clone") === "true";
  let isEdit = id && id !== "new";

  let existing;
  if (isClone && window.ephemeralEntity) {
    existing = window.ephemeralEntity;
    window.ephemeralEntity = null;
    isEdit = false;
    id = "new";
  } else {
    const from = params.get("from");
    const template = !isEdit && from ? await entities.copy(type, from) : null;
    existing = isEdit ? await entities.get(type, id) : template;
  }

  if (!existing && isEdit) {
    console.warn(`Entity not found for form: ${type}/${id}. Redirecting.`);
    router.navigate("#");
    return;
  }

  const screenId =
    type === "character" ? "character-form-screen" : "world-form-screen";
  const screen = document.querySelector(`#${screenId}`);
  if (!screen) return;

  const entity = { ...(existing || {}), kind: type };

  screen.textContent = "";
  screen.className = "profile-view form-view";

  const layout = document.createElement("div");
  layout.className = "profile-layout";

  // --- Left Column ---
  const leftCol = document.createElement("div");
  leftCol.className = "profile-left";
  const heroWrap = buildHero(entity, { singleTag: true });

  const imageOverlay = document.createElement("div");
  imageOverlay.className = "profile-hero-overlay";

  const imageInput = document.createElement("input");
  imageInput.name = "imageUrl";
  imageInput.type = "url";
  imageInput.placeholder = "Image URL";
  imageInput.value = entity.imageUrl || "";
  imageInput.addEventListener("change", () => {
    const val = imageInput.value.trim();
    const newPic = getPictureHTML
      ? getPictureHTML(
          { ...entity, imageUrl: val, image: val },
          { cover: true }
        )
      : null;
    if (newPic) {
      const currentWrap = heroWrap.querySelector(".picture");
      if (currentWrap) currentWrap.replaceWith(newPic);
      else heroWrap.appendChild(newPic);
    }
  });

  const signatureColourLabel = document.createElement("label");
  signatureColourLabel.textContent = "Signature Colour";
  signatureColourLabel.setAttribute("for", "signatureColour");

  const paletteSelect = document.createElement("select");
  paletteSelect.name = "signatureColour";
  paletteSelect.id = "signatureColour";
  const palettes = ["Default", "Pink", "Emerald", "Cyan", "Orange", "Purple"];
  palettes.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.toLowerCase();
    option.textContent = p;
    if ((entity.signatureColour || "default") === p.toLowerCase()) {
      option.selected = true;
    }
    paletteSelect.appendChild(option);
  });

  // Live color preview: update the display when signature color changes
  paletteSelect.addEventListener("change", () => {
    const selectedColour = paletteSelect.value;
    const tempEntity = { ...entity, signatureColour: selectedColour };

    // Update the left column brand
    applyBrand?.(leftCol, tempEntity);

    // Update placeholder image color
    const placeholder = heroWrap.querySelector(".placeholder-image");
    if (placeholder && selectedColour && selectedColour !== "default") {
      placeholder.style.backgroundColor = BASE_COLOUR_MAP[selectedColour];
    } else if (placeholder) {
      placeholder.style.backgroundColor = "";
    }

    // Update tag chip color
    const tagChip = heroWrap.querySelector(".tag-chip");
    if (tagChip && selectedColour && selectedColour !== "default") {
      tagChip.style.backgroundColor = BASE_COLOUR_MAP[selectedColour];
      tagChip.style.color = "white";
    } else if (tagChip) {
      tagChip.style.backgroundColor = "";
      tagChip.style.color = "";
    }
  });

  imageOverlay.appendChild(imageInput);
  imageOverlay.appendChild(signatureColourLabel);
  imageOverlay.appendChild(paletteSelect);
  heroWrap.appendChild(imageOverlay);

  leftCol.appendChild(heroWrap);
  applyBrand?.(leftCol, entity);

  // --- Right Column ---
  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const form = document.createElement("form");

  const nameInput = document.createElement("input");
  nameInput.name = "name";
  nameInput.required = true;
  nameInput.value = entity.name || "";
  nameInput.className = "profile-name";
  nameInput.placeholder = "Enter entity name...";
  form.appendChild(nameInput);

  const descriptionInput = document.createElement("textarea");
  descriptionInput.name = "description";
  descriptionInput.value = entity.description || "";
  descriptionInput.className = "profile-description";
  descriptionInput.placeholder =
    "Describe the entity, its background, personality...";
  form.appendChild(descriptionInput);

  const secWrap = document.createElement("div");
  secWrap.className = "profile-fields";

  SECTIONS.forEach(([label, key]) => {
    const textarea = document.createElement("textarea");
    textarea.name = key;
    textarea.value = entity.sections?.[key] || "";
    textarea.className = "profile-field-text";
    secWrap.appendChild(createField(key, label, textarea));
  });
  form.appendChild(secWrap);

  content.appendChild(form);
  rightCol.appendChild(content);
  layout.append(leftCol, rightCol);
  screen.appendChild(layout);

  hideEl("#chin-container");
  hideEl("#profile-screen");
  hideEl(type === "character" ? "world-form-screen" : "character-form-screen");
  showEl(screen);

  const saveBtn = document.querySelector("#form-save");
  const deleteBtn = document.querySelector("#form-delete");

  const suppressDelete =
    id && sessionStorage?.getItem("rpglitch-no-delete") === id;
  if (suppressDelete) sessionStorage.removeItem("rpglitch-no-delete");

  if (deleteBtn) {
    deleteBtn.hidden = !(isEdit && entity.isCustom === 1 && !suppressDelete);
    deleteBtn.addEventListener("click", async () => {
      if (isEdit && confirm("Delete this item?")) {
        try {
          await entities.remove(type, entity.id);
          await refreshAllLists?.();
          router.navigate("#storyboard");
        } catch (error) {
          console.error("Delete failed:", error);
          alert(error.message || "Failed to delete. Please try again.");
        }
      }
    });
  }

  if (saveBtn) {
    const saveHandler = async () => {
      const data = {
        kind: type,
        name: escapeHtml(form.elements.name.value.trim()),
        description: escapeHtml(form.elements.description.value.trim()),
        imageUrl: escapeHtml(imageInput.value.trim()),
        signatureColour: escapeHtml(paletteSelect.value.trim()),
        tags: entity.tags || [],
        sections: {
          forever: escapeHtml(form.elements.forever.value.trim()),
          past: escapeHtml(form.elements.past.value.trim()),
          present: escapeHtml(form.elements.present.value.trim()),
          future: escapeHtml(form.elements.future.value.trim()),
        },
      };

      await handleAsyncError(
        async () => {
          if (!data.name) {
            throw new Error("Please enter a name for this entity.");
          }

          const originalEntity = isEdit ? await entities.get(type, id) : null;
          const isEditingPremade = originalEntity?.isPremade;
          const entityToSave =
            id === "new" || isEditingPremade ? data : { ...data, id };
          const saved = await entities.upsert(type, entityToSave);
          router.navigate(`#profile/${type}/${saved.id}`);
        },
        {
          errorMessage: "Failed to save. Please try again.",
          context: "save entity",
        }
      );
    };
    replaceEventHandler(saveBtn, "click", saveHandler, "_saveHandler");
  }

  if (!isEdit) {
    setTimeout(() => nameInput.focus(), 0);
  }
}
