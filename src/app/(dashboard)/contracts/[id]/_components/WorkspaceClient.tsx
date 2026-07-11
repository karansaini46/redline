"use client";

import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";
import { ClauseSidebar } from "./ClauseSidebar";

// Define some types that we will need
export type ClauseWithComments = any; // Will replace with proper type once Prisma types are imported or defined
export type ContractVersionWithDetails = any;

interface WorkspaceClientProps {
  contract: any;
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
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const selectedClause = clauses.find((c) => c.id === selectedClauseId);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Left Pane: Document Viewer */}
      <div className="flex-1 border-r border-border relative bg-muted/30">
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
      <div className="w-[450px] flex flex-col bg-background h-full shadow-lg z-10 relative">
        <div className="p-4 border-b border-border bg-card">
          <h2 className="font-semibold text-lg truncate" title={contract.title}>
            {contract.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
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
