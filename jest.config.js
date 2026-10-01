module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { useESM: true, tsconfig: { module: 'esnext', moduleResolution: 'bundler' } },
    ],
  },
};
