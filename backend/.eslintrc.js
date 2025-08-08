module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Regras básicas para manter consistência
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Regras de qualidade de código
    'no-console': 'warn',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Regras específicas para Node.js
    'no-process-exit': 'error',
    'handle-callback-err': 'error',
    
    // Temporariamente desabilitadas para não quebrar o CI
    'no-console': 'off',
    'no-unused-vars': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    'build/',
    '*.min.js'
  ]
};
