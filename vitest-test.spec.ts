import { describe, beforeAll, afterAll, it } from 'vitest';
describe('test', () => {
  let val: string;
  beforeAll(() => {
    val = "hello";
    throw new Error("fail here");
  });
  afterAll(() => {
    console.log("val is:", val);
  });
  it("does nothing", () => {});
});
