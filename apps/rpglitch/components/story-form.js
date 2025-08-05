/* global module */
(function(global){
  function openStoryModal(onSubmit){
    const dialog = document.createElement('dialog');
    dialog.id = 'story-dialog';
    dialog.innerHTML = `\n      <form method="dialog">\n        <label>Title <input name="title" required /></label>\n        <menu>\n          <button type="reset" value="cancel">Cancel</button>\n          <button type="submit" value="default">Save</button>\n        </menu>\n      </form>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const close = () => { dialog.close(); dialog.remove(); document.removeEventListener('keydown', onEsc); };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      if(!title) return;
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

  if (typeof module !== 'undefined' && module.exports){
    module.exports = { openStoryModal };
  }
  global.openStoryModal = openStoryModal;
})(typeof window !== 'undefined' ? window : globalThis);
