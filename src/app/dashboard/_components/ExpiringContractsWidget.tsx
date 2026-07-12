"use client";

import { AlertCircle, Calendar, Clock } from "lucide-react";

interface ExpiringContractsWidgetProps {
  data: {
    days_30: number;
    days_60: number;
    days_90: number;
  };
}

export function ExpiringContractsWidget({ data }: ExpiringContractsWidgetProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_30}</span>
          <span className="text-sm text-muted-foreground">Expiring in 30 Days</span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
        <div className="rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
          <Clock className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_60}</span>
          <span className="text-sm text-muted-foreground">Expiring in 60 Days</span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
        <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_90}</span>
          <span className="text-sm text-muted-foreground">Expiring in 90 Days</span>
        </div>
      </div>
    </div>
  );
}
