/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  // Correcting the path to the setup file. It needs to go up two directories
  // from the config folder to find the root, then go into the tests folder.
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js'],
  reporters: [
    'default'
  ],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!cash-dom|dexie|jsdom)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/rpglitch-image-upload.test.js'
  ]
};

module.exports = config;