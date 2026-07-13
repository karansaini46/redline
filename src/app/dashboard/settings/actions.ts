"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(data: { name: string; email: string; orgName: string }) {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("Organization not found");

  await prisma.organization.update({
    where: { id: org.id },
    data: { name: data.orgName }
  });

  const user = await prisma.user.findFirst({
    where: {
      memberships: {
        some: { org_id: org.id, role: { in: ["OWNER", "ADMIN"] } }
      }
    }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name, email: data.email }
    });
  }

  // Invalidate cache so that layout.tsx and page.tsx fetch the new data
  revalidatePath("/dashboard", "layout");
}
