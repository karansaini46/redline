import { test, expect } from "vitest";
test("env check", () => {
  console.log("DB:", process.env.DATABASE_URL);
  expect(process.env.DATABASE_URL).toBeDefined();
});
