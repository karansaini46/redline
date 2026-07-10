import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.UPSTASH_REDIS_URL;

// Re-use connection for BullMQ
const connection = redisUrl ? new Redis(redisUrl, { maxRetriesPerRequest: null }) : undefined;

if (!connection) {
  console.warn("UPSTASH_REDIS_URL is not set. ExtractText queue is running without Redis connection.");
}

export const extractTextQueue = new Queue('extract-text', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
