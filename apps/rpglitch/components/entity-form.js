/* global module */
(function (global) {
  function openEntityModal(type, onSubmit) {
    const labels = { story: 'Title', character: 'Name', world: 'Title' };
    const dialog = document.createElement('dialog');
    dialog.id = `${type}-dialog`;
    dialog.innerHTML = `\n      <form method="dialog">\n        <label>${labels[type] || 'Title'} <input name="title" required /></label>\n        <menu>\n          <button type="reset" value="cancel">Cancel</button>\n          <button type="submit" value="default">Save</button>\n        </menu>\n      </form>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const close = () => {
      dialog.close();
      dialog.remove();
    };

    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      if (!title) return;
      if (typeof onSubmit === 'function') onSubmit({ title });
      close();
    });

    form.querySelector('button[value="cancel"]').addEventListener('click', (e) => {
      e.preventDefault();
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

