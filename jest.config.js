/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js'],
  reporters: [
    'default'
  ]
};

export default config;
