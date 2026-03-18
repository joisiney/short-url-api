/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'test',
        'docs',
        'chore',
        'build',
        'ci',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'scope-case': [2, 'always', 'kebab-case'],
  },
};
