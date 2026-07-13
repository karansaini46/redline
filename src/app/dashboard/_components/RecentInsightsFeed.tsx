"use client";

import React from "react";
import { Sparkles, ShieldAlert, FileSearch, ArrowRight } from "lucide-react";
import { StaggerContainer, StaggerItem, ScaleHover } from "@/components/ui/motion";
import Link from "next/link";

import { formatDistanceToNow } from "date-fns";

export interface Insight {
  id: string;
  title: string;
  contract: string;
  contractId: string;
  clauseId: string;
  time: Date;
  severity: string;
}

export function RecentInsightsFeed({ insights = [] }: { insights?: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
        <FileSearch className="size-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No recent insights</p>
        <p className="text-xs text-muted-foreground mt-1">We haven't detected any high-risk clauses recently.</p>
      </div>
    );
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { icon: ShieldAlert, color: "text-foreground", bg: "bg-muted" };
      case 'HIGH':
        return { icon: ShieldAlert, color: "text-muted-foreground", bg: "bg-surface-elevated" };
      default:
        return { icon: Sparkles, color: "text-muted-foreground", bg: "bg-surface" };
    }
  };
  return (
    <StaggerContainer className="flex flex-col gap-3">
      {insights.map((insight) => {
        const style = getSeverityStyle(insight.severity);
        const Icon = style.icon;
        
        return (
          <StaggerItem key={insight.id}>
            <Link href={`/dashboard/contracts/${insight.contractId}?clause=${insight.clauseId}`}>
              <ScaleHover className="group flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                <div className={`mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0 border border-border/50 ${style.bg}`}>
                  <Icon className={`size-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate font-serif">
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    in <span className="font-medium text-foreground group-hover:text-foreground/80 transition-colors">{insight.contract}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(insight.time), { addSuffix: true })}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </ScaleHover>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
