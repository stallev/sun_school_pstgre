/** @type {import('@commitlint/types').UserConfig} */
const COMMIT_TYPES =
  'feat|fix|refactor|perf|docs|test|chore|ci|revert|style';

export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Optional branch prefix (= git branch name), then conventional header
      // Groups: branch, type, scope, breaking, subject
      headerPattern: new RegExp(
        `^(?:([^:]+): )?(${COMMIT_TYPES})(?:\\(([a-z0-9-]+)\\))?(!)?: (.+)$`,
      ),
      headerCorrespondence: ['branch', 'type', 'scope', 'breaking', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'docs', 'test', 'chore', 'ci', 'revert', 'style'],
    ],
    'header-max-length': [2, 'always', 120],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
