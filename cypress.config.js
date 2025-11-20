import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // React dev server URL
    supportFile: "cypress/support/e2e.js"
  },
});
