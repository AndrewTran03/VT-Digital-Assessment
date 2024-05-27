import { defineConfig } from "cypress";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";

export default defineConfig({
  env: {
    codeCoverage: {
      exclude: "cypress/**/*.*"
    }
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      registerCodeCoverageTasks(on, config);
      return config;
    },
    port: 3002,
    viewportWidth: 1920,
    viewportHeight: 1080
  }
});
