// apps/rpglitch/js/views.js
// Consolidated view layer: routing and stateful entity profile page.

import { entities, getPictureHTML } from "./entities.js";
import {
  hideEl,
  showEl,
  getHashQuery,
  navigateBackOrReturnDefault,
  escapeHtml,
  applySignature,
  buildHero,
  replaceEventHandler,
  handleAsyncError,
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

/**
 * Creates a standardized 2-column form row.
 * @param {string} fieldId - The unique ID for the field (used for 'for' attribute).
 * @param {string} labelText - The text for the <label> element.
 * @param {string} sublabelText - The help text for the <small> element.
 * @param {Array<any>} fieldConfig - Array of args for createFieldElements (e.g., [readEl, editEl, value, options]).
 * @returns {HTMLElement} The complete field row element.
 */
function createFieldRow(fieldId, labelText, sublabelText, fieldConfig) {
  const fieldRow = document.createElement("div");
  fieldRow.className = "field-row";

  const labelCol = document.createElement("div");
  labelCol.className = "field-label";

  const label = document.createElement("label");
  label.setAttribute("for", `form-field-${fieldId}`);
  label.textContent = labelText;

  labelCol.appendChild(label);

  if (sublabelText && sublabelText.trim()) {
    const sublabel = document.createElement("small");
    sublabel.textContent = sublabelText;
    labelCol.appendChild(sublabel);
  }

  const inputCol = document.createElement("div");
  inputCol.className = "field-input";
  // createFieldElements returns a DocumentFragment, which appends correctly
  inputCol.appendChild(createFieldElements(fieldId, ...(Array.isArray(fieldConfig) ? fieldConfig : [])));

  fieldRow.appendChild(labelCol);
  fieldRow.appendChild(inputCol);
  return fieldRow;
}

/**
 * Extracts and validates image URL from plugin response.
 * Handles multiple response formats from Perchance plugins.
 * @param {*} result - Plugin response (can be string, object, or various nested structures)
 * @returns {string|undefined} Trimmed, sanitized URL string or undefined if no URL found
 */
function _extractImageUrlFromPlugin(result) {
  let imageUrl;

  // Check all possible response formats in priority order with type validation
  if (result?.imageUrl && typeof result.imageUrl === 'string') {
    // Standard text-to-image response format
    imageUrl = result.imageUrl;
  } else if (result?.dataUrl && typeof result.dataUrl === 'string') {
    // Alternative text-to-image format (data URLs)
    imageUrl = result.dataUrl;
  } else if (result?.imageId && typeof result.imageId === 'string') {
    // Text-to-image format with separate ID and extension
    const ext = result.fileExtension || 'jpeg';
    imageUrl = `https://img.perchance.org/${result.imageId}.${ext}`;
  } else if (typeof result === 'string') {
    // Direct string URL response
    imageUrl = result;
  } else if (result?.url && typeof result.url === 'string') {
    // Upload plugin standard format
    imageUrl = result.url;
  } else if (result?.file?.url && typeof result.file.url === 'string') {
    // Upload plugin nested format
    imageUrl = result.file.url;
  } else if (result?.name && typeof result.name === 'string') {
    // Unusual fallback: some plugin versions return URL in name field
    console.warn('[RPGlitch] Plugin used unusual "name" field for URL. Result:', result);
    imageUrl = result.name;
  }

  // Trim whitespace and sanitize to prevent XSS attacks
  if (typeof imageUrl === 'string') {
    imageUrl = imageUrl.trim();
    // Sanitize URL to prevent XSS vulnerabilities
    if (window.DOMPurify) {
      imageUrl = window.DOMPurify.sanitize(imageUrl);
    }
  }

  return imageUrl || undefined;
}

/**
 * Validates that a URL is a valid image URL using SOTA URL parsing.
 * @param {string} url - The URL to validate
 * @param {boolean} allowDataUrls - Whether to allow data:image URLs (default: true)
 * @returns {boolean} True if the URL is valid, false otherwise
 */
function _isValidImageUrl(url, allowDataUrls = true) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Check for data URLs first (they don't parse well with URL constructor)
    const isDataImage = url.startsWith('data:image/');
    if (isDataImage) {
      return allowDataUrls;
    }

    // Parse URL using native URL constructor for robust validation
    const urlObj = new URL(url);

    // Validate protocol
    const isHttp = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    if (!isHttp) {
      return false;
    }

    // Validate file extension on pathname (not full URL, avoiding query param issues)
    const hasValidExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlObj.pathname);
    return hasValidExtension;
  } catch (error) {
    // URL constructor throws on invalid URLs
    return false;
  }
}

export async function renderProfilePage(type, id) {
  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  // Helper function to show non-blocking notifications
  function showNotification(message, duration = 5000) {
    const notifier = document.querySelector("#status-notifier");
    if (notifier) {
      notifier.textContent = message;
      notifier.style.display = "block";
      setTimeout(() => {
        notifier.textContent = "";
        notifier.style.display = "none";
      }, duration);
    } else {
      // Fallback to alert if notifier element not found
      alert(message);
    }
  }

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

  // Helper function to detect URLs
  function isUrl(text) {
    const trimmed = text.trim().toLowerCase();
    // Check for common URL protocols
    return (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:image/")
    );
  }

  const imageOverlay = document.createElement("div");
  imageOverlay.className = "profile-hero-overlay";
  imageOverlay.dataset.editField = "hero";

  const imageFieldset = document.createElement("fieldset");
  imageFieldset.setAttribute("role", "group");

  const imageInput = document.createElement("input");
  imageInput.name = "imageUrl";
  imageInput.type = "text";
  imageInput.placeholder = "Type prompt, paste URL, or click to upload...";
  imageInput.value = entity.imageUrl || "";

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.textContent = "Upload";
  actionButton.dataset.action = "upload";

  function updateButtonState() {
    const value = imageInput.value.trim();

    if (value === "") {
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    } else if (!isUrl(value)) {
      actionButton.textContent = "Generate";
      actionButton.dataset.action = "generate";
    } else {
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    }
  }

  // Add input listener for dynamic state updates
  imageInput.addEventListener("input", updateButtonState);

  // Set initial button state based on existing value
  updateButtonState();

  // Add input listener for live preview updates
  imageInput.addEventListener("input", () => {
    const val = imageInput.value.trim();
    if (isUrl(val)) {
      // Sanitize URL to prevent XSS attacks before rendering
      const sanitizedVal = window.DOMPurify ? window.DOMPurify.sanitize(val) : val;
      const newPic = getPictureHTML
        ? getPictureHTML({ ...entity, imageUrl: sanitizedVal, image: sanitizedVal }, { cover: true })
        : null;
      if (newPic) {
        const currentWrap = heroWrap.querySelector(".picture");
        if (currentWrap) currentWrap.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    }
  });
  
  function updateImageInput(input, url) {
    input.value = url;
    // Dispatch both input and change events to update preview and state
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;

    if (action === "generate") {
      const prompt = imageInput.value.trim();
      if (!prompt) return;

      // Check plugin availability before try block
      if (!window.pluginTextToImage || typeof window.pluginTextToImage !== 'function') {
        showNotification("Image generation plugin is not available. Please refresh the page.");
        return;
      }

      try {
        // Set loading state on both button and input
        actionButton.disabled = true;
        imageInput.disabled = true;
        actionButton.setAttribute("aria-busy", "true");
        imageInput.setAttribute("aria-busy", "true");
        actionButton.textContent = "Generating...";

        // Call plugin with prompt, guidanceScale, and portrait resolution
        const result = await window.pluginTextToImage({
          prompt,
          guidanceScale: 7, // Default guidance scale for consistent results
          resolution: 'portrait', // Force portrait aspect ratio for all generated images
        });
        log?.("[DEBUG] T2I Result:", JSON.stringify(result, null, 2));

        // Extract URL from plugin response (sanitized inside helper)
        const imageUrl = _extractImageUrlFromPlugin(result);

        // Validate URL format (allow http/https and data:image URLs)
        if (!imageUrl || !_isValidImageUrl(imageUrl, true)) {
          throw new Error("Image generation failed: invalid or unsupported URL format");
        }

        updateImageInput(imageInput, imageUrl);
      } catch (error) {
        console.error("Image generation error:", error);
        showNotification("Image generation failed. Please try again.");
      } finally {
        actionButton.disabled = false;
        imageInput.disabled = false;
        actionButton.removeAttribute("aria-busy");
        imageInput.removeAttribute("aria-busy");
        updateButtonState();
      }
    } else if (action === "upload") {
      // Check plugin availability before try block
      if (!window.pluginUpload || typeof window.pluginUpload !== 'function') {
        showNotification("Upload plugin is not available. Please refresh the page.");
        return;
      }

      try {
        // Set loading state on both button and input
        actionButton.disabled = true;
        imageInput.disabled = true;
        actionButton.setAttribute("aria-busy", "true");
        imageInput.setAttribute("aria-busy", "true");
        actionButton.textContent = "Uploading...";

        const result = await window.pluginUpload({ accept: 'image/*' });
        log?.("[DEBUG] Upload Result:", JSON.stringify(result, null, 2));

        // Extract URL from plugin response (sanitized inside helper)
        const imageUrl = _extractImageUrlFromPlugin(result);

        // Upload handler only accepts http/https URLs (no data URLs)
        // Rationale: Uploaded images must be permanently hosted on external servers,
        // whereas data URLs are ephemeral and exist only in the current session
        if (!imageUrl || !_isValidImageUrl(imageUrl, false)) {
          throw new Error("Upload failed: URL must be a valid, hosted image (http/https)");
        }

        updateImageInput(imageInput, imageUrl);
      } catch (error) {
        console.error("Upload error:", error);
        showNotification(error.message || "Upload failed. Please try again.");
      } finally {
        actionButton.disabled = false;
        imageInput.disabled = false;
        actionButton.removeAttribute("aria-busy");
        imageInput.removeAttribute("aria-busy");
        updateButtonState();
      }
    }
  });

  imageFieldset.appendChild(imageInput);
  imageFieldset.appendChild(actionButton);
  imageOverlay.appendChild(imageFieldset);

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

  // This listener correctly updates the preview
  paletteSelect.addEventListener("change", () => {
    const selectedColour = paletteSelect.value;
    const tempEntity = { ...entity, signatureColour: selectedColour };
    applySignature?.(leftCol, tempEntity);
  });

  imageOverlay.appendChild(signatureColourLabel);
  imageOverlay.appendChild(paletteSelect);
  heroWrap.appendChild(imageOverlay);

  leftCol.appendChild(heroWrap);
  applySignature?.(leftCol, entity); // Apply initial signature

  // --- Right Column (Content) ---
  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const form = document.createElement("form");
  form.addEventListener("submit", (e) => e.preventDefault());

  // --- Name Field (Using Helper) ---
  form.appendChild(
    createFieldRow(
      "name",
      "Name",
      "The primary identifier for this entity.",
      [
        "h1",
        "input",
        entity.name || "",
        { placeholder: "Enter entity name..." }
      ]
    )
  );

  // --- Description Field (Using Helper) ---
  form.appendChild(
    createFieldRow(
      "description",
      "Description",
      "A brief overview of this entity.",
      [
        "p",
        "textarea",
        entity.description || "",
        {
          readClass: "profile-description-read",
          placeholder: "Describe the entity..."
        }
      ]
    )
  );

  // --- Sections (Using Helper) ---
  const secWrap = document.createElement("div");
  secWrap.className = "profile-fields";

  Object.entries(SECTION_DEFINITIONS).forEach(([key, def]) => {
    secWrap.appendChild(
      createFieldRow(
        key,
        def.label,
        def.sublabels[type] || "",
        [
          "div",
          "textarea",
          entity.sections?.[key] || "",
          { readClass: "profile-field-text-read" }
        ]
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
    replaceEventHandler(
      editBtn,
      "click",
      () => setEditMode(true),
      "_editHandler"
    );
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
      // This save handler is 100% correct.
      // It reads all values directly from the inputs, not the closure.
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
  newEntity.name = `${newEntity.name || "Untitled"} (Clone)`;

  return newEntity;
}

/**
 * This function is no longer called by the router but is kept
 * to prevent errors if it's referenced elsewhere.
 */
export async function renderForm(type, id) {
  console.warn("renderForm() is deprecated. Navigating to profile page.");
  router.navigate(`#profile/${type}/${id || "new"}`);
}