import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_123");

const redisUrl = process.env.UPSTASH_REDIS_URL;
const isRemoteRedis =
  redisUrl &&
  !redisUrl.includes("127.0.0.1") &&
  !redisUrl.includes("localhost");
const connection = isRemoteRedis
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

function getCalendarDaysDiff(target: Date, current: Date) {
  const t = new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
    ),
  );
  const c = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
    ),
  );
  return Math.round((t.getTime() - c.getTime()) / (1000 * 60 * 60 * 24));
}

export async function processReminders(nowOverride?: Date) {
  const now = nowOverride || new Date();

  // Find all OPEN obligations with a due date
  const obligations = await prisma.obligation.findMany({
    where: {
      status: "OPEN",
      due_date: { not: null },
      owner_id: { not: null },
    },
    include: {
      owner: true,
      contract: true,
    },
  });

  let sentCount = 0;

  for (const obligation of obligations) {
    const dueDate = obligation.due_date!;
    const diffDays = getCalendarDaysDiff(dueDate, now);

    if ([30, 7, 1].includes(diffDays)) {
      if (obligation.last_reminder_sent_at) {
        const lastSent = obligation.last_reminder_sent_at;
        if (
          lastSent.getUTCFullYear() === now.getUTCFullYear() &&
          lastSent.getUTCMonth() === now.getUTCMonth() &&
          lastSent.getUTCDate() === now.getUTCDate()
        ) {
          continue;
        }
      }

      if (obligation.owner?.email) {
        try {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: obligation.owner.email,
            subject: `Reminder: Obligation due in ${diffDays} day(s) for ${obligation.contract.title}`,
            html: `<p>Your obligation: <strong>${obligation.description}</strong> is due in ${diffDays} day(s).</p>`,
          });

          await prisma.obligation.update({
            where: { id: obligation.id },
            data: { last_reminder_sent_at: now },
          });

          sentCount++;
        } catch (error) {
          console.error(
            `Failed to send reminder for obligation ${obligation.id}:`,
            error,
          );
        }
      }
    }
  }

  return sentCount;
}

if (connection) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  new Worker(
    "reminders",
    async (job) => {
      if (job.name === "daily-reminders") {
        await processReminders();
      }
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
    },
  );
}
