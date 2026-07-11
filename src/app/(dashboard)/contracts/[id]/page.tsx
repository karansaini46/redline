import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/rbac";
import { ProcessingStatus, RiskSeverity } from "@prisma/client";
import { getSignedUrlAction, retryExtractionAction } from "@/server/contracts";
import { WorkspaceClient } from "./_components/WorkspaceClient";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, FileText } from "lucide-react";
import { redirect } from "next/navigation";

interface ContractPageProps {
  params: { id: string };
}

export default async function ContractPage({ params }: ContractPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const { id } = params;

  // 1. Fetch Contract and its latest Version
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version_number: "desc" },
        take: 1,
      },
    },
  });

  if (!contract || contract.versions.length === 0) {
    notFound();
  }

  const latestVersion = contract.versions[0];

  // 2. Authorize
  await requireRole(contract.org_id, userId, "VIEWER");

  // 3. Handle specific processing states
  if (
    latestVersion.processing_status === ProcessingStatus.PENDING ||
    latestVersion.processing_status === ProcessingStatus.EXTRACTING
  ) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background p-8">
        <div className="flex flex-col items-center max-w-md text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="relative bg-primary/10 p-6 rounded-full">
              <FileText className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Analyzing Document</h2>
            <p className="text-muted-foreground">
              {latestVersion.processing_status === ProcessingStatus.EXTRACTING
                ? "Our AI is actively extracting clauses and assessing risk..."
                : "Your document is in the queue waiting to be processed..."}
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full animate-progress-bar w-full origin-left"></div>
          </div>
        </div>
      </div>
    );
  }

  if (latestVersion.processing_status === ProcessingStatus.FAILED) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background p-8">
        <div className="flex flex-col items-center max-w-md text-center space-y-6 border rounded-xl p-8 bg-card shadow-sm">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Extraction Failed</h2>
            <p className="text-muted-foreground text-sm">
              {latestVersion.error_message || "An unexpected error occurred while analyzing the document."}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await retryExtractionAction(latestVersion.id, contract.id, contract.org_id);
            }}
          >
            <Button type="submit" variant="default" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry Analysis
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // 4. State is EXTRACTED, fetch Clauses and Comments
  const rawClauses = await prisma.clause.findMany({
    where: { contract_version_id: latestVersion.id },
    include: {
      comments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  // Sort clauses by risk severity (CRITICAL > HIGH > MEDIUM > LOW)
  const severityOrder = {
    [RiskSeverity.CRITICAL]: 4,
    [RiskSeverity.HIGH]: 3,
    [RiskSeverity.MEDIUM]: 2,
    [RiskSeverity.LOW]: 1,
  };

  const sortedClauses = rawClauses.sort((a, b) => {
    const scoreA = a.risk_severity ? severityOrder[a.risk_severity] : 0;
    const scoreB = b.risk_severity ? severityOrder[b.risk_severity] : 0;
    return scoreB - scoreA;
  });

  // 5. Get file URL from Storage
  let fileUrl: string | undefined;
  if (latestVersion.storage_path) {
    const urlResult = await getSignedUrlAction(latestVersion.storage_path, contract.org_id);
    if (urlResult.success) {
      fileUrl = urlResult.url;
    }
  }

  return (
    <WorkspaceClient
      contract={contract}
      version={latestVersion}
      clauses={sortedClauses}
      fileUrl={fileUrl}
      orgId={contract.org_id}
    />
  );
}
