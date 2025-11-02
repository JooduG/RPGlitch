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
  buildHero
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

function renderTagPills(container, tags) {
    if (!tags || tags.length === 0) return;
    const wrap = document.createElement("div");
    wrap.className = "form-tag-pills";
    tags.forEach((t) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = t;
      wrap.appendChild(chip);
    });
    container.appendChild(wrap);
}

export async function renderForm(type, id) { // <-- MADE ASYNC
  const cancelBtn = document.querySelector("#form-cancel");
  if (cancelBtn) {
    if (cancelBtn._cancelHandler) {
      cancelBtn.removeEventListener('click', cancelBtn._cancelHandler);
    }
    const cancelHandler = (e) => {
      e?.preventDefault();
      navigateBackOrReturnDefault(undefined, router);
    };
    cancelBtn.addEventListener("click", cancelHandler);
    cancelBtn._cancelHandler = cancelHandler;
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
  const heroWrap = buildHero(entity);

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
  const palettes = ["Default", "Pink", "Emerald", "Cyan"];
  palettes.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.toLowerCase();
    option.textContent = p;
    if ((entity.signatureColour || "default") === p.toLowerCase()) {
      option.selected = true;
    }
    paletteSelect.appendChild(option);
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
  form.appendChild(nameInput);

  const descriptionInput = document.createElement("textarea");
  descriptionInput.name = "description";
  descriptionInput.value = entity.description || "";
  descriptionInput.className = "profile-description";
  form.appendChild(descriptionInput);

  const tagsInput = document.createElement("input");
  tagsInput.name = "tags";
  tagsInput.value = (entity.tags || []).join(", ");
  const tagsField = createField("tags", "Tags", tagsInput);
  form.appendChild(tagsField);

  if (entity.tags && entity.tags.length > 0) {
    renderTagPills(tagsField, entity.tags);
  }

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
    if (saveBtn._saveHandler) {
      saveBtn.removeEventListener('click', saveBtn._saveHandler);
    }
    const saveHandler = async () => {
      try {
        const data = {
          kind: type,
          name: escapeHtml(form.elements.name.value.trim()),
          description: escapeHtml(form.elements.description.value.trim()),
          imageUrl: escapeHtml(imageInput.value.trim()),
          image: escapeHtml(imageInput.value.trim()),
          signatureColour: escapeHtml(paletteSelect.value.trim()),
          tags: form.elements.tags.value.split(",").map((t) => escapeHtml(t.trim())).filter(Boolean),
          sections: {
            forever: escapeHtml(form.elements.forever.value.trim()),
            past: escapeHtml(form.elements.past.value.trim()),
            present: escapeHtml(form.elements.present.value.trim()),
            future: escapeHtml(form.elements.future.value.trim()),
          },
        };
        if (!data.name) {
          alert('Please enter a name for this entity.');
          return;
        }

        const originalEntity = isEdit ? await entities.get(type, id) : null;
        const isEditingPremade = originalEntity?.isPremade;
        const entityToSave = (id === "new" || isEditingPremade) ? data : { ...data, id };
        const saved = await entities.upsert(type, entityToSave);
        router.navigate(`#profile/${type}/${saved.id}`);
      } catch (error) {
        console.error('Save failed:', error);
        alert(error.message || 'Failed to save. Please try again.');
      }
    };
    saveBtn.addEventListener("click", saveHandler);
    saveBtn._saveHandler = saveHandler;
  }

  if (!isEdit) {
    setTimeout(() => nameInput.focus(), 0);
  }
}
