module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue']
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.d.ts',
    'auto-imports.d.ts',
    'components.d.ts',
    'env.d.ts'
  ],
  rules: {
    // Keep lint light — formatting is Prettier's job.
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/attributes-order': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/component-name-in-template-casing': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
    ],
    'no-unused-vars': 'off',
    'no-undef': 'off'
  }
}
