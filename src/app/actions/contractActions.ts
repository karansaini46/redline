"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function deleteContractAction(contractId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");
  
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { org_id: true }
  });

  if (!contract) throw new Error("Contract not found");

  await requireRole(contract.org_id, session.user.id, "MEMBER");

  await prisma.contract.delete({
    where: { id: contractId }
  });

  revalidatePath("/dashboard/contracts");
}
