import {
  entities,
  getPictureHTML
} from './entities.js';
import {
  hideEl,
  showEl,
  applyBrand,
  setProfileLayoutSizing,
  debounce,
  goBackWithFallback
} from './utils.js';
import {
  router
} from './profile-router.js';
import {
  copyEntity
} from './utils.js';

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

let profileResizeBound = false;
export function renderProfile(type, id) {
  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  const entity = entities.get(type, id);
  if (!entity) {
    router.navigate("#");
    return;
  }

  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.textContent = "";
  screen.setAttribute("aria-live", "polite");

  const layout = document.createElement("div");
  layout.className = "profile-layout";

  const leftCol = document.createElement("div");
  leftCol.className = "profile-left";
  const hero = buildHero(entity);
  leftCol.appendChild(hero);
  applyBrand?.(leftCol, entity);

  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const h1 = document.createElement("h1");
  h1.className = "profile-name";
  h1.textContent = entity.name || entity.title || "Empty";
  content.appendChild(h1);

  if (entity.summary) {
    const p = document.createElement("p");
    p.textContent = entity.summary;
    content.appendChild(p);
  }

  const sections = entity.sections || {};
  const secWrap = document.createElement("div");
  secWrap.className = "profile-sections";
  const SUB = {
    forever: "Timeless truth",
    past: "Backstory",
    present: "Current state",
    future: "Foreshadowing",
  };
  ["forever", "past", "present", "future"].forEach((key) => {
    const value = sections[key] !== undefined ? sections[key] : null;
    if (value) {
      const row = document.createElement("div");
      row.className = "section-row";
      const label = document.createElement("div");
      label.className = "section-label";
      const main = document.createElement("div");
      main.className = "section-label-main";
      main.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      const sub = document.createElement("div");
      sub.className = "section-sublabel";
      sub.textContent = SUB[key] || "";
      label.append(main, sub);
      const body = document.createElement("div");
      body.className = "section-content";
      body.textContent = value;
      row.append(label, body);
      secWrap.appendChild(row);
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
        debounce(() => setProfileLayoutSizing?.(0.35), 150)
      );
    }
  } catch {
    /* noop */
  }

  const backBtn = document.querySelector("#profile-back");
  const editBtn = document.querySelector("#profile-edit");
  const copyBtn = document.querySelector("#profile-copy");

  copyBtn?.addEventListener("click", () => copyEntity?.(type, id));
  if (copyBtn) copyBtn.hidden = !entity.isPremade;
  if (editBtn) editBtn.hidden = entity.isPremade;
  if (backBtn) backBtn.addEventListener("click", () => goBackWithFallback("#storyboard", "#storyboard", router));
  editBtn?.addEventListener("click", () => {
    router.navigate(
      `#form/${type}/${entity.id}?return=#profile/${type}/${entity.id}`
    );
  });
}
