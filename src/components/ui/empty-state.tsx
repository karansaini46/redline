"use client";

import React from "react";
import { FadeIn } from "./motion";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <FadeIn className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border bg-card shadow-sm ${className}`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        {description}
      </p>
      <div className="flex gap-4">
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
      </div>
    </FadeIn>
  );
}
