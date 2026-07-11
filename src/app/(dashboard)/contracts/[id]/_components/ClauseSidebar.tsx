"use client";

import { cn } from "@/lib/utils";
import { ClauseCommentThread } from "./ClauseCommentThread";
import { AlertCircle, AlertTriangle, Info, FileText } from "lucide-react";

interface ClauseSidebarProps {
  clauses: any[];
  contractId: string;
  orgId: string;
  selectedClauseId: string | null;
  onSelectClause: (id: string) => void;
}

export function ClauseSidebar({
  clauses,
  contractId,
  orgId,
  selectedClauseId,
  onSelectClause,
}: ClauseSidebarProps) {
  if (clauses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <FileText className="w-12 h-12 mb-4 opacity-20" />
        <p>No clauses extracted yet or extraction yielded no standard clauses.</p>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "HIGH":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "MEDIUM":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "border-l-red-500";
      case "HIGH":
        return "border-l-orange-500";
      case "MEDIUM":
        return "border-l-yellow-500";
      default:
        return "border-l-blue-500";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {clauses.map((clause) => {
        const isSelected = selectedClauseId === clause.id;
        
        return (
          <div
            key={clause.id}
            className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 cursor-pointer overflow-hidden border-l-4",
              getSeverityBorder(clause.risk_severity || "LOW"),
              isSelected ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : "hover:shadow-md hover:border-border"
            )}
            onClick={() => onSelectClause(clause.id)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(clause.risk_severity || "LOW")}
                  <span className="font-semibold text-sm capitalize">
                    {clause.clause_type.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                {clause.risk_score && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    Score: {clause.risk_score}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {clause.text}
              </p>
              
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Comments</h4>
                  <ClauseCommentThread 
                    clauseId={clause.id} 
                    contractId={contractId} 
                    orgId={orgId}
                    initialComments={clause.comments || []} 
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
