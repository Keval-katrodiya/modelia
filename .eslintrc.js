module.exports = {
  root: true,
  ignorePatterns: ['backend/**', 'frontend/**', 'node_modules/**', 'dist/**'],
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      env: {
        node: true,
        es2022: true,
      },
    },
  ],
};

