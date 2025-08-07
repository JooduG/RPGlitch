require('../apps/rpglitch/components/entity-form.js');
const { openEntityModal } = global;

describe('entity-form modal', () => {
  test('closes when cancel event fires', () => {
    const originalShowModal = HTMLDialogElement.prototype.showModal;
    const originalClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();

    openEntityModal('story', () => {});
    const dialog = document.getElementById('story-dialog');
    dialog.dispatchEvent(new Event('cancel'));

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
    expect(document.getElementById('story-dialog')).toBeNull();

    HTMLDialogElement.prototype.showModal = originalShowModal;
    HTMLDialogElement.prototype.close = originalClose;
  });
});

