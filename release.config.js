/**
 * Tipos de commit (commitlint) e bump correspondente:
 *
 * | Tipo     | Bump  |
 * |----------|-------|
 * | feat     | minor |
 * | fix      | patch |
 * | docs     | patch |
 * | style    | patch |
 * | refactor | patch |
 * | perf     | patch |
 * | test     | patch |
 * | build    | patch |
 * | ci       | patch |
 * | chore    | patch |
 * | revert   | patch |
 * | BREAKING | major |
 */
module.exports = {
  branches: ['dev'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'test', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'ci', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'revert', release: 'patch' },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ['@semantic-release/npm', { npmPublish: false }],
    '@semantic-release/git',
    ['@semantic-release/github', { assets: [] }],
  ],
};
