/* eslint-env browser */
(function (global) {
  const App = global.App || (global.App = {});
  const doc = global.document;
  const SECTIONS = [
    ['Forever', 'forever'],
    ['Past', 'past'],
    ['Present', 'present'],
    ['Future', 'future']
  ];

  const getHashQuery = App.getHashQuery || function getHashQuery() {
    const [, q = ''] = (global.location.hash || '').split('?');
    return new URLSearchParams(q);
  };

  function navigateBackOrReturnDefault() {
    const ret = getHashQuery().get('return');
    if (ret) return App.router.navigate(ret);
    if (global.history.length > 1) return global.history.back();
    return App.router.navigate('#storyboard');
  }

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
    const pic = App.getPictureHTML ? App.getPictureHTML(entity, { cover: true }) : null;
    if (pic) {
      pic.classList?.add('hero-bleed');
      wrap.appendChild(pic);
    }
    renderTags(wrap, entity.tags || []);
    return wrap;
  }

  function renderProfile(type, id) {
    const sb = doc.getElementById('storyboard-screen');
    if (sb) App.hideEl(sb);
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
    h1.textContent = entity.name || entity.title || 'Empty';
    content.appendChild(h1);
    if (entity.summary) {
      const p = doc.createElement('p');
      p.textContent = entity.summary;
      content.appendChild(p);
    }
    const sections = entity.sections || {};
    SECTIONS.forEach(([label, key]) => {
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
    screen.dataset.entityId = entity.id || '';
    App.showEl(screen);
    const backBtn = doc.getElementById('profile-back');
    const editBtn = doc.getElementById('profile-edit');
    const copyBtn = doc.getElementById('profile-copy');
    if (copyBtn) copyBtn.hidden = !entity.isPremade;
    if (editBtn) editBtn.hidden = entity.isPremade;
    if (backBtn) backBtn.onclick = App.navigateBackOrReturnDefault;
    editBtn?.addEventListener('click', () => {
      App.router.navigate(`#form/${type}/${entity.id}?return=#profile/${type}/${entity.id}`);
    });
    copyBtn?.addEventListener('click', () => {
      App.router.navigate(`#form/${entity.kind}/new?from=${entity.id}&return=#profile/${type}/${entity.id}`);
    });
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
    const sb = doc.getElementById('storyboard-screen');
    if (sb) App.hideEl(sb);
    const isEdit = id && id !== 'new';
    const params = getHashQuery();
    const from = params.get('from');
    const template = !isEdit && from ? App.entities.copy(type, from) : null;
    const existing = isEdit ? App.entities.get(type, id) : template;
    const screenId = type === 'character' ? 'character-form-screen' : 'world-form-screen';
    const screen = doc.getElementById(screenId);
    if (!screen) return;
    const entity = { ...(existing || {}), kind: type };
    screen.textContent = '';
    const heroWrap = buildHero(entity);
    screen.appendChild(heroWrap);
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
      const val = imageInput.value.trim();
        const newEl = App.getPictureHTML
          ? App.getPictureHTML({ ...entity, imageUrl: val, image: val }, { cover: true })
          : null;
      if (newEl) {
        const current = heroWrap.querySelector('.entity-image, .placeholder-image');
        if (current) current.replaceWith(newEl);
        else heroWrap.appendChild(newEl);
      }
    });
    form.appendChild(createField('imageUrl', 'Image URL', imageInput));

    const tagsInput = doc.createElement('input');
    tagsInput.name = 'tags';
    tagsInput.value = (entity.tags || []).join(', ');
    form.appendChild(createField('tags', 'Tags', tagsInput));

    SECTIONS.forEach(([label, key]) => {
      const textarea = doc.createElement('textarea');
      textarea.name = key;
      textarea.value = entity.sections?.[key] || '';
      form.appendChild(createField(key, label, textarea));
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
    if (cancelBtn) cancelBtn.onclick = navigateBackOrReturnDefault;
    saveBtn?.addEventListener('click', () => {
      const data = {
        kind: type,
        name: titleInput.value.trim(),
        summary: summaryInput.value.trim(),
        imageUrl: imageInput.value.trim(),
        image: imageInput.value.trim(),
        tags: tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean),
        sections: {
          forever: form.elements.forever.value.trim(),
          past: form.elements.past.value.trim(),
          present: form.elements.present.value.trim(),
          future: form.elements.future.value.trim()
        },
        isCustom: true,
        isPremade: false
      };
      if (!data.name) return;
      if (isEdit) data.id = entity.id;
      const saved = App.entities.upsert(type, data);
      App.refreshAllLists?.();
      if (saved) App.router.navigate(`#profile/${type}/${saved.id}`);
    });
    if (deleteBtn) deleteBtn.onclick = () => {
      if (isEdit && global.confirm('Delete this item?')) {
        App.entities.remove(type, entity.id);
        App.refreshAllLists?.();
        App.router.navigate('#storyboard');
      }
    };
  }

  App.renderProfile = renderProfile;
  App.renderForm = renderForm;
  App.navigateBackOrReturnDefault = navigateBackOrReturnDefault;
})(typeof window !== 'undefined' ? window : globalThis);

