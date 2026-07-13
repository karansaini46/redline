"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ClauseSidebar } from "./ClauseSidebar";

const DocumentViewer = dynamic(
  () => import("./DocumentViewer").then((mod) => mod.DocumentViewer),
  { 
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center text-muted-foreground animate-pulse">Loading document viewer...</div>
  }
);

import type { Clause, Comment, ContractVersion, Contract } from "@prisma/client";

export type ClauseWithComments = Clause & { comments?: Comment[] };
export type ContractVersionWithDetails = ContractVersion;

interface WorkspaceClientProps {
  contract: Contract;
  version: ContractVersionWithDetails;
  clauses: ClauseWithComments[];
  fileUrl?: string;
  orgId: string;
}

export function WorkspaceClient({
  contract,
  version,
  clauses,
  fileUrl,
  orgId,
}: WorkspaceClientProps) {
  const searchParams = useSearchParams();
  const initialClauseId = searchParams.get("clause");
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(initialClauseId);

  const selectedClause = clauses.find((c) => c.id === selectedClauseId);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Left Pane: Document Viewer */}
      <div className="flex-1 relative bg-background">
        {fileUrl ? (
          <DocumentViewer
            fileUrl={fileUrl}
            selectedClause={selectedClause}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No document available for viewing.
          </div>
        )}
      </div>

      {/* Right Pane: Clauses & Comments */}
      <div className="w-[450px] flex flex-col bg-surface h-full border-l border-border/50 z-10 relative">
        <div className="p-5 border-b border-border/50 bg-surface">
          <h2 className="font-serif font-semibold text-lg truncate text-foreground" title={contract.title}>
            {contract.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">
            Version {version.version_number} • {clauses.length} Clauses Extracted
          </p>
        </div>
        
        <ClauseSidebar
          clauses={clauses}
          contractId={contract.id}
          orgId={orgId}
          selectedClauseId={selectedClauseId}
          onSelectClause={setSelectedClauseId}
        />
      </div>
    </div>
  );
}
