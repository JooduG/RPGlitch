/* eslint-env jest */
require('../apps/rpglitch/js/entity-form.js');

describe('entity form page', () => {
  test('cancel navigates to storyboard', () => {
    global.App.entities = { upsert: jest.fn() };
    global.App.router = { navigate: jest.fn() };
    global.App.refreshAllLists = jest.fn();
    global.App.hideEl = jest.fn();
    global.App.showEl = jest.fn();
    const App = global.App;
    document.body.innerHTML = '<div id="character-form-screen"></div><button id="form-save"></button><button id="form-cancel"></button><button id="form-delete"></button>';
    App.renderForm('character', 'new');
    const cancel = document.getElementById('form-cancel');
    if (cancel && cancel.onclick) cancel.onclick();
    expect(App.router.navigate).toHaveBeenCalledWith('#storyboard');
  });
});
