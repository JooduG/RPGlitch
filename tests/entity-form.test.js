import { renderForm } from '../apps/rpglitch/js/entity-form.js';
import { router } from '../apps/rpglitch/js/profile-router.js';

jest.mock('../apps/rpglitch/js/profile-router.js', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

describe('entity form page', () => {
  beforeEach(async () => {
    const utils = await import('../apps/rpglitch/js/utils.js');
    global.App = {
      renderForm: renderForm,
      entities: { upsert: jest.fn() },
      refreshAllLists: jest.fn(),
      hideEl: utils.hideEl,
      showEl: utils.showEl,
    };
  });

  test('cancel navigates to storyboard', () => {
    const App = global.App;
    document.body.innerHTML = '<div id="character-form-screen"></div><button id="form-save"></button><button id="form-cancel"></button><button id="form-delete"></button>';
    App.renderForm('character', 'new');
    const cancel = document.getElementById('form-cancel');
    if (cancel) cancel.click();
    expect(router.navigate).toHaveBeenCalledWith('#storyboard');
  });
});
