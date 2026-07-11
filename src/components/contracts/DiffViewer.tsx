"use client";

import React, { useState } from "react";
import { ClauseType } from "@prisma/client";
import { Change } from "diff";

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
  const [viewMode, setViewMode] = useState<"inline" | "side-by-side">("inline");

  // Filter out unchanged if desired, or keep them to show context. We will just render them normally.

  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl mx-auto">
      {/* AI Summary Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span>✨</span> AI Risk Analysis
        </h3>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wider">
          Clause Differences
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
          <button
            onClick={() => setViewMode("inline")}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              viewMode === "inline"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Inline
          </button>
          <button
            onClick={() => setViewMode("side-by-side")}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              viewMode === "side-by-side"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex flex-col space-y-4">
        {diffs.map((item, idx) => (
          <DiffBlock key={idx} item={item} viewMode={viewMode} />
        ))}
        {diffs.length === 0 && (
          <div className="text-center text-slate-500 py-12 border border-dashed rounded-lg">
            No clauses to compare.
          </div>
        )}
      </div>
    </div>
  );
}

function DiffBlock({
  item,
  viewMode,
}: {
  item: DiffResult;
  viewMode: "inline" | "side-by-side";
}) {
  const isAdded = item.type === "added";
  const isRemoved = item.type === "removed";
  const isModified = item.type === "modified";

  // Container styling based on WCAG-AA contrast
  let borderClass = "border-slate-200 dark:border-slate-800";
  let bgClass = "bg-white dark:bg-slate-950";

  if (isAdded) {
    borderClass = "border-green-300 dark:border-green-800";
    bgClass = "bg-green-50 dark:bg-green-900/10";
  } else if (isRemoved) {
    borderClass = "border-red-300 dark:border-red-800";
    bgClass = "bg-red-50 dark:bg-red-900/10";
  } else if (isModified) {
    borderClass =
      "border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200 dark:border-slate-800";
    bgClass = "bg-amber-50/50 dark:bg-amber-900/10";
  }

  return (
    <div className={`rounded-lg p-5 ${borderClass} ${bgClass} transition-all`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {item.clauseType.replace(/_/g, " ")}
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
          {item.type}
        </span>
      </div>

      <div className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
        {viewMode === "inline" ? (
          <InlineDiff item={item} />
        ) : (
          <SideBySideDiff item={item} />
        )}
      </div>
    </div>
  );
}

function InlineDiff({ item }: { item: DiffResult }) {
  if (item.type === "added") {
    return (
      <span className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-1 rounded">
        {item.text}
      </span>
    );
  }
  if (item.type === "removed") {
    return (
      <span className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 line-through px-1 rounded">
        {item.text}
      </span>
    );
  }
  if (item.type === "unchanged") {
    return <span>{item.text}</span>;
  }

  // Modified
  return (
    <>
      {item.diff?.map((part, i) => {
        if (part.added) {
          return (
            <span
              key={i}
              className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-0.5 rounded"
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={i}
              className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 line-through px-0.5 rounded opacity-80"
            >
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

function SideBySideDiff({ item }: { item: DiffResult }) {
  if (item.type === "unchanged") {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="pr-4">{item.text}</div>
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
          {item.text}
        </div>
      </div>
    );
  }

  if (item.type === "added") {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="pr-4 text-slate-400 italic">No previous version</div>
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
          <span className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-1 rounded block">
            {item.text}
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "removed") {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="pr-4">
          <span className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 px-1 rounded block line-through opacity-80">
            {item.text}
          </span>
        </div>
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 text-slate-400 italic">
          Removed in this version
        </div>
      </div>
    );
  }

  // Modified
  return (
    <div className="grid grid-cols-2 gap-6 relative">
      <div className="pr-4">
        {item.diff?.map((part, i) => {
          if (part.added) return null;
          if (part.removed) {
            return (
              <span
                key={i}
                className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 px-0.5 rounded line-through opacity-80"
              >
                {part.value}
              </span>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
      <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
        {item.diff?.map((part, i) => {
          if (part.removed) return null;
          if (part.added) {
            return (
              <span
                key={i}
                className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-0.5 rounded"
              >
                {part.value}
              </span>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}
