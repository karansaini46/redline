"use client";

import React, { useState } from "react";
import { ClauseType } from "@prisma/client";
import { Change } from "diff";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, SplitSquareHorizontal, List, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export interface DiffResult {
  type: "added" | "removed" | "modified" | "unchanged";
  clauseType: ClauseType;
  sourceClauseId?: string;
  targetClauseId?: string;
  text?: string;
  diff?: Change[];
}

export interface DiffViewerProps {
  summary: string;
  diffs: DiffResult[];
}

export function DiffViewer({ summary, diffs }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"inline" | "side-by-side">("side-by-side");

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto py-6 animate-fade-in">
      {/* AI Summary Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-surface border border-border/40 shadow-sm p-8 transition-colors hover:border-border/80"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="size-4 text-accent" />
            </div>
            AI Risk Analysis & Version Delta
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-4xl text-lg">
            {summary}
          </p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex justify-between items-center sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Clause by Clause Comparison
        </h2>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode("inline")}
            className={cn(
              viewMode === "inline" ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
            )}
          >
            <List className="size-4" /> Inline
          </button>
          <button
            onClick={() => setViewMode("side-by-side")}
            className={cn(
              viewMode === "side-by-side" ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
            )}
          >
            <SplitSquareHorizontal className="size-4" /> Side-by-Side
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex flex-col space-y-6">
        <AnimatePresence>
          {diffs.map((item, idx) => (
            <DiffBlock key={idx} item={item} viewMode={viewMode} index={idx} />
          ))}
        </AnimatePresence>
        {diffs.length === 0 && (
          <div className="pt-12">
            <EmptyState
              icon={FileSearch}
              title="No clauses to compare"
              description="There are no meaningful differences between these contract versions."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DiffBlock({
  item,
  viewMode,
  index
}: {
  item: DiffResult;
  viewMode: "inline" | "side-by-side";
  index: number;
}) {
  const isAdded = item.type === "added";
  const isRemoved = item.type === "removed";
  const isModified = item.type === "modified";

  let borderClass = "border-border";
  let bgClass = "bg-surface";
  let indicator = "bg-muted text-muted-foreground";

  if (isAdded) {
    borderClass = "border-green-500/30";
    bgClass = "bg-green-500/5 dark:bg-green-500/10";
    indicator = "bg-green-500/20 text-green-700 dark:text-green-400";
  } else if (isRemoved) {
    borderClass = "border-red-500/30";
    bgClass = "bg-red-500/5 dark:bg-red-500/10";
    indicator = "bg-red-500/20 text-red-700 dark:text-red-400";
  } else if (isModified) {
    borderClass = "border-l-4 border-l-yellow-500 border-border";
    bgClass = "bg-yellow-500/5 dark:bg-yellow-500/10";
    indicator = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={cn("rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-md border", borderClass, bgClass)}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface px-3 py-1.5 rounded-full border border-border/40 shadow-sm">
          {item.clauseType.replace(/_/g, " ")}
        </span>
        <span className={cn("text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full", indicator)}>
          {item.type}
        </span>
      </div>

      <div className="text-base leading-relaxed">
        {viewMode === "inline" ? (
          <InlineDiff item={item} />
        ) : (
          <SideBySideDiff item={item} />
        )}
      </div>
    </motion.div>
  );
}

function InlineDiff({ item }: { item: DiffResult }) {
  if (item.type === "added") {
    return <span className="bg-green-500/20 text-green-800 dark:text-green-200 px-1.5 rounded-sm">{item.text}</span>;
  }
  if (item.type === "removed") {
    return <span className="bg-red-500/20 text-red-800 dark:text-red-200 line-through px-1.5 rounded-sm">{item.text}</span>;
  }
  if (item.type === "unchanged") {
    return <span className="text-foreground/90">{item.text}</span>;
  }

  return (
    <div className="text-foreground/90">
      {item.diff?.map((part, i) => {
        if (part.added) {
          return <span key={i} className="bg-green-500/20 text-green-800 dark:text-green-200 px-1 rounded-sm mx-0.5">{part.value}</span>;
        }
        if (part.removed) {
          return <span key={i} className="bg-red-500/20 text-red-800 dark:text-red-200 line-through px-1 rounded-sm mx-0.5 opacity-70">{part.value}</span>;
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}

function SideBySideDiff({ item }: { item: DiffResult }) {
  if (item.type === "unchanged") {
    return (
      <div className="grid grid-cols-2 gap-8 text-foreground/80">
        <div className="pr-4">{item.text}</div>
        <div className="pl-4 border-l border-border/50">{item.text}</div>
      </div>
    );
  }

  if (item.type === "added") {
    return (
      <div className="grid grid-cols-2 gap-8">
        <div className="pr-4 text-muted-foreground/50 italic flex items-center justify-center bg-background/50 rounded-lg p-4">No previous version</div>
        <div className="pl-4 border-l border-border/50">
          <span className="bg-green-500/20 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-md inline-block w-full">{item.text}</span>
        </div>
      </div>
    );
  }

  if (item.type === "removed") {
    return (
      <div className="grid grid-cols-2 gap-8">
        <div className="pr-4">
          <span className="bg-red-500/20 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-md inline-block w-full line-through opacity-70">{item.text}</span>
        </div>
        <div className="pl-4 border-l border-border/50 text-muted-foreground/50 italic flex items-center justify-center bg-background/50 rounded-lg p-4">Removed in this version</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 relative text-foreground/90">
      <div className="pr-4 bg-red-500/5 rounded-lg p-4">
        {item.diff?.map((part, i) => {
          if (part.added) return null;
          if (part.removed) {
            return <span key={i} className="bg-red-500/20 text-red-800 dark:text-red-200 px-1 rounded-sm line-through opacity-80">{part.value}</span>;
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
      <div className="pl-4 border-l border-border/50 bg-green-500/5 rounded-lg p-4">
        {item.diff?.map((part, i) => {
          if (part.removed) return null;
          if (part.added) {
            return <span key={i} className="bg-green-500/20 text-green-800 dark:text-green-200 px-1 rounded-sm shadow-sm">{part.value}</span>;
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}
