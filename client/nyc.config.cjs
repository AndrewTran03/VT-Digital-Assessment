
module.exports = {
  all: true,
  extends: "@istanbuljs/nyc-config-typescript",
  checkCoverage: true,
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["cypress/**/*.*", "**/*.d.ts", "**/*.cy.tsx", "**/*.cy.ts"]
};
