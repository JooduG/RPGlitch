/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js'],
  reporters: [
    'default'
  ],
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
};

module.exports = config;
