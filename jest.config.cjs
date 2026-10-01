module.exports = {
  roots: ['<rootDir>'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { useESM: true, tsconfig: { module: 'esnext', moduleResolution: 'bundler' } },
    ],
  },
};
