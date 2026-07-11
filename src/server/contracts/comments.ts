"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { revalidatePath } from "next/cache";

export type AddCommentState = {
  success: boolean;
  error?: string;
  comment?: any;
};

export async function addCommentAction(
  clauseId: string,
  content: string,
  contractId: string,
  orgId: string
): Promise<AddCommentState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { success: false, error: "Comment cannot be empty" };
  }

  try {
    // Require at least VIEWER role to comment (or MEMBER depending on org rules)
    await requireRole(orgId, userId, "VIEWER"); // Usually anyone who can see it can comment

    const comment = await prisma.comment.create({
      data: {
        clause_id: clauseId,
        user_id: userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    revalidatePath(`/contracts/${contractId}`);

    return {
      success: true,
      comment,
    };
  } catch (err) {
    const error = err as Error;
    console.error("Failed to add comment:", error);
    return { success: false, error: error.message };
  }
}
