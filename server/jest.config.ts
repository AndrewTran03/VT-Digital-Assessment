import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  automock: false,
  clearMocks: true,
  testMatch: ["**/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/dist/"],
  coverageReporters: ["text", "lcov", "text-summary", "json-summary"],
  coverageDirectory: "tests/coverage",
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest"
  }
};

export default config;
