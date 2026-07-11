// @vitest-environment node
import { expect, test, describe, vi, beforeEach } from "vitest";
import { processReminders } from "@/server/queues/reminders.worker";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    obligation: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

vi.mock("resend", async () => {
  const sendMock = vi.fn().mockResolvedValue({ id: "mock-id" });
  const MockResend = class {
    emails = { send: sendMock };
  };
  return {
    Resend: MockResend,
    __sendMock: sendMock,
  };
});

describe("Reminder Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("does not double-send reminders on the same day", async () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const dueDate = new Date("2024-01-08T12:00:00Z"); // Exactly 7 days later

    // Mock findMany to return our test obligation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.obligation.findMany as any).mockResolvedValue([
      {
        id: "obl_1",
        contract_id: "contract_1",
        description: "Pay up",
        due_date: dueDate,
        owner_id: "user_1",
        status: "OPEN",
        last_reminder_sent_at: null,
        owner: { email: "owner@test.com" },
        contract: { title: "Test Contract" },
      },
    ]);

    const sentCount1 = await processReminders(now);
    expect(sentCount1).toBe(1);

    // To access the mock function from the vi.mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { __sendMock } = (await import("resend")) as any;
    expect(__sendMock).toHaveBeenCalledTimes(1);
    expect(prisma.obligation.update).toHaveBeenCalledTimes(1);

    // Now simulate the second run on the same day
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.obligation.findMany as any).mockResolvedValue([
      {
        id: "obl_1",
        contract_id: "contract_1",
        description: "Pay up",
        due_date: dueDate,
        owner_id: "user_1",
        status: "OPEN",
        last_reminder_sent_at: now, // We mock that it was sent at 'now'
        owner: { email: "owner@test.com" },
        contract: { title: "Test Contract" },
      },
    ]);

    const sentCount2 = await processReminders(now);
    expect(sentCount2).toBe(0);

    expect(__sendMock).toHaveBeenCalledTimes(1); // Still 1
  });
});
