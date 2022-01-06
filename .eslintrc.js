module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'inclusive-language', 'prettier'],
    extends: [
        'airbnb',
        'airbnb/hooks',
        'eslint:recommended',
        'react-app',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:prettier/recommended',
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
        'inclusive-language/use-inclusive-words': 'error',
        indent: ['error', 4, { ignoredNodes: ['JSXElement *', 'JSXElement'] }],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'max-len': [
            'error',
            {
                code: 120,
                tabWidth: 4,
                ignoreComments: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
            },
        ],
        'import/prefer-default-export': 'off', // do not prefer default export
        'import/no-extraneous-dependencies': 'off', // using monorepo
        'no-underscore-dangle': 'off', // unigraph data model
        'import/extensions': [
            // targeting es module support so file extension is not needed
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
        'react/jsx-filename-extension': [
            'error',
            { extensions: ['.tsx', '.jsx'] },
        ],
        'react/jsx-props-no-spreading': 'off',
        'react/function-component-definition': 'off',
        'react/prop-types': 'off', // for now, maybe we'll enforce this later
        'no-param-reassign': 'warn', // also, for now
        'import/no-unresolved': 'off', // temporarily disable unresolved check
        'react/react-in-jsx-scope': 'off', // unnecessary for new jsx transpilation
        'jsx-a11y/no-static-element-interactions': 'off', // disable for now
        'jsx-a11y/click-events-have-key-events': 'off', // disable for now
    },
};
