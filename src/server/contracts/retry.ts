"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { ProcessingStatus } from "@prisma/client";
import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_URL;
const connection = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

const extractTextQueue = connection
  ? new Queue("extract-text", { connection: connection as unknown as typeof connection })
  : null;

export async function retryExtractionAction(
  versionId: string,
  contractId: string,
  orgId: string
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Requires MEMBER role to retry extraction
    await requireRole(orgId, userId, "MEMBER");

    // 1. Verify version exists and is FAILED
    const version = await prisma.contractVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return { success: false, error: "Version not found" };
    }

    if (version.processing_status !== ProcessingStatus.FAILED) {
      return { success: false, error: "Can only retry failed extractions" };
    }

    // 2. Delete any partially extracted clauses (transactionally not strictly required but good practice)
    await prisma.clause.deleteMany({
      where: { contract_version_id: versionId },
    });

    // 3. Reset status
    await prisma.contractVersion.update({
      where: { id: versionId },
      data: {
        processing_status: ProcessingStatus.PENDING,
        error_message: null,
      },
    });

    // 4. Enqueue Job
    if (extractTextQueue) {
      await extractTextQueue.add("extract-text", {
        contractVersionId: versionId,
      });
    } else {
      return { success: false, error: "Queue is not configured" };
    }

    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Failed to retry extraction:", error);
    return { success: false, error: error.message };
  }
}
