module.exports = {
  roots: ["<rootDir>"],
  transform: { "^.+\\.ts$": "ts-jest" },
  testMatch: ["**/*.test.ts"],
  globals: {
    "ts-jest": {
      diagnostics: false,
      tsconfig: "tsconfig.json",
    },
  },
};
