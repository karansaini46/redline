import { Suspense } from "react";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ObligationListClient } from "./_components/ObligationListClient";

const prisma = new PrismaClient();

export default async function ObligationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // For this demo environment, we assume the user has a single active organization,
  // similar to how Contracts list is fetched. We get the org from their membership.
  const membership = await prisma.membership.findFirst({
    where: { user_id: session.user.id },
  });

  const orgId = membership?.org_id || "";

  const obligations = await prisma.obligation.findMany({
    where: {
      contract: {
        org_id: orgId,
      },
    },
    include: {
      contract: true,
      owner: true,
    },
    orderBy: {
      due_date: "asc",
    },
  });

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Obligations</h1>
      </div>
      <Suspense fallback={<div>Loading obligations...</div>}>
        <ObligationListClient initialObligations={obligations} orgId={orgId} />
      </Suspense>
    </div>
  );
}
