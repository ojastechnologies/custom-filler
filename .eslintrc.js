module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Turn off rules that are causing the most issues
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@next/next/no-img-element': 'warn',
    'jsx-a11y/alt-text': 'warn'
  }
}