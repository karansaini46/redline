/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { signup } from "../app/actions/auth";
import { prisma } from "../lib/prisma";

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    organization: { create: vi.fn() },
    membership: { create: vi.fn() },
    authToken: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("argon2", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed_password") },
}));

vi.mock("resend", () => {
  const ResendMock = vi.fn();
  ResendMock.prototype.emails = { send: vi.fn() };
  return { Resend: ResendMock };
});

describe("Signup Transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates user, org, and membership atomically", async () => {
    const mockTx = {
      user: {
        create: vi
          .fn()
          .mockResolvedValue({
            id: "user_1",
            email: "test@example.com",
            name: "Test",
          }),
      },
      organization: {
        create: vi
          .fn()
          .mockResolvedValue({ id: "org_1", name: "Test's Organization" }),
      },
      membership: {
        create: vi
          .fn()
          .mockResolvedValue({
            id: "mem_1",
            user_id: "user_1",
            org_id: "org_1",
            role: "OWNER",
          }),
      },
    };

    (prisma.$transaction as any).mockImplementation(async (cb: any) => {
      return await cb(mockTx);
    });
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await signup({
      email: "test@example.com",
      password: "password",
      name: "Test",
    });
    expect(result.success).toBe(true);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockTx.user.create).toHaveBeenCalled();
    expect(mockTx.organization.create).toHaveBeenCalled();
    expect(mockTx.membership.create).toHaveBeenCalled();
  });

  it("rolls back completely if organization creation fails", async () => {
    const error = new Error("Database error during org creation");

    const mockTx = {
      user: {
        create: vi
          .fn()
          .mockResolvedValue({
            id: "user_1",
            email: "test@example.com",
            name: "Test",
          }),
      },
      organization: {
        create: vi.fn().mockImplementation(() => {
          throw error;
        }),
      },
      membership: { create: vi.fn().mockResolvedValue({}) },
    };

    (prisma.$transaction as any).mockImplementation(async (cb: any) => {
      // In a real prisma transaction, an exception rolls back the whole block.
      // We simulate this by simply letting the error propagate.
      // The application won't commit the user if this throws.
      return await cb(mockTx);
    });
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(
      signup({ email: "fail@example.com", password: "password", name: "Fail" }),
    ).rejects.toThrow("Database error");

    // Ensure the membership wasn't called because it failed at org
    expect(mockTx.user.create).toHaveBeenCalled();
    expect(mockTx.organization.create).toHaveBeenCalled();
    expect(mockTx.membership.create).not.toHaveBeenCalled();
  });
});
