import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

const env = config({ path: ".env" }).parsed || {};

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    env,
    setupFiles: ["./vitest.setup.ts"],
  },
});
