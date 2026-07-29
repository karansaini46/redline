import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_URL;
const isRemoteRedis =
  redisUrl &&
  !redisUrl.includes("127.0.0.1") &&
  !redisUrl.includes("localhost");

// Re-use connection for BullMQ
const connection = isRemoteRedis
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

if (!connection) {
  console.warn(
    "UPSTASH_REDIS_URL is not set. ExtractText queue is running without Redis connection.",
  );
}

export const extractTextQueue = new Queue("extract-text", {
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
