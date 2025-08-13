(function (global) {
  const App = global.App || (global.App = {});

  function showStoryboard() {
    App.setTopBarRight('storyboard');
    App.showEl('chin-container');
    App.hideEl('profile-screen');
    App.hideEl('character-form-screen');
    App.hideEl('world-form-screen');
  }

  function renderTags(container, tags) {
    if (!tags || tags.length === 0) return;
    const ul = document.createElement('ul');
    ul.className = 'profile-tags';
    tags.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function renderSections(container, sections) {
    const order = [
      ['Forever', 'forever'],
      ['Past', 'past'],
      ['Present', 'present'],
      ['Future', 'future']
    ];
    order.forEach(([label, key]) => {
      const text = sections && sections[key];
      if (!text) return;
      const field = document.createElement('div');
      field.className = 'profile-field';
      const l = document.createElement('div');
      l.className = 'profile-field-label';
      l.textContent = label;
      const body = document.createElement('div');
      body.textContent = text;
      field.append(l, body);
      container.appendChild(field);
    });
  }

  function renderProfile(type, id) {
    const entity = App.entities.get(type, id);
    if (!entity) {
      showStoryboard();
      return;
    }
    const screen = document.getElementById('profile-screen');
    if (!screen) return;
    screen.textContent = '';

    const bg = document.createElement('div');
    bg.className = 'profile-background';
    const img = global.getPictureHTML ? global.getPictureHTML(entity, null, 'profile-background') : null;
    if (img) bg.appendChild(img);
    screen.appendChild(bg);

    const content = document.createElement('div');
    content.className = 'profile-content-overlay';
    const h1 = document.createElement('h1');
    h1.textContent = entity.name || entity.title || '';
    content.appendChild(h1);
    renderTags(content, entity.tags);
    if (entity.summary) {
      const p = document.createElement('p');
      p.className = 'profile-description';
      p.textContent = entity.summary;
      content.appendChild(p);
    }
    renderSections(content, entity.sections || {});
    screen.appendChild(content);

    App.hideEl('chin-container');
    App.hideEl('character-form-screen');
    App.hideEl('world-form-screen');
    App.showEl(screen);
    App.setTopBarRight('profile');

    const editBtn = document.getElementById('profile-edit');
    const copyBtn = document.getElementById('profile-copy');
    const backBtn = document.getElementById('profile-back');
    [editBtn, copyBtn].forEach(App.hideEl);
    if (entity.isPremade) App.showEl(copyBtn);
    else App.showEl(editBtn);
    const goBack = () => {
      if (history.length > 1) history.back();
      else App.router.navigate('#storyboard');
    };
    backBtn.onclick = goBack;
    editBtn.onclick = () => { App.router.navigate(`#form/${type}/${entity.id}`); };
    copyBtn.onclick = () => {
      const copy = {
        ...entity,
        id: undefined,
        isCustom: true,
        isPremade: false,
        baseId: entity.id,
        name: `${entity.name || entity.title} (Copy)`,
        title: `${entity.name || entity.title} (Copy)`
      };
      const saved = App.entities.create(type, copy);
      try { global.sessionStorage?.setItem('rpglitch-no-delete', saved.id); } catch { /* no sessionStorage */ }
      App.refreshAllLists?.();
      App.router.navigate(`#form/${type}/${saved.id}`);
    };
  }

  function createField(id, labelText, inputEl) {
    const field = document.createElement('div');
    field.className = 'profile-field';
    const label = document.createElement('label');
    label.className = 'profile-field-label';
    label.setAttribute('for', id);
    label.textContent = labelText;
    inputEl.id = id;
    field.append(label, inputEl);
    return field;
  }

  function renderForm(type, id) {
    const isEdit = Boolean(id);
    const entity = id ? App.entities.get(type, id) || { type } : { type };
    const screenId = type === 'character' ? 'character-form-screen' : 'world-form-screen';
    const screen = document.getElementById(screenId);
    if (!screen) return;
    screen.textContent = '';

    const bg = document.createElement('div');
    bg.className = 'profile-background';
    const img = global.getPictureHTML ? global.getPictureHTML(entity, null, 'profile-background') : null;
    if (img) bg.appendChild(img);
    screen.appendChild(bg);

    const content = document.createElement('div');
    content.className = 'profile-content-overlay';

    const form = document.createElement('form');

    const h1 = document.createElement('h1');
    h1.textContent = entity.name || entity.title || '';
    const status = document.createElement('small');
    status.className = 'card-title--editing';
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    status.textContent = isEdit ? `Editing ${typeLabel}` : `New ${typeLabel}`;
    h1.append(' ', status);
    content.appendChild(h1);

    const titleInput = document.createElement('input');
    titleInput.name = 'name';
    titleInput.required = true;
    titleInput.value = entity.name || entity.title || '';
    form.appendChild(createField('name', 'Title', titleInput));
    titleInput.addEventListener('input', () => {
      h1.childNodes[0].textContent = titleInput.value || '';
    });

    const summaryInput = document.createElement('input');
    summaryInput.name = 'summary';
    summaryInput.value = entity.summary || '';
    form.appendChild(createField('summary', 'Summary', summaryInput));

    const imageInput = document.createElement('input');
    imageInput.name = 'imageUrl';
    imageInput.type = 'url';
    imageInput.value = entity.imageUrl || '';
    imageInput.addEventListener('change', () => {
      if (img) img.src = imageInput.value;
    });
    form.appendChild(createField('imageUrl', 'Image URL', imageInput));

    const tagsInput = document.createElement('input');
    tagsInput.name = 'tags';
    tagsInput.value = (entity.tags || []).join(', ');
    form.appendChild(createField('tags', 'Tags', tagsInput));

    const sections = entity.sections || {};
    ['forever', 'past', 'present', 'future'].forEach((key) => {
      const textarea = document.createElement('textarea');
      textarea.name = key;
      textarea.value = sections[key] || '';
      form.appendChild(createField(key, key.charAt(0).toUpperCase() + key.slice(1), textarea));
    });

    content.appendChild(form);
    screen.appendChild(content);

    App.hideEl('chin-container');
    App.hideEl('profile-screen');
    App.hideEl(type === 'character' ? 'world-form-screen' : 'character-form-screen');
    App.showEl(screen);
    App.setTopBarRight('form');

    const saveBtn = document.getElementById('form-save');
    const cancelBtn = document.getElementById('form-cancel');
    const deleteBtn = document.getElementById('form-delete');
    const suppressDelete = id && global.sessionStorage?.getItem('rpglitch-no-delete') === id;
    if (suppressDelete) global.sessionStorage.removeItem('rpglitch-no-delete');
    if (deleteBtn) deleteBtn.hidden = !(isEdit && entity.isCustom && !suppressDelete);

    const goBack = () => {
      if (history.length > 1) history.back();
      else App.router.navigate('#storyboard');
    };
    cancelBtn.onclick = goBack;
    saveBtn.onclick = () => {
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
      let saved;
      if (isEdit) saved = App.entities.update(type, entity.id, data);
      else saved = App.entities.create(type, data);
      App.refreshAllLists?.();
      if (saved) App.router.navigate(`#profile/${type}/${saved.id}`);
    };
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (isEdit && confirm('Delete this item?')) {
          App.entities.remove(type, entity.id);
          App.refreshAllLists?.();
          App.router.navigate('#storyboard');
        }
      };
    }
  }

  function handleRoute() {
    const hash = global.location.hash.slice(1);
    const parts = hash.split('/').filter(Boolean);
    const [section, type, id] = parts;
    const isType = (t) => t === 'character' || t === 'world';
    if (section === 'profile' && isType(type) && id) {
      renderProfile(type, id);
      return;
    }
    if (section === 'form' && isType(type)) {
      if (id === 'new') {
        renderForm(type);
        return;
      }
      if (id) {
        renderForm(type, id);
        return;
      }
    }
    if (section === 'storyboard') {
      showStoryboard();
      return;
    }
    showStoryboard();
  }

  global.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', handleRoute);

  App.router = {
    navigate(hash) {
      global.location.hash = hash;
    },
    handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
