"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function searchGlobalContracts(query: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Assuming user belongs to org via membership, we should only return their org's contracts.
  // Actually, wait, let's fetch orgs the user is part of, or pass orgId.
  // We can get the user's current org from their memberships.
  const memberships = await prisma.membership.findMany({
    where: { user_id: session.user.id },
    select: { org_id: true },
  });

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);

  if (orgIds.length === 0) {
    return { success: true, contracts: [] };
  }

  const contracts = await prisma.contract.findMany({
    where: {
      org_id: { in: orgIds },
      title: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
    take: 10,
    orderBy: { created_at: "desc" },
  });

  return { success: true, contracts };
}
