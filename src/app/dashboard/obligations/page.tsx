import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ObligationListClient } from "./_components/ObligationListClient";
import { FadeIn } from "@/components/ui/motion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obligations Tracking",
  description: "Track and manage contract expirations and renewals.",
};

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
    <FadeIn className="flex flex-col gap-6 w-full max-w-6xl mx-auto pt-2">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Obligations
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and track your contract renewals and payment deadlines.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="animate-pulse bg-surface h-[500px] rounded-xl border border-border/40" />
        }
      >
        <ObligationListClient initialObligations={obligations} orgId={orgId} />
      </Suspense>
    </FadeIn>
  );
}
