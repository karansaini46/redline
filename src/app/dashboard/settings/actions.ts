"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function updateSettings(data: {
  name: string;
  email: string;
  orgName: string;
  orgId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orgId = data.orgId;
  if (!orgId) throw new Error("Missing orgId");

  const userId = session.user.id;
  const membership = await prisma.membership.findUnique({
    where: { user_id_org_id: { user_id: userId, org_id: orgId } },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Unauthorized: Must be OWNER or ADMIN to update settings");
  }

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: { name: data.orgName },
    });

    await tx.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email },
    });
  });

  revalidatePath("/dashboard", "layout");
}
