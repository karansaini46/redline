import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_URL;

// Re-use connection for BullMQ
const connection = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

if (!connection) {
  console.warn(
    "UPSTASH_REDIS_URL is not set. ScoreClause queue is running without Redis connection.",
  );
}

export const scoreClauseQueue = new Queue("score-clause", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
