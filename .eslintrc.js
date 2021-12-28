module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb', 'airbnb/hooks',
        'eslint:recommended',
        'react-app',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    ignorePatterns: [
        '**/lib/**/*.*',
        '**/dist/**/*.*',
        '**/build/**/*.*',
        '**/vendor/**/*.*',
        '**/*.test.ts',
        '**/*.config.js',
    ],
    rules: {
        indent: ['error', 4, { ignoredNodes: ['JSXElement *'] }],
        'react/jsx-indent': ['error', 4],
        'max-len': [
            'error', { code: 120, tabWidth: 4, ignoreComments: true },
        ],
        'import/no-extraneous-dependencies': 'off', // using monorepo
        'no-underscore-dangle': 'off', // unigraph data model
        'import/extensions': [ // targeting es module support so file extension is not needed
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
        'react/jsx-props-no-spreading': 'off',
    },
};
