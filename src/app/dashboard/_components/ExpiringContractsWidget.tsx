"use client";

import { AlertCircle, Calendar, Clock } from "lucide-react";
import Link from "next/link";

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
      <Link href="/dashboard/contracts?expires=30" className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 hover:border-foreground/30 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_30}</span>
          <span className="text-sm text-muted-foreground">Expiring in 30 Days</span>
        </div>
      </Link>

      <Link href="/dashboard/contracts?expires=60" className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 hover:border-foreground/30 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
          <Clock className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_60}</span>
          <span className="text-sm text-muted-foreground">Expiring in 60 Days</span>
        </div>
      </Link>

      <Link href="/dashboard/contracts?expires=90" className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 hover:border-foreground/30 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold">{data.days_90}</span>
          <span className="text-sm text-muted-foreground">Expiring in 90 Days</span>
        </div>
      </Link>
    </div>
  );
}
