// Stylelint config (CJS)
const path = require('node:path');
const master = require('./ignores.master.json');

module.exports = {
  ignoreFiles: master.stylelintIgnore || [],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss'
  ],
  overrides: [
    { files: ['**/*.scss'], customSyntax: 'postcss-scss' }
  ],
  rules: {
    // your css/scss rules
  }
};
