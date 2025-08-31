const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// This global hook will run once after all test suites have finished.
// It checks for an open database connection on the global App object
// and closes it to ensure the test process can exit cleanly. This
// is the proper fix for tests hanging due to open async handles.
afterAll(async () => {
  if (global.App && global.App.db && global.App.db.isOpen()) {
    console.log('\n[Jest Teardown] Closing open database connection...');
    await global.App.db.close();
    console.log('[Jest Teardown] Database connection closed.');
  }
});

