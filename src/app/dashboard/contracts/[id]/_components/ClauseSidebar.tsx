"use client";

import { cn } from "@/lib/utils";
import { ClauseCommentThread } from "./ClauseCommentThread";
import { AlertCircle, AlertTriangle, Info, FileText, FileSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

import { motion, AnimatePresence } from "framer-motion";

import type { Clause, Comment } from "@prisma/client";

type ClauseWithComments = Clause & {
  comments?: Comment[];
};

interface ClauseSidebarProps {
  clauses: ClauseWithComments[];
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
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={FileSearch}
          title="No clauses found"
          description="We couldn't extract any standard clauses from this document yet."
        />
      </div>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { icon: <AlertCircle className="w-4 h-4 text-destructive" />, border: "border-l-destructive", bg: "bg-destructive/10 text-destructive" };
      case "HIGH":
        return { icon: <AlertTriangle className="w-4 h-4 text-warning" />, border: "border-l-warning", bg: "bg-warning/10 text-warning" };
      case "MEDIUM":
        return { icon: <AlertTriangle className="w-4 h-4 text-primary" />, border: "border-l-primary", bg: "bg-primary/10 text-primary" };
      default:
        return { icon: <Info className="w-4 h-4 text-success" />, border: "border-l-success", bg: "bg-success/10 text-success" };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {clauses.map((clause, index) => {
        const isSelected = selectedClauseId === clause.id;
        const severity = getSeverityStyles(clause.risk_severity || "LOW");
        
        return (
          <motion.div
            key={clause.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn(
              "rounded-xl border border-border/40 bg-surface text-foreground shadow-sm transition-all duration-300 cursor-pointer overflow-hidden border-l-4",
              severity.border,
              isSelected ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-surface scale-[1.02] shadow-md" : "hover:shadow-md hover:border-border/80"
            )}
            onClick={() => onSelectClause(clause.id)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {severity.icon}
                  <span className="font-semibold text-sm capitalize">
                    {clause.clause_type.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                {clause.risk_score && (
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", severity.bg)}>
                    Risk: {clause.risk_score}
                  </span>
                )}
              </div>
              <p className={cn("text-xs leading-relaxed transition-all duration-300", isSelected ? "text-foreground" : "text-muted-foreground line-clamp-3")}>
                {clause.text}
              </p>
              
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Comments</h4>
                      <ClauseCommentThread 
                        clauseId={clause.id} 
                        contractId={contractId} 
                        orgId={orgId}
                        initialComments={clause.comments || []} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
