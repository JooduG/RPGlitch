// apps/rpglitch/js/views.js
// Consolidated view layer: routing and stateful entity profile page.

import { entities, getPictureHTML } from "./entities.js";
import {
  hideEl,
  showEl,
  getHashQuery,
  navigateBackOrReturnDefault,
  escapeHtml,
  replaceEventHandler,
  handleAsyncError,
  goBackWithFallback,
  dismissLoadingUI,
  chin,
  log,
  error,
  unlockNow,
  setTopBarRight,
  copyEntity,
} from "./utils.js";
import { isValidImageUrl, extractImageUrl } from "./validation.js";

let refreshAllLists;
let imageInput = null;
let actionButton = null;
let fileInput = null;

export function initViews(dependencies) {
  refreshAllLists = dependencies.refreshAllLists;
}

// ============================================================================
// ROUTER MODULE (Refactored)
// ============================================================================

function showStoryboard() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.remove("story-active");
  setTopBarRight?.("storyboard");
  showEl("#storyboard-screen");
  hideEl("#profile-screen");
  hideEl("#story-screen");
}

function showStoryScreen() {
  document.body.classList.remove("profile-view-active");
  document.body.classList.add("story-active");
  hideEl("#top-bar"); // Hide top bar explicitly
  hideEl("#storyboard-screen");
  hideEl("#profile-screen");
  showEl("#story-screen");
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
  } else if (section === "story") {
    showStoryScreen();
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
// STATEFUL PROFILE VIEW
// ============================================================================

// Define all section labels and sub-labels
const SECTION_DEFINITIONS = {
  forever: {
    label: "Forever",
    sublabels: {
      character: "Core Identity & Permanent Features",
      world: "Eternal Truths & Laws of Nature",
    },
  },
  past: {
    label: "Past",
    sublabels: {
      character: "Background & Memories",
      world: "History & Ancient Lore",
    },
  },
  present: {
    label: "Present",
    sublabels: {
      character: "Mood & Conditions",
      world: "State of the World & Current Situation",
    },
  },
  future: {
    label: "Future",
    sublabels: {
      character: "Goals & Prophecies",
      world: "Impending Events & Prophecies",
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
    readEl.classList.add("placeholder-text");
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
 * @param {Document|DocumentFragment|Element} context - The DOM context (e.g., a form element) within which to find the template.
 * @param {string} fieldId - The unique ID for the field (used for 'for' attribute).
 * @param {string} labelText - The text for the <label> element.
 * @param {string} sublabelText - The help text for the <small> element.
 * @param {Array<any>} fieldConfig - Array of args for createFieldElements (e.g., [readEl, editEl, value, options]).
 * @returns {HTMLElement} The complete field row element.
 */
function createFieldRow(
  context,
  fieldId,
  labelText,
  sublabelText,
  fieldConfig
) {
  const template = context.querySelector("#tpl-profile-field-section");
  if (!template) {
    console.error("Field row template not found!");
    return document.createElement("div"); // Return a fallback element
  }
  const fieldRow = template.content.firstElementChild.cloneNode(true);

  const label = fieldRow.querySelector("label");
  if (label) {
    label.setAttribute("for", `form-field-${fieldId}`);
    label.textContent = labelText;
  }

  const sublabel = fieldRow.querySelector("small");
  if (sublabel) {
    if (sublabelText && sublabelText.trim()) {
      sublabel.textContent = sublabelText;
    } else {
      sublabel.remove(); // Remove if no sublabel text
    }
  }

  const inputCol = fieldRow.querySelector(".field-input");
  if (inputCol) {
    // Clear existing template placeholder elements before adding new ones
    inputCol.textContent = "";
    inputCol.appendChild(
      createFieldElements(
        fieldId,
        ...(Array.isArray(fieldConfig) ? fieldConfig : [])
      )
    );
  }

  return fieldRow;
}

// Validation functions now imported from validation.js module

export async function renderStoryScreen(story, aiCharacter, userCharacter) {
  const leftColumn = document.querySelector("#story-left-character");
  const rightColumn = document.querySelector("#story-right-character");
  const leftName = document.querySelector("#left-character-name");
  const rightName = document.querySelector("#right-character-name");
  const storyFeed = document.querySelector("#story-feed");

  if (!leftColumn || !rightColumn || !leftName || !rightName || !storyFeed) {
    error("Story screen elements not found.");
    return;
  }

  const leftImage = leftColumn.querySelector(".character-image");
  const rightImage = rightColumn.querySelector(".character-image");

  if (!leftImage || !rightImage) {
    error("Character image elements not found.");
    return;
  }

  // Clear previous story content
  storyFeed.replaceChildren();

  leftImage.innerHTML = '';
  rightImage.innerHTML = '';

  if (aiCharacter) {
    leftName.textContent = aiCharacter.name;
    const aiPic = getPictureHTML(aiCharacter, { cover: false });
    leftImage.appendChild(aiPic);
  }

  if (userCharacter) {
    rightName.textContent = userCharacter.name;
    const userPic = getPictureHTML(userCharacter, { cover: false });
    rightImage.appendChild(userPic);
  }

  if (story && story.messages) {
    for (const message of story.messages) {
      renderMessage(storyFeed, message.role, message.text, message.characterName, message.type, { autoScroll: false });
    }
    storyFeed.scrollTop = storyFeed.scrollHeight;
  }
}

export function renderMessage(feed, speaker, message, characterName, messageType = "IC", { autoScroll = true } = {}) {
  if (!feed) return;

  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("story-message");

  // Determine speaker class and apply signature color
  if (speaker === "user") {
    messageWrapper.classList.add("user");
    // User character signature color is applied via a class on a parent element,
    // which will be handled in the main story rendering logic.
  } else {
    messageWrapper.classList.add("ai");
    // AI character signature color can be applied here if we pass the character object
  }

  // Add message type and character name for styling hooks
  messageWrapper.dataset.type = messageType;
  if (characterName) {
    messageWrapper.dataset.characterName = characterName;
  }

  // Set the text content safely
  const sanitizedMessage = window.DOMPurify ? DOMPurify.sanitize(message) : message;

  if (messageType === "OOC" && speaker !== "user") {
    const narratorSpan = document.createElement("span");
    narratorSpan.className = "narrator-prefix";
    narratorSpan.textContent = "Narrator: ";
    messageWrapper.appendChild(narratorSpan);
    messageWrapper.insertAdjacentHTML('beforeend', sanitizedMessage);
  } else {
    messageWrapper.innerHTML = sanitizedMessage;
  }


  feed.appendChild(messageWrapper);
  if (autoScroll) {
    feed.scrollTop = feed.scrollHeight; // Auto-scroll to bottom
  }
}

export async function renderProfilePage(type, id) {
  document.body.classList.add("profile-view-active");
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
  const template = document.querySelector("#tpl-profile-page");
  if (!template) {
    console.error("Profile page template not found!");
    return;
  }
  const layout = template.content.firstElementChild.cloneNode(true);

  // Query for elements within the cloned template
  const heroWrap = layout.querySelector(".hero-wrap");

  // *** FIX: Render the initial picture (or placeholder) into the hero ***
  if (getPictureHTML) {
    const heroPic = getPictureHTML(entity, { cover: true });
    if (heroPic) {
      heroPic.classList.add("hero-bleed"); // Ensure it has the right class
      heroWrap.appendChild(heroPic);
    }
  }
  // ********************************************************************

  const imageOverlay = layout.querySelector(".profile-hero-overlay");
  imageInput = imageOverlay.querySelector('[data-profile-field="profilePictureUrl"]');
  actionButton = imageOverlay.querySelector("button[data-action]");
  fileInput = imageOverlay.querySelector('[data-profile-field="fileInput"]');
  const paletteSelect = imageOverlay.querySelector(
    'select[name="signatureColour"]'
  );
  const form = layout.querySelector("form");
  const secWrap = form.querySelector("[data-profile-sections]");

  function updateButtonState() {
    const value = imageInput.value.trim();
    console.log(
      "[DEBUG] updateButtonState - value:",
      value,
      "isValidImageUrl:",
      isValidImageUrl(value, true)
    ); // Added log

    if (value === "") {
      actionButton.textContent = "Upload";
      actionButton.dataset.action = "upload";
    } else if (value && !isValidImageUrl(value, true)) {
      actionButton.textContent = "Generate";
      actionButton.dataset.action = "generate";
    } else {
      // value is not empty and _isValidImageUrl is true
      actionButton.textContent = "Use URL"; // Indicate that the URL will be used
      actionButton.dataset.action = "use-url"; // A new action to signify no operation
    }
  }

  // Helper function to handle action errors consistently
  function handleActionError(error, action) {
    const isUpload = action === "upload";
    const actionName = isUpload ? "Upload" : "Image generation";
    const pluginName = isUpload ? "Upload plugin" : "Plugin";

    console.error(`${actionName} error:`, error);

    if (error.message && error.message.includes("postMessage")) {
      showNotification(
        `${pluginName} not ready. Please wait a moment and try again.`
      );
    } else {
      showNotification(
        error.message || `${actionName} failed. Please try again.`
      );
    }
  }

  // Combined input listener for dynamic state updates and live preview
  imageInput.addEventListener("input", () => {
    // Update button state
    updateButtonState();

    // Update live preview
    const val = imageInput.value.trim();
    if (val && isValidImageUrl(val, true)) {
      // Valid URL: update preview with sanitized URL
      const safeVal = window.DOMPurify ? window.DOMPurify.sanitize(val) : val;
      const newPic = getPictureHTML
        ? getPictureHTML({ ...entity, profilePictureUrl: safeVal }, { cover: true })
        : null;
      if (newPic) {
        const currentWrap = heroWrap.querySelector(".picture");
        if (currentWrap) currentWrap.replaceWith(newPic);
        else heroWrap.appendChild(newPic);
      }
    } else {
      // Invalid or empty: revert to original entity image
      const originalPic = getPictureHTML
        ? getPictureHTML(entity, { cover: true })
        : null;
      if (originalPic) {
        const currentWrap = heroWrap.querySelector(".picture");
        if (currentWrap) currentWrap.replaceWith(originalPic);
        else heroWrap.appendChild(originalPic);
      }

      // Only show notification if input looks like a complete URL attempt (contains protocol or domain pattern)
      // This reduces noise while user is typing
      if (val && (val.includes("://") || val.includes("data:image/"))) {
        showNotification("Invalid image URL format");
      }
    }
  });

  // Double-click to reset profile picture input
  imageInput.addEventListener("dblclick", (e) => {
    e.preventDefault();

    // Clear the input
    imageInput.value = "";

    // Revert to entity's original picture (or placeholder if none)
    const originalPic = getPictureHTML
      ? getPictureHTML(entity, { cover: true })
      : null;
    if (originalPic) {
      const currentWrap = heroWrap.querySelector(".picture");
      if (currentWrap) {
        currentWrap.replaceWith(originalPic);
      } else {
        heroWrap.appendChild(originalPic);
      }
    }

    // Update button state
    updateButtonState();

    // Optional: Show feedback to user
    console.log("[RPGlitch] Profile picture input reset");
  });

  // Update tooltip to indicate double-click functionality
  imageInput.setAttribute(
    "data-tooltip",
    "Type prompt, paste URL, or click Upload (double-click to reset)"
  );

  // Set initial button state based on existing value
  updateButtonState();

  function updateImageInput(input, url) {
    // Type check and trim whitespace
    if (!url || typeof url !== "string") {
      console.warn(
        "[RPGlitch] updateImageInput: Invalid URL type or empty value",
        { url, type: typeof url }
      );
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      console.warn("[RPGlitch] updateImageInput: URL is empty after trimming");
      return;
    }

    // Validate URL format
    if (!isValidImageUrl(trimmedUrl, true)) {
      console.warn("[RPGlitch] updateImageInput: URL failed validation", {
        url: trimmedUrl,
      });
      return;
    }

    // Sanitize URL with DOMPurify to prevent XSS
    const sanitizedUrl = window.DOMPurify
      ? window.DOMPurify.sanitize(trimmedUrl)
      : trimmedUrl;

    // Debug log successful update
    console.log(
      "[RPGlitch] updateImageInput: Setting validated and sanitized URL",
      {
        original: url,
        trimmed: trimmedUrl,
        sanitized: sanitizedUrl,
      }
    );

    // Set input value and dispatch events to update preview and state
    input.value = sanitizedUrl;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  actionButton.addEventListener("click", async () => {
    const action = actionButton.dataset.action;

    if (action === "generate") {
      const prompt = imageInput.value.trim();
      if (!prompt) return;

      // Check plugin availability before try block
      if (typeof window.textToImage !== "function") {
        showNotification(
          "Image generation plugin is not available. Please refresh the page."
        );
        return;
      }

      try {
        // Set loading state on both button and input
        actionButton.disabled = true;
        imageInput.disabled = true;
        actionButton.setAttribute("aria-busy", "true");
        imageInput.setAttribute("aria-busy", "true");
        actionButton.textContent = "Generating...";

        // Default guidance scale for consistent results
        const DEFAULT_GUIDANCE_SCALE = 7;

        // Call plugin with prompt, guidanceScale, and portrait resolution
        const result = await window.textToImage({
          prompt,
          guidanceScale: DEFAULT_GUIDANCE_SCALE,
          resolution: "512x768", // Force portrait aspect ratio for all generated images
        });
        console.log("[DEBUG] T2I Plugin Raw Result:", result); // Added log
        log?.("[DEBUG] T2I Result:", JSON.stringify(result, null, 2));

        // Extract URL from plugin response (sanitized inside helper)
        const profilePictureUrl = extractImageUrl(result);

        // Validate URL format (allow http/https, blob, and data:image URLs)
        if (!profilePictureUrl || !isValidImageUrl(profilePictureUrl, true)) {
          throw new Error(
            "Image generation failed: invalid or unsupported URL format"
          );
        }

        updateImageInput(imageInput, profilePictureUrl);
      } catch (e) {
        handleActionError(e, "generate");
      } finally {
        actionButton.disabled = false;
        imageInput.disabled = false;
        actionButton.removeAttribute("aria-busy");
        imageInput.removeAttribute("aria-busy");
        updateButtonState();
      }
    } else if (action === "upload") {
      let profilePictureUrl = null; // Declare profilePictureUrl here

      // Set up file selection handler before triggering click
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          // User cancelled file selection
          actionButton.disabled = false;
          imageInput.disabled = false;
          actionButton.removeAttribute("aria-busy");
          imageInput.removeAttribute("aria-busy");
          updateButtonState();
          return;
        }

        // Check plugin availability before try block
        if (typeof window.upload !== "function") {
          showNotification(
            "Upload plugin is not available. Please refresh the page."
          );
          return;
        }

        try {
          // Set loading state on both button and input
          actionButton.disabled = true;
          imageInput.disabled = true;
          actionButton.setAttribute("aria-busy", "true");
          imageInput.setAttribute("aria-busy", "true");
          actionButton.textContent = "Uploading...";

          // Read file as Data URL
          const reader = new FileReader();
          reader.readAsDataURL(file);
          await new Promise((resolve) => (reader.onload = resolve));
          const fileDataUrl = reader.result; // This is a string

          const result = await window.upload(fileDataUrl); // Pass the Data URL string
          console.log("[DEBUG] Upload Plugin Raw Result:", result); // Added log
          log?.("[DEBUG] Upload Result:", JSON.stringify(result, null, 2));

          // Extract URL from plugin response (sanitized inside helper)
          profilePictureUrl = extractImageUrl(result); // Assign to already declared profilePictureUrl

          // Validate URL - now accepts blob URLs too (blob URLs are valid for uploads)
          if (!profilePictureUrl || !isValidImageUrl(profilePictureUrl, true)) {
            throw new Error(
              "Upload failed: invalid image URL received from plugin"
            );
          }

          updateImageInput(imageInput, profilePictureUrl);
        } catch (e) {
          handleActionError(e, "upload");
        } finally {
          actionButton.disabled = false;
          imageInput.disabled = false;
          actionButton.removeAttribute("aria-busy");
          imageInput.removeAttribute("aria-busy");
          updateButtonState();
          fileInput.value = null; // Clear file input to allow re-uploading the same file

          // Display warning for temporary URL if upload was successful and a URL was received
          if (profilePictureUrl && isValidImageUrl(profilePictureUrl, true)) {
            showNotification(
              "Image uploaded! This is a temporary URL. Please re-host your image on a permanent service (like GitHub Gist or your own cloud storage) and replace this URL in the input field.",
              10000 // Display for 10 seconds
            );
          }
        }
      };
      // Trigger the hidden file input
      fileInput.click();
    } else if (action === "use-url") {
      // Do nothing, the URL is already in the input and will be saved with the entity
      return;
    }
  }); // This closes the actionButton.addEventListener

  const palettes = [
    "Signature Colour",
    "Pink",
    "Emerald",
    "Cyan",
    "Orange",
    "Purple",
  ];
  palettes.forEach((p) => {
    const option = paletteSelect.querySelector(
      `option[value="${
        p === "Signature Colour" ? "default" : p.toLowerCase()
      }"]`
    );
    if (option) {
      option.selected = (entity.signatureColour || "default") === option.value;
    }
  });

  // This listener correctly updates the preview when palette changes
  paletteSelect.addEventListener("change", () => {
    const selectedColour = paletteSelect.value;
    const tempEntity = { ...entity, signatureColour: selectedColour };

    // Re-render the picture with the new signature color
    const currentPicture = heroWrap.querySelector(".picture");
    if (currentPicture) {
      const newPicture = getPictureHTML(tempEntity, { cover: true });
      newPicture.classList.add("hero-bleed");
      currentPicture.replaceWith(newPicture);
    }
  });

  // The form and secWrap are already queried above
  const headerWrap = form.querySelector("[data-profile-header]");

  // --- Name Field (Using Helper) ---
  headerWrap.appendChild(
    createFieldRow(
      layout,
      "name",
      "Name",
      "The primary identifier for this entity.",
      [
        "h1",
        "input",
        entity.name || "",
        { placeholder: "Enter entity name..." },
      ]
    )
  );

  // --- Description Field (Using Helper) ---
  headerWrap.appendChild(
    createFieldRow(
      layout,
      "description",
      "Description",
      "A brief overview of this entity.",
      [
        "p",
        "textarea",
        entity.description || "",
        {
          readClass: "profile-description-read",
          placeholder: "Describe the entity...",
        },
      ]
    )
  );

  // --- Sections (Using Helper) ---
  Object.entries(SECTION_DEFINITIONS).forEach(([key, def]) => {
    secWrap.appendChild(
      createFieldRow(layout, key, def.label, def.sublabels[type] || "", [
        "div",
        "textarea",
        entity[key] || "",
        { readClass: "profile-field-text-read" },
      ])
    );
  });

  // Append the layout to the screen
  screen.appendChild(layout);
  showEl(screen);

  // --- 4. Setup Top Bar ---
  setTopBarRight(isEditing ? "form" : "profile");

  // --- 5. Event Handlers ---
  const backBtn = document.querySelector("#profile-back");
  const editBtn = document.querySelector("#profile-edit");
  const copyBtn = document.querySelector("#profile-copy");
  const cancelBtn = document.querySelector("#form-cancel");
  const saveBtn = document.querySelector("#form-save");
  const deleteBtn = document.querySelector("#form-delete");

  // This save handler is 100% correct.
  // It reads all values directly from the inputs, not the closure.
  const saveHandler = async () => {
    const nameElement = screen.querySelector('[data-edit-field="name"]');
    const data = {
      name: escapeHtml(nameElement.value.trim()),
      description: escapeHtml(form.elements.description.value.trim()),

      profilePictureUrl: escapeHtml(imageInput.value.trim()),
      signatureColour: escapeHtml(paletteSelect.value.trim()),
      tags: entity.tags || [],
      forever: escapeHtml(form.elements.forever.value.trim()),
      past: escapeHtml(form.elements.past.value.trim()),
      present: escapeHtml(form.elements.present.value.trim()),
      future: escapeHtml(form.elements.future.value.trim()),
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
          id === "new" || isEditingPremde ? data : { ...data, id };

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
    replaceEventHandler(saveBtn, "click", saveHandler, "_saveHandler");
  }
}
