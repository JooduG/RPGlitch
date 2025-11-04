import {
  entities,
  getPictureHTML
} from './entities.js';
import {
  hideEl,
  showEl,
  getHashQuery,
  navigateBackOrReturnDefault,
  escapeHtml,
  applyBrand,
  buildHero,
  renderTags,
  replaceEventHandler,
  handleAsyncError,
  BASE_COLOUR_MAP
} from './utils.js';
import {
  router
} from './profile-router.js';
import {
  refreshAllLists
} from './index.js';

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

export async function renderForm(type, id) { // <-- MADE ASYNC
  const cancelBtn = document.querySelector("#form-cancel");
  if (cancelBtn) {
    const cancelHandler = (e) => {
      e?.preventDefault();
      navigateBackOrReturnDefault(undefined, router);
    };
    replaceEventHandler(cancelBtn, 'click', cancelHandler, '_cancelHandler');
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

  const screenId = type === "character" ? "character-form-screen" : "world-form-screen";
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
    const newPic = getPictureHTML ? getPictureHTML({ ...entity, imageUrl: val, image: val }, { cover: true }) : null;
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
    const placeholder = heroWrap.querySelector('.placeholder-image');
    if (placeholder && selectedColour && selectedColour !== 'default') {
      placeholder.style.backgroundColor = BASE_COLOUR_MAP[selectedColour];
    } else if (placeholder) {
      placeholder.style.backgroundColor = '';
    }

    // Update tag chip color
    const tagChip = heroWrap.querySelector('.tag-chip');
    if (tagChip && selectedColour && selectedColour !== 'default') {
      tagChip.style.backgroundColor = BASE_COLOUR_MAP[selectedColour];
      tagChip.style.color = 'white';
    } else if (tagChip) {
      tagChip.style.backgroundColor = '';
      tagChip.style.color = '';
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
  descriptionInput.placeholder = "Describe the entity, its background, personality...";
  form.appendChild(descriptionInput);

  // Note: tags are now rendered in the hero (left column) as a single tag pill
  // No need to render tags again in the form area

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

  const suppressDelete = id && sessionStorage?.getItem("rpglitch-no-delete") === id;
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
          console.error('Delete failed:', error);
          alert(error.message || 'Failed to delete. Please try again.');
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

      await handleAsyncError(async () => {
        // Validation inside async block for consistent error handling
        if (!data.name) {
          throw new Error('Please enter a name for this entity.');
        }

        const originalEntity = isEdit ? await entities.get(type, id) : null;
        const isEditingPremade = originalEntity?.isPremade;
        const entityToSave = (id === "new" || isEditingPremade) ? data : { ...data, id };
        const saved = await entities.upsert(type, entityToSave);
        router.navigate(`#profile/${type}/${saved.id}`);
      }, {
        errorMessage: 'Failed to save. Please try again.',
        context: 'save entity'
      });
    };
    replaceEventHandler(saveBtn, 'click', saveHandler, '_saveHandler');
  }

  if (!isEdit) {
    setTimeout(() => nameInput.focus(), 0);
  }
}
