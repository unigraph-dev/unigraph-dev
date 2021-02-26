const baseConfig = require('./jest.config.base')

module.exports = {
    ...baseConfig,
    projects: [
            '<rootDir>/packages/*/jest.config.js',
    ],
    coverageDirectory: '<rootDir>/coverage/',
    collectCoverageFrom: [
        '<rootDir>/packages/*/src/**/*.{ts,tsx}',
    ],
    testURL: 'http://localhost/',
    moduleNameMapper: {
        '.json$': 'identity-obj-proxy',
    },
    moduleDirectories: [
        'node_modules',
    ],
}