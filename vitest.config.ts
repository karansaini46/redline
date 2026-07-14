import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

import react from "@vitejs/plugin-react";

const env = config({ path: ".env" }).parsed || {};

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prisma/client": path.resolve(
        __dirname,
        "./node_modules/@prisma/client",
      ),
    },
    env,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/*.spec.ts", "**/node_modules/**"],
  },
});
