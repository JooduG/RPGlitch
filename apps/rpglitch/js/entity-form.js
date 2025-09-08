import {
  entities,
  getPictureHTML
} from './entities.js';
import {
  hideEl,
  showEl,
  getHashQuery,
  navigateBackOrReturnDefault,
  sanitizeStr
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

export function renderForm(type, id) {
  const cancelBtn = document.querySelector("#form-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e?.preventDefault();
      navigateBackOrReturnDefault("#storyboard", router);
    });
  }

  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  const isEdit = id && id !== "new";
  const params = getHashQuery();
  const from = params.get("from");
  const template = !isEdit && from ? entities.copy(type, from) : null;
  const existing = isEdit ? entities.get(type, id) : template;

  const screenId =
    type === "character" ? "character-form-screen" : "world-form-screen";
  const screen = document.querySelector(`#${screenId}`);
  if (!screen) return;

  const entity = { ...(existing || {}),
    kind: type
  };
  screen.textContent = "";

  const heroWrap = buildHero(entity);
  screen.appendChild(heroWrap);

  const content = document.createElement("div");
  const h1 = document.createElement("h1");
  h1.textContent = isEdit ?
    `Editing ${type.charAt(0).toUpperCase() + type.slice(1)}` :
    `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  content.appendChild(h1);

  const form = document.createElement("form");

  const titleInput = document.createElement("input");
  titleInput.name = "name";
  titleInput.required = true;
  titleInput.value = entity.name || "";
  form.appendChild(createField("name", "Title", titleInput));

  const summaryInput = document.createElement("input");
  summaryInput.name = "summary";
  summaryInput.value = entity.summary || "";
  form.appendChild(createField("summary", "Summary", summaryInput));

  const imageInput = document.createElement("input");
  imageInput.name = "imageUrl";
  imageInput.type = "url";
  imageInput.value = entity.imageUrl || "";
  imageInput.addEventListener("change", () => {
    const val = imageInput.value.trim();
    const newPic = getPictureHTML ?
      getPictureHTML({ ...entity,
        imageUrl: val,
        image: val
      }, {
        cover: true
      }) :
      null;
    if (newPic) {
      const currentWrap = heroWrap.querySelector(".picture");
      if (currentWrap) currentWrap.replaceWith(newPic);
      else heroWrap.appendChild(newPic);
    }
  });
  form.appendChild(createField("imageUrl", "Image URL", imageInput));

  const tagsInput = document.createElement("input");
  tagsInput.name = "tags";
  tagsInput.value = (entity.tags || []).join(", ");
  form.appendChild(createField("tags", "Tags", tagsInput));

  SECTIONS.forEach(([label, key]) => {
    const textarea = document.createElement("textarea");
    textarea.name = key;
    textarea.value = entity.sections?.[key] || "";
    form.appendChild(createField(key, label, textarea));
  });

  content.appendChild(form);
  screen.appendChild(content);

  hideEl("#chin-container");
  hideEl("#profile-screen");
  hideEl(
    type === "character" ? "world-form-screen" : "character-form-screen"
  );
  showEl(screen);

  const saveBtn = document.querySelector("#form-save");
  const deleteBtn = document.querySelector("#form-delete");

  const suppressDelete =
    id && sessionStorage?.getItem("rpglitch-no-delete") === id;
  if (suppressDelete) sessionStorage.removeItem("rpglitch-no-delete");

  if (deleteBtn) {
    deleteBtn.hidden = !(isEdit && entity.isCustom && !suppressDelete);
    deleteBtn.addEventListener("click", () => {
      if (isEdit && confirm("Delete this item?")) {
        entities.remove(type, entity.id);
        refreshAllLists?.();
        router.navigate("#storyboard");
      }
    });
  }

  saveBtn?.addEventListener("click", () => {
    const data = {
      kind: type,
      name: sanitizeStr(titleInput.value.trim()),
      summary: sanitizeStr(summaryInput.value.trim()),
      imageUrl: sanitizeStr(imageInput.value.trim()),
      image: sanitizeStr(imageInput.value.trim()),
      tags: tagsInput.value
        .split(",")
        .map((t) => sanitizeStr(t.trim()))
        .filter(Boolean),
      sections: {
        forever: sanitizeStr(form.elements.forever.value.trim()),
        past: sanitizeStr(form.elements.past.value.trim()),
        present: sanitizeStr(form.elements.present.value.trim()),
        future: sanitizeStr(form.elements.future.value.trim()),
      },
    };
    if (!data.name) return;
    const saved = entities.upsert(
      type,
      id === "new" ? data : { ...data,
        id
      }
    );
    router.navigate(`#profile/${type}/${saved.id}`);
  });

  if (!isEdit) {
    setTimeout(() => titleInput.focus(), 0);
  }
}

function buildHero(entity) {
  const wrap = document.createElement("div");
  wrap.className = "hero-wrap";
  const pic = getPictureHTML ?
    getPictureHTML(entity, {
      cover: true
    }) :
    null;
  if (pic) {
    pic.classList?.add("hero-bleed");
    wrap.appendChild(pic);
  }
  const chips = Array.isArray(entity.tags) ? [...entity.tags] : [];
  if (entity.isPremade) chips.unshift("Premade");
  renderTags(wrap, chips);
  return wrap;
}

function renderTags(container, tags) {
  if (!tags || !tags.length) return;
  const wrap = document.createElement("div");
  wrap.className = "tag-chips";
  tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}
