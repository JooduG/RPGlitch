/* global module */
(function(global){
  function openCharacterModal(onSubmit){
    const dialog = document.createElement('dialog');
    dialog.id = 'character-dialog';
    dialog.innerHTML = `\n      <form method="dialog">\n        <label>Title <input name="title" required /></label>\n        <menu>\n          <button type="reset" value="cancel">Cancel</button>\n          <button type="submit" value="default">Save</button>\n        </menu>\n      </form>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
const close = () => { dialog.close(); dialog.remove(); };

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
    module.exports = { openCharacterModal };
  }
  global.openCharacterModal = openCharacterModal;
})(typeof window !== 'undefined' ? window : globalThis);
