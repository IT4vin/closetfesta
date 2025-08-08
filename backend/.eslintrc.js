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
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Regras específicas para Node.js
    'no-process-exit': 'error',
    'handle-callback-err': 'error',
    
    // Console permitido em ambiente de desenvolvimento/produção
    'no-console': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    'build/',
    '*.min.js'
  ]
};
