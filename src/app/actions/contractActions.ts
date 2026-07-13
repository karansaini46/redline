"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function deleteContractAction(contractId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id)
    throw new Error("Unauthorized");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { org_id: true },
  });

  if (!contract) throw new Error("Contract not found");

  await requireRole(contract.org_id, session.user.id, "MEMBER");

  await prisma.$transaction(async (tx) => {
    await tx.contract.delete({
      where: { id: contractId },
    });

    await tx.auditLogEntry.create({
      data: {
        org_id: contract.org_id,
        user_id: session.user.id,
        action: "CONTRACT_DELETED",
        entity_type: "Contract",
        entity_id: contractId,
        details: {},
      },
    });
  });

  revalidatePath("/dashboard/contracts");
}
