module.exports = {
  root: true,
  env: { browser: true, es2021: true, webextensions: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh'],
  ignorePatterns: ['dist', 'dist-firefox', 'node_modules', '*.config.ts', '*.config.js', 'scripts'],
  rules: {
    // Several files intentionally co-locate a small Zustand store with its host component
    // (Toast, ConfirmDialog). The HMR-only warning isn't worth splitting them.
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
