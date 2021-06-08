module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'react-app',
      'plugin:@typescript-eslint/recommended',
    ],
    ignorePatterns: [
      "**/lib/**/*.*",
      "**/dist/**/*.*",
      "**/build/**/*.*",
      "**/vendor/**/*.*",
      "**/*.test.ts",
      "**/*.config.js"
    ]
  };