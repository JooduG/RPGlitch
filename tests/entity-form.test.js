const {
  openEntityModal
} = require('../apps/rpglitch/components/entity-form.js');

describe('entity-form modal', () => {
  test('removes keydown listener after close', () => {

    const showModalSpy = jest.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(jest.fn());
    const closeSpy = jest.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(jest.fn());
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    for (let i = 0; i < 2; i++) {
      openEntityModal('story', () => {});
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }

    const addCount = addSpy.mock.calls.filter(c => c[0] === 'keydown').length;
    const removeCount = removeSpy.mock.calls.filter(c => c[0] === 'keydown').length;
    expect(addCount).toBe(2);
    expect(removeCount).toBe(2);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

