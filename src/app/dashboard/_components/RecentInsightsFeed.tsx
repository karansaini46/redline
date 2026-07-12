"use client";

import React from "react";
import { Sparkles, ShieldAlert, FileSearch, ArrowRight } from "lucide-react";
import { StaggerContainer, StaggerItem, ScaleHover } from "@/components/ui/motion";

const INSIGHTS = [
  {
    id: 1,
    title: "Uncapped Liability Detected",
    contract: "Acme Corp MSA",
    time: "10 mins ago",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: 2,
    title: "Favorable Payment Terms",
    contract: "Globex Supplier Agreement",
    time: "2 hours ago",
    icon: Sparkles,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    id: 3,
    title: "Non-standard Auto-renewal",
    contract: "Stark Tech License",
    time: "5 hours ago",
    icon: FileSearch,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

export function RecentInsightsFeed() {
  return (
    <StaggerContainer className="flex flex-col gap-3">
      {INSIGHTS.map((insight) => (
        <StaggerItem key={insight.id}>
          <ScaleHover className="group flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
            <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center shrink-0 ${insight.bg}`}>
              <insight.icon className={`size-4 ${insight.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {insight.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                in <span className="font-medium text-primary/80 group-hover:text-primary transition-colors">{insight.contract}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {insight.time}
              </span>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </ScaleHover>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
