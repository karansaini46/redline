"use server";

import { ObligationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { z } from "zod";

const CreateObligationSchema = z.object({
  contract_id: z.string().uuid(),
  description: z.string().min(1),
  due_date: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  recurring_rule: z.string().nullable().optional(),
});

export async function createObligationAction(
  orgId: string,
  data: z.infer<typeof CreateObligationSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await requireRole(orgId, session.user.id, "MEMBER");
  const parsed = CreateObligationSchema.parse(data);

  const obligation = await prisma.obligation.create({
    data: {
      contract_id: parsed.contract_id,
      description: parsed.description,
      due_date: parsed.due_date ? new Date(parsed.due_date) : null,
      owner_id: parsed.owner_id,
      recurring_rule: parsed.recurring_rule,
      status: "OPEN",
    },
  });

  revalidatePath("/obligations");
  return obligation;
}

export async function updateObligationStatusAction(
  orgId: string,
  obligationId: string,
  status: ObligationStatus,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await requireRole(orgId, session.user.id, "MEMBER");

  const updated = await prisma.obligation.update({
    where: { id: obligationId },
    data: { status },
  });

  revalidatePath("/obligations");
  return updated;
}
