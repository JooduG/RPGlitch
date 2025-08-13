(function (global) {
  const App = global.App || (global.App = {});
  const doc = global.document;

  function renderTags(container, tags) {
    if (!tags || !tags.length) return;
    const wrap = doc.createElement('div');
    wrap.className = 'tag-chips';
    tags.forEach((t) => {
      const chip = doc.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = t;
      wrap.appendChild(chip);
    });
    container.appendChild(wrap);
  }

  function buildHero(entity) {
    const wrap = doc.createElement('div');
    wrap.className = 'hero-wrap';
    const img = doc.createElement('img');
    img.className = 'hero-bleed';
    img.alt = entity.name || '';
    img.src = entity.imageUrl || '';
    wrap.appendChild(img);
    renderTags(wrap, entity.tags || []);
    return wrap;
  }

  function renderProfile(type, id) {
    const entity = App.entities.get(type, id);
    if (!entity) {
      App.router?.navigate('#');
      return;
    }
    const screen = doc.getElementById('profile-screen');
    if (!screen) return;
    screen.textContent = '';
    screen.appendChild(buildHero(entity));
    const content = doc.createElement('div');
    const h1 = doc.createElement('h1');
    h1.textContent = entity.name || '';
    content.appendChild(h1);
    if (entity.summary) {
      const p = doc.createElement('p');
      p.textContent = entity.summary;
      content.appendChild(p);
    }
    const sections = entity.sections || {};
    [['Forever', 'forever'], ['Past', 'past'], ['Present', 'present'], ['Future', 'future']].forEach(([label, key]) => {
      if (!sections[key]) return;
      const field = doc.createElement('div');
      field.className = 'profile-field';
      const l = doc.createElement('div');
      l.className = 'profile-field-label';
      l.textContent = label;
      const body = doc.createElement('div');
      body.textContent = sections[key];
      field.append(l, body);
      content.appendChild(field);
    });
    screen.appendChild(content);
    App.hideEl('chin-container');
    App.hideEl('character-form-screen');
    App.hideEl('world-form-screen');
    App.showEl(screen);
    const backBtn = doc.getElementById('profile-back');
    const editBtn = doc.getElementById('profile-edit');
    const copyBtn = doc.getElementById('profile-copy');
    if (editBtn) editBtn.hidden = true;
    if (copyBtn) copyBtn.hidden = true;
    if (entity.isPremade) { if (copyBtn) copyBtn.hidden = false; }
    else { if (editBtn) editBtn.hidden = false; }
    if (backBtn) backBtn.onclick = () => { if (history.length > 1) history.back(); else App.router.navigate('#storyboard'); };
    if (editBtn) editBtn.onclick = () => App.router.navigate(`#form/${type}/${entity.id}`);
    if (copyBtn) copyBtn.onclick = () => {
      const copy = { ...entity, id: undefined, isCustom: true, isPremade: false, baseId: entity.id, name: `${entity.name || entity.title} (Copy)` };
      const saved = App.entities.upsert(type, copy);
        try { global.sessionStorage?.setItem('rpglitch-no-delete', saved.id); } catch { /* no sessionStorage */ }
      App.refreshAllLists?.();
      App.router.navigate(`#form/${type}/${saved.id}`);
    };
  }

  function createField(id, labelText, inputEl) {
    const field = doc.createElement('div');
    field.className = 'profile-field';
    const label = doc.createElement('label');
    label.className = 'profile-field-label';
    label.setAttribute('for', id);
    label.textContent = labelText;
    inputEl.id = id;
    field.append(label, inputEl);
    return field;
  }

  function renderForm(type, id) {
    const isEdit = id && id !== 'new';
    const existing = isEdit ? App.entities.get(type, id) : {};
    const screenId = type === 'character' ? 'character-form-screen' : 'world-form-screen';
    const screen = doc.getElementById(screenId);
    if (!screen) return;
    const entity = existing || {};
    screen.textContent = '';
    screen.appendChild(buildHero(entity));
    const content = doc.createElement('div');
    const h1 = doc.createElement('h1');
    h1.textContent = isEdit ? `Editing ${type.charAt(0).toUpperCase() + type.slice(1)}` : `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    content.appendChild(h1);
    const form = doc.createElement('form');
    const titleInput = doc.createElement('input');
    titleInput.name = 'name';
    titleInput.required = true;
    titleInput.value = entity.name || '';
    form.appendChild(createField('name', 'Title', titleInput));
    const summaryInput = doc.createElement('input');
    summaryInput.name = 'summary';
    summaryInput.value = entity.summary || '';
    form.appendChild(createField('summary', 'Summary', summaryInput));
    const imageInput = doc.createElement('input');
    imageInput.name = 'imageUrl';
    imageInput.type = 'url';
    imageInput.value = entity.imageUrl || '';
    imageInput.addEventListener('change', () => {
      const img = screen.querySelector('.hero-bleed');
      if (img) img.src = imageInput.value;
    });
    form.appendChild(createField('imageUrl', 'Image URL', imageInput));
    const tagsInput = doc.createElement('input');
    tagsInput.name = 'tags';
    tagsInput.value = (entity.tags || []).join(', ');
    form.appendChild(createField('tags', 'Tags', tagsInput));
    ['forever', 'past', 'present', 'future'].forEach((key) => {
      const textarea = doc.createElement('textarea');
      textarea.name = key;
      textarea.value = entity.sections?.[key] || '';
      form.appendChild(createField(key, key.charAt(0).toUpperCase() + key.slice(1), textarea));
    });
    content.appendChild(form);
    screen.appendChild(content);
    App.hideEl('chin-container');
    App.hideEl('profile-screen');
    App.hideEl(type === 'character' ? 'world-form-screen' : 'character-form-screen');
    App.showEl(screen);
    const saveBtn = doc.getElementById('form-save');
    const cancelBtn = doc.getElementById('form-cancel');
    const deleteBtn = doc.getElementById('form-delete');
    const suppressDelete = id && global.sessionStorage?.getItem('rpglitch-no-delete') === id;
    if (suppressDelete) global.sessionStorage.removeItem('rpglitch-no-delete');
      if (deleteBtn) deleteBtn.hidden = !(isEdit && entity.isCustom && !suppressDelete);
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          if (history.length > 1) history.back();
          else App.router.navigate('#storyboard');
        };
      }
      if (saveBtn) saveBtn.onclick = () => {
      const data = {
        name: titleInput.value.trim(),
        summary: summaryInput.value.trim(),
        imageUrl: imageInput.value.trim(),
        tags: tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean),
        sections: {
          forever: form.elements.forever.value.trim(),
          past: form.elements.past.value.trim(),
          present: form.elements.present.value.trim(),
          future: form.elements.future.value.trim()
        }
      };
      if (!data.name) return;
      const saved = App.entities.upsert(type, isEdit ? { ...data, id: entity.id } : data);
      App.refreshAllLists?.();
      if (saved) App.router.navigate(`#profile/${type}/${saved.id}`);
    };
    if (deleteBtn) deleteBtn.onclick = () => {
      if (isEdit && confirm('Delete this item?')) {
        App.entities.remove(type, entity.id);
        App.refreshAllLists?.();
        App.router.navigate('#storyboard');
      }
    };
  }

  App.renderProfile = renderProfile;
  App.renderForm = renderForm;
})(typeof window !== 'undefined' ? window : globalThis);
