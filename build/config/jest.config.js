const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  rootDir: path.join(__dirname, '..', '..'),
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js']
};
