/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  // Correcting the path to the setup file. It needs to go up two directories
  // from the config folder to find the root, then go into the tests folder.
  setupFilesAfterEnv: ["<rootDir>/tools/tests/setup.js"],
  reporters: ["default"],
  roots: ["<rootDir>/tools/tests"],
  transform: {
    "^.+\\.m?[tj]sx?$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  transformIgnorePatterns: ["/node_modules/(?!cash-dom|dexie|jsdom)"],
  testPathIgnorePatterns: [
    "<rootDir>/tools/tests/e2e/",
    "<rootDir>/tools/tests/fractal_dots.spec.js",
    "<rootDir>/tools/tests/components/topbar.test.js",
    "<rootDir>/tools/tests/integration/boot.test.js",
    "<rootDir>/tools/tests/fractal_colors.spec.js",
  ],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)",
    "**/?(*.)+(spec|test).mjs",
  ],
  moduleNameMapper: {
    "^.+\\.svelte$": "<rootDir>/tools/tests/mocks/svelte.mock.js",
  },
};

module.exports = config;
