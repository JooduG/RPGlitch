/* global module */
(function (global) {
  function openEntityModal(type, onSubmit) {
    const labels = { story: 'Title', character: 'Name', world: 'Title' };
    const dialog = document.createElement('dialog');
    dialog.id = `${type}-dialog`;

    const form = document.createElement('form');
    form.method = 'dialog';

    const label = document.createElement('label');
    label.textContent = `${labels[type] || 'Title'} `;

    const input = document.createElement('input');
    input.name = 'title';
    input.required = true;
    label.appendChild(input);

    const menu = document.createElement('menu');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.value = 'cancel';
    cancelButton.textContent = 'Cancel';

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.value = 'default';
    saveButton.textContent = 'Save';

    menu.append(cancelButton, saveButton);
    form.append(label, menu);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    const close = () => {
      dialog.close();
      dialog.remove();
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      if (!title) return;
      if (typeof onSubmit === 'function') onSubmit({ title });
      close();
    });

    cancelButton.addEventListener('click', () => {
      close();
    });

    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

    dialog.showModal();
  }

  function openStoryModal(onSubmit) { return openEntityModal('story', onSubmit); }
  function openCharacterModal(onSubmit) { return openEntityModal('character', onSubmit); }
  function openWorldModal(onSubmit) { return openEntityModal('world', onSubmit); }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { openEntityModal, openStoryModal, openCharacterModal, openWorldModal };
  }
  global.openEntityModal = openEntityModal;
  global.openStoryModal = openStoryModal;
  global.openCharacterModal = openCharacterModal;
  global.openWorldModal = openWorldModal;
})(typeof window !== 'undefined' ? window : globalThis);
