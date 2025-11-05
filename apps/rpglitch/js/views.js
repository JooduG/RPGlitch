// apps/rpglitch/js/views.js
// Consolidated view layer: routing and stateful entity profile page.

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
// ROUTER MODULE (Refactored)
// ============================================================================

function showStoryboard() {
  setTopBarRight?.("storyboard");
  showEl("#storyboard-screen");
  hideEl("#profile-screen");
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
    log?.("router.handleRoute", { section, type, id });
  } catch (e) {
    void e;
  }

  // UPDATED: The 'profile' route now handles 'new' and 'edit' states.
  if (section === "profile" && isType(type) && id) {
    // Top bar will be set by renderProfilePage
    hideEl("#storyboard-screen");
    renderProfilePage(type, id); // <-- This is our new stateful function
    try {
      chin.closeAll?.();
      dismissLoadingUI?.();
      unlockNow?.();
    } catch (e) {
      void e;
    }
  } 

  else {
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
// STATEFUL PROFILE VIEW (Replaces old renderProfile and renderForm)
// ============================================================================

let profileResizeBound = false;
const SECTIONS = [
  ["Forever", "forever"],
  ["Past", "past"],
  ["Present", "present"],
  ["Future", "future"],
];

/**
 * Creates a field for the profile page, including both read and edit elements.
 * @param {string} id - The base ID for the field (e.g., "name")
 * @param {string} labelText - The human-readable label
 * @param {string} readElement - The tag name for the read-only element (e.g., "h1", "p")
 * @param {string} editElement - The tag name for the edit element (e.g., "input", "textarea")
 * @param {string} value - The current value for the field
 * @param {object} options - Additional options
 * @param {string} options.readClass - CSS class for the read element
 * @param {string} options.editClass - CSS class for the edit element
 * @param {string} options.placeholder - Placeholder for the edit element
 * @returns {HTMLElement} A fragment or element containing both read and edit views
 */
function createProfileField(id, labelText, readElement, editElement, value, options = {}) {
  // Read-only element
  const readEl = document.createElement(readElement);
  readEl.dataset.readField = id;
  readEl.className = options.readClass || "";
  readEl.textContent = value || (options.placeholder ? `(${options.placeholder})` : "(Not set)");
  if (!value) {
    readEl.style.opacity = "0.6";
    readEl.style.fontStyle = "italic";
  }

  // Editable element
  const editEl = document.createElement(editElement);
  editEl.dataset.editField = id;
  editEl.name = id;
  editEl.id = `form-field-${id}`;
  editEl.className = options.editClass || "";
  editEl.placeholder = options.placeholder || "";
  if (editElement === "textarea") {
    editEl.value = value;
  } else {
    editEl.setAttribute("value", value);
  }
  if (id === "name") {
    editEl.required = true;
  }

  // For complex fields like "sections"
  if (labelText) {
    const field = document.createElement("div");
    field.className = "profile-field";

    const label = document.createElement("label");
    label.className = "profile-field-label";
    label.setAttribute("for", `form-field-${id}`);
    label.textContent = labelText;
    
    // The edit element needs a wrapper to match the grid layout
    const editWrapper = document.createElement("div");
    editWrapper.className = "profile-field-text-wrapper";
    editWrapper.dataset.editField = id; // Add data-attribute to wrapper
    editWrapper.appendChild(editEl);

    field.append(label, readEl, editWrapper);
    return field;
  } else {
    // For simple fields like "name" and "description"
    const frag = document.createDocumentFragment();
    frag.append(readEl, editEl);
    return frag;
  }
}

export async function renderProfilePage(type, id) {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  // --- 1. State and Data Setup ---
  let isEditing = id === "new";
  const params = getHashQuery();
  const isClone = params.get("clone") === "true";
  
  let entity;

  if (isClone && window.ephemeralEntity) {
    entity = { ...window.ephemeralEntity, kind: type };
    window.ephemeralEntity = null;
    isEditing = true;
    id = "new";
  } else if (id === "new") {
    entity = { kind: type, type: type, sections: {} };
    isEditing = true;
  } else {
    entity = await handleAsyncError(
      async () => {
        const fetched = await entities.get(type, id);
        if (!fetched) {
          throw new Error(`Entity not found for profile: ${type}/${id}`);
        }
        return fetched;
      },
      {
        errorMessage: "Could not load profile. Please try again.",
        context: "load profile",
        fallback: null,
      }
    );
  }
  
  // Navigate away on error
  if (!entity) {
    router.navigate("#");
    return;
  }

  // --- 2. Clean and Setup Screen ---
  screen.textContent = "";
  screen.setAttribute("aria-live", "polite");
  screen.className = "profile-view"; // Base class
  screen.classList.toggle("is-editing", isEditing);

  // --- 3. Build Static Layout ---
  const layout = document.createElement("div");
  layout.className = "profile-layout";

  // --- Left Column (Hero) ---
  const leftCol = document.createElement("div");
  leftCol.className = "profile-left";
  const heroWrap = buildHero(entity, { singleTag: true });
  
  // --- Hero Editing UI ---
  const imageOverlay = document.createElement("div");
  imageOverlay.className = "profile-hero-overlay";
  imageOverlay.dataset.editField = "hero"; // Controls visibility

  const imageInput = document.createElement("input");
  imageInput.name = "imageUrl";
  imageInput.type = "url";
  imageInput.placeholder = "Image URL";
  imageInput.value = entity.imageUrl || "";
  imageInput.addEventListener("change", () => {
    const val = imageInput.value.trim();
    const newPic = getPictureHTML
      ? getPictureHTML({ ...entity, imageUrl: val, image: val }, { cover: true })
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

  paletteSelect.addEventListener("change", () => {
    const selectedColour = paletteSelect.value;
    const tempEntity = { ...entity, signatureColour: selectedColour };
    applyBrand?.(leftCol, tempEntity);
    // (Additional color preview logic from old renderForm)
  });

  imageOverlay.appendChild(imageInput);
  imageOverlay.appendChild(signatureColourLabel);
  imageOverlay.appendChild(paletteSelect);
  heroWrap.appendChild(imageOverlay);
  
  leftCol.appendChild(heroWrap);
  applyBrand?.(leftCol, entity);

  // --- Right Column (Content) ---
  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const form = document.createElement("form"); // Use a form for semantics
  form.addEventListener("submit", (e) => e.preventDefault()); // Prevent default submit

  // --- Name Field (Read/Edit) ---
  form.appendChild(
    createProfileField(
      "name",
      null,
      "h1",
      "input",
      entity.name || "",
      {
        readClass: "profile-name",
        editClass: "profile-name",
        placeholder: "Enter entity name...",
      }
    )
  );

  // --- Description Field (Read/Edit) ---
  form.appendChild(
    createProfileField(
      "description",
      null,
      "p",
      "textarea",
      entity.description || "",
      {
        readClass: "profile-description",
        editClass: "profile-description",
        placeholder: "Describe the entity...",
      }
    )
  );

  // --- Sections (Read/Edit) ---
  const secWrap = document.createElement("div");
  secWrap.className = "profile-fields";
  
  SECTIONS.forEach(([label, key]) => {
    secWrap.appendChild(
      createProfileField(
        key,
        label,
        "div", // Read element
        "textarea", // Edit element
        entity.sections?.[key] || "",
        {
          readClass: "profile-field-text",
          editClass: "profile-field-text",
        }
      )
    );
  });
  
  form.appendChild(secWrap);
  content.appendChild(form);
  rightCol.appendChild(content);
  layout.append(leftCol, rightCol);
  screen.appendChild(layout);
  showEl(screen);

  // --- 4. Setup Sizing and Top Bar ---
  try {
    setProfileLayoutSizing?.(0.35);
    if (!profileResizeBound) {
      profileResizeBound = true;
      window.addEventListener("resize", debounce(() => setProfileLayoutSizing?.(0.35), PROFILE_RESIZE_DEBOUNCE_MS));
    }
  } catch { /* noop */ }
  
  // Set initial top bar state
  setTopBarRight(isEditing ? "form" : "profile");

  // --- 5. Event Handlers ---
  const backBtn = document.querySelector("#profile-back"); // On 'profile' bar
  const editBtn = document.querySelector("#profile-edit"); // On 'profile' bar
  const copyBtn = document.querySelector("#profile-copy"); // On 'profile' bar
  
  const cancelBtn = document.querySelector("#form-cancel"); // On 'form' bar
  const saveBtn = document.querySelector("#form-save"); // On 'form' bar
  const deleteBtn = document.querySelector("#form-delete"); // On 'form' bar

  // --- State Toggling Function ---
  function setEditMode(editing) {
    isEditing = editing;
    screen.classList.toggle('is-editing', isEditing);
    setTopBarRight(isEditing ? 'form' : 'profile');

    // If we just entered edit mode, focus the name input
    if (isEditing) {
      screen.querySelector('[data-edit-field="name"]')?.focus();
    }
  }

  // --- Button Handlers ---
  
  // (Profile Bar)
  if (backBtn) {
    replaceEventHandler(backBtn, "click", () => goBackWithFallback("#storyboard", "#storyboard", router), "_backHandler");
  }
  
  if (editBtn) {
    editBtn.hidden = entity.isPremade || id === 'new';
    replaceEventHandler(editBtn, "click", () => setEditMode(true), "_editHandler");
  }

  if (copyBtn) {
    copyBtn.hidden = !entity.isPremade;
    const copyHandler = async () => {
      const newEntity = await copyEntity?.(type, id);
      if (newEntity) {
        window.ephemeralEntity = newEntity;
        // Navigate to the new profile page, which will start in 'edit' mode
        router.navigate(`#profile/${type}/new?clone=true&return=#profile/${type}/${id}`);
      } else {
        console.error("Copy operation failed or returned no entity.");
      }
    };
    replaceEventHandler(copyBtn, "click", copyHandler, "_copyHandler");
  }

  // (Form Bar)
  if (cancelBtn) {
    const cancelHandler = (e) => {
      e?.preventDefault();
      if (id === "new") {
        // If it was a new entity, just go back
        navigateBackOrReturnDefault(undefined, router);
      } else {
        // If editing, just toggle view. (We need to reset fields here)
        // For simplicity, we'll just re-render the whole page
        router.navigate(`#profile/${type}/${id}`);
        // A more advanced way would be to reset form fields to 'entity' values
        // setEditMode(false); 
      }
    };
    replaceEventHandler(cancelBtn, "click", cancelHandler, "_cancelHandler");
  }
  
  if (deleteBtn) {
    const isDeletable = id !== 'new' && entity.isCustom === 1;
    deleteBtn.hidden = !isDeletable;
    
    const deleteHandler = async () => {
      if (isDeletable && confirm("Delete this item?")) {
        try {
          await entities.remove(type, entity.id);
          await refreshAllLists?.();
          router.navigate("#storyboard");
        } catch (error) {
          console.error("Delete failed:", error);
          alert(error.message || "Failed to delete. Please try again.");
        }
      }
    };
    replaceEventHandler(deleteBtn, "click", deleteHandler, "_deleteHandler");
  }

  if (saveBtn) {
    const saveHandler = async () => {
      const data = {
        kind: type,
        name: escapeHtml(form.elements.name.value.trim()),
        description: escapeHtml(form.elements.description.value.trim()),
        imageUrl: escapeHtml(imageInput.value.trim()),
        signatureColour: escapeHtml(paletteSelect.value.trim()),
        tags: entity.tags || [], // Tags are not currently editable in this form
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

          const originalEntity = (id !== 'new') ? await entities.get(type, id) : null;
          const isEditingPremade = originalEntity?.isPremade;
          const entityToSave =
            id === "new" || isEditingPremade ? data : { ...data, id };
          
          const saved = await entities.upsert(type, entityToSave);
          
          // If it was a new entity, navigate to its new URL
          if (id === 'new') {
            router.navigate(`#profile/${type}/${saved.id}`);
          } else {
            // Otherwise, just exit edit mode
            entity = saved; // Update local entity data
            setEditMode(false);
            // We'll re-render to be safe, though a lighter update is possible
            renderProfilePage(type, saved.id);
          }
        },
        {
          errorMessage: "Failed to save. Please try again.",
          context: "save entity",
        }
      );
    };
    replaceEventHandler(saveBtn, "click", saveHandler, "_saveHandler");
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

/**
 * This function is no longer called by the router but is kept
 * to prevent errors if it's referenced elsewhere.
 * The logic is now inside renderProfilePage.
 */
export async function renderForm(type, id) {
  console.warn("renderForm() is deprecated. Navigating to profile page.");
  router.navigate(`#profile/${type}/${id || 'new'}`);
}