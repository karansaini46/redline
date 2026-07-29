/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { scoreClause } from "../risk/scoreClause";

const redisUrl = process.env.UPSTASH_REDIS_URL;
const isRemoteRedis =
  redisUrl &&
  !redisUrl.includes("127.0.0.1") &&
  !redisUrl.includes("localhost");
const connection = isRemoteRedis
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

export const scoreClauseProcessor = async (
  job: Job<{ clauseId: string; userId?: string }>,
) => {
  const { clauseId, userId } = job.data;

  try {
    // Add delay to prevent hitting free tier limits (15 RPM)
    await new Promise((resolve) => setTimeout(resolve, 4500));
    const result = await scoreClause(clauseId, userId);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scoring clause ${clauseId}:`, errorMessage);
    throw error; // Let BullMQ handle retries
  }
};

export const scoreClauseWorker = connection
  ? new Worker("score-clause", scoreClauseProcessor, {
      connection: connection as any,
      concurrency: 1, // Avoid rate limits on the free tier
    })
  : null;
