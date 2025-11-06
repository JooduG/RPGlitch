console.log("--- [DEBUG] NEW views.js v5 LOADED ---"); // New debug message

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
// STATEFUL PROFILE VIEW (Replaces old renderProfile and renderForm)
// ============================================================================

let profileResizeBound = false;

// Define all section labels and sub-labels
const SECTION_DEFINITIONS = {
  forever: {
    label: "Forever",
    sublabels: {
      character: "Core persona & permanent characteristics.",
      world: "Eternal truths, core concepts, & unbreakable laws.",
    },
  },
  past: {
    label: "Past",
    sublabels: {
      character: "Biography, key memories, & backstory.",
      world: "History, ancient lore, & formative events.",
    },
  },
  present: {
    label: "Present",
    sublabels: {
      character: "Current situation, motivations, & relationships.",
      world: "Current state, major factions, & ongoing conflicts.",
    },
  },
  future: {
    label: "Future",
    sublabels: {
      character: "Goals, prophecies, & potential plot hooks.",
      world: "Impending events, prophecies, & story seeds.",
    },
  },
};

/**
 * SIMPLIFIED: Creates a field for the profile page.
 * This now only handles the read/edit elements, not the labels.
 */
function createFieldElements(
  id,
  readElement,
  editElement,
  value,
  options = {}
) {
  const frag = document.createDocumentFragment();

  // Read-only element
  const readEl = document.createElement(readElement);
  readEl.dataset.readField = id;
  readEl.className = options.readClass || "";
  readEl.textContent =
    value || (options.placeholder ? `(${options.placeholder})` : "(Not set)");
  if (!value) {
    readEl.style.opacity = "0.6";
    readEl.style.fontStyle = "italic";
  }
  frag.appendChild(readEl);

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
    if (id === "name") {
      editEl.required = true;
    }
  }
  frag.appendChild(editEl);

  return frag;
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

  const imageOverlay = document.createElement("div");
  imageOverlay.className = "profile-hero-overlay";
  imageOverlay.dataset.editField = "hero"; // Controls visibility

  // --- [NEW] Dynamic Image Input Group ---
  const imageFieldset = document.createElement("fieldset");
  imageFieldset.role = "group";
  imageFieldset.className = "profile-image-group"; // For styling

  const imageInput = document.createElement("input");
  imageInput.name = "imageUrl"; // <-- Name is still needed for saveHandler
  imageInput.type = "text"; // Changed from 'url' to 'text' for dual purpose
  imageInput.placeholder = "Type prompt, paste URL, or click to upload...";
  imageInput.value = entity.imageUrl || "";

  // This existing listener is perfect, it handles the preview update
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

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = "secondary"; // Will be updated by state
  
  // Helper to check for URL-like strings
  const isUrl = (text) => {
    // Checks for http(s):// or data:image/...
    return /^(https?:\/\/|data:image\/)/.test(text.trim());
  };

  // Function to update button state based on input text
  const updateButtonState = () => {
    const text = imageInput.value;
    if (text === "") {
      // STATE 1: Empty Field
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    } else if (isUrl(text)) {
      // STATE 2: Pasted URL - Preview updates on 'change'. Button defaults to "Upload".
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    } else {
      // STATE 3: Typing a Prompt
      actionButton.textContent = "Generate";
      actionButton.dataset.action = "generate";
    }
  };

  // Add 'input' listener to update button on every keystroke
  imageInput.addEventListener("input", updateButtonState);

  // Add one 'click' listener to the button to handle all actions
  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;

    // Set loading state (as per ImageGlitch spec)
    actionButton.disabled = true;
    actionButton.setAttribute("aria-busy", "true");
    imageInput.disabled = true;
    // Show indeterminate progress on button
    actionButton.innerHTML = '<span aria-busy="true"></span>'; 

    try {
      if (action === "upload") {
        // --- [FIX 1 (Upload)] ---
        // Your log shows the plugin returns data.url, not data.imageUrl
        if (!window.pluginUpload) throw new Error("Upload plugin not found.");
        const data = await window.pluginUpload({ accept: 'image/*' }); 
        
        if (data && data.url) { // <-- FIXED
          // Check that the uploaded file is an image, not a .txt
          if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(data.url)) {
            throw new Error(`Upload failed: File must be an image, not a '${data.fileExtension || 'file'}'.`);
          }
          imageInput.value = data.url; // <-- FIXED
        } else if (data && data.error) {
          throw new Error(`Upload failed: ${data.error}`);
        } else if (!data) {
           // User cancelled the upload dialog
           console.log("Upload cancelled by user.");
        } else {
          // This is the error you saw in the last log
          throw new Error("Upload failed: Plugin returned no URL.");
        }
      } else if (action === "generate") {
        // --- [FIX 2 (Generate)] ---
        if (!window.pluginTextToImage) throw new Error("Image Generation plugin not found.");
        const prompt = imageInput.value.trim();
        if (!prompt) throw new Error("Prompt cannot be empty.");
        
        const data = await window.pluginTextToImage({ prompt });

        // Your log shows data is at the TOP LEVEL, not nested in .generatedImage
        if (data && data.imageId && data.fileExtension) { // <-- FIXED
          const { imageId, fileExtension } = data; // <-- FIXED
          // We must construct the URL manually
          imageInput.value = `https://img.perchance.org/${imageId}.${fileExtension || 'jpeg'}`;
        } else {
          // This is the error you saw in the last log
          throw new Error("Generation failed to return a valid image object.");
        }
        // [--- END FIX 2 ---]
      }
    } catch (error) {
      console.error("Image action failed:", error);
      alert(`Error: ${error.message || "Operation failed."}`);
    } finally {
      // Remove loading state
      actionButton.disabled = false;
      actionButton.removeAttribute("aria-busy");
      imageInput.disabled = false;
      
      // Manually trigger a 'change' event to update the preview
      imageInput.dispatchEvent(new Event("change", { bubbles: true }));
      
      // After action, re-check the state (e.g., it's now a URL, so button should say "Upload")
      updateButtonState(); // This also restores the button text
    }
  });

  // Set initial button state on load
  updateButtonState();

  // Add the new components to the fieldset
  imageFieldset.appendChild(imageInput);
  imageFieldset.appendChild(actionButton);
  // --- [END NEW] Dynamic Image Input Group ---


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

  // This listener is correct and should not be broken.
  paletteSelect.addEventListener("change", () => {
    const selectedColour = paletteSelect.value;
    const tempEntity = { ...entity, signatureColour: selectedColour };
    applyBrand?.(leftCol, tempEntity);
  });

  imageOverlay.appendChild(imageFieldset); // Append the new grouped fieldset
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

  const form = document.createElement("form");
  form.addEventListener("submit", (e) => e.preventDefault());

  // --- (REFACTORED) Name Field (Read/Edit) ---
  form.appendChild(
    createFieldElements(
      "name",
      "h1", // Read: <h1>
      "input", // Edit: <input>
      entity.name || "",
      {
        placeholder: "Enter entity name...",
      }
    )
  );

  // --- (REFACTORED) Description Field (Read/Edit) ---
  form.appendChild(
    createFieldElements(
      "description",
      "p", // Read: <p>
      "textarea", // Edit: <textarea>
      entity.description || "",
      {
        readClass: "profile-description-read", // Add a class for min-height
        placeholder: "Describe the entity...",
      }
    )
  );

  // --- (REFACTORED) Sections (Read/Edit) ---
  const secWrap = document.createElement("div");
  secWrap.className = "profile-fields"; // Just a wrapper

  Object.entries(SECTION_DEFINITIONS).forEach(([key, def]) => {
    const fieldDiv = document.createElement("div");
    const label = document.createElement("label");
    label.setAttribute("for", `form-field-${key}`);
    label.textContent = def.label;

    const sublabel = document.createElement("small");
    sublabel.textContent = def.sublabels[type] || "";
    label.appendChild(document.createElement("br")); // Pico convention
    label.appendChild(sublabel);

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(
      createFieldElements(
        key,
        "div", // Read: <div>
        "textarea", // Edit: <textarea>
        entity.sections?.[key] || "",
        {
          readClass: "profile-field-text-read", // Class for read-only styling
        }
      )
    );
    secWrap.appendChild(fieldDiv);
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

  setTopBarRight(isEditing ? "form" : "profile");

  // --- 5. Event Handlers ---
  const backBtn = document.querySelector("#profile-back");
  const editBtn = document.querySelector("#profile-edit");
  const copyBtn = document.querySelector("#profile-copy");
  const cancelBtn = document.querySelector("#form-cancel");
  const saveBtn = document.querySelector("#form-save");
  const deleteBtn = document.querySelector("#form-delete");

  function setEditMode(editing) {
    isEditing = editing;
    screen.classList.toggle("is-editing", isEditing);
    setTopBarRight(isEditing ? "form" : "profile");
    if (isEditing) {
      screen.querySelector('[data-edit-field="name"]')?.focus();
    }
  }

  if (backBtn) {
    replaceEventHandler(
      backBtn,
      "click",
      () => goBackWithFallback("#storyboard", "#storyboard", router),
      "_backHandler"
    );
  }

  if (editBtn) {
    editBtn.hidden = entity.isPremade || id === "new";
    replaceEventHandler(editBtn, "click", () => setEditMode(true), "_editHandler");
  }

  if (copyBtn) {
    copyBtn.hidden = !entity.isPremade;
    const copyHandler = async () => {
      const newEntity = await copyEntity?.(type, id);
      if (newEntity) {
        window.ephemeralEntity = newEntity;
        router.navigate(
          `#profile/${type}/new?clone=true&return=#profile/${type}/${id}`
        );
      } else {
        console.error("Copy operation failed or returned no entity.");
      }
    };
    replaceEventHandler(copyBtn, "click", copyHandler, "_copyHandler");
  }

  if (cancelBtn) {
    const cancelHandler = (e) => {
      e?.preventDefault();
      if (id === "new") {
        navigateBackOrReturnDefault(undefined, router);
      } else {
        router.navigate(`#profile/${type}/${id}`);
      }
    };
    replaceEventHandler(cancelBtn, "click", cancelHandler, "_cancelHandler");
  }

  if (deleteBtn) {
    const isDeletable = id !== "new" && entity.isCustom === 1;
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
      
      // --- [FIX 3 (Save)] ---
      // We must read `imageUrl` from the `imageInput` variable,
      // NOT from `form.elements`, because it's not in the form.
      // This bug was crashing the entire save function and breaking signatureColour.
      const data = {
        kind: type,
        name: escapeHtml(form.elements.name.value.trim()),
        description: escapeHtml(form.elements.description.value.trim()),
        imageUrl: escapeHtml(imageInput.value.trim()), // <-- FIXED
        signatureColour: escapeHtml(paletteSelect.value.trim()), // <-- This was always correct
        tags: entity.tags || [],
        sections: {
          forever: escapeHtml(form.elements.forever.value.trim()),
          past: escapeHtml(form.elements.past.value.trim()),
          present: escapeHtml(form.elements.present.value.trim()),
          future: escapeHtml(form.elements.future.value.trim()),
        },
      };
      // [--- END FIX 3 ---]

      await handleAsyncError(
        async () => {
          if (!data.name) {
            throw new Error("Please enter a name for this entity.");
          }

          const originalEntity =
            id !== "new" ? await entities.get(type, id) : null;
          const isEditingPremade = originalEntity?.isPremade;
          const entityToSave =
            id === "new" || isEditingPremade ? data : { ...data, id };

          const saved = await entities.upsert(type, entityToSave);

          if (id === "new") {
            router.navigate(`#profile/${type}/${saved.id}`);
          } else {
            entity = saved;
            setEditMode(false);
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
  newEntity.isPremade = false; // This is correct
  // Also ensure isCustom is correctly set in the upsert function
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
  router.navigate(`#profile/${type}/${id || "new"}`);
}