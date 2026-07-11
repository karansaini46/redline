export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Risk</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1: Clause Risk Distribution (2 cols) */}
        <div className="col-span-1 md:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="p-6 pt-0 h-[300px]">
            <div className="h-full w-full animate-pulse bg-muted rounded-md" />
          </div>
        </div>

        {/* Row 1: Expiring Contracts (1 col) */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="p-6 pt-0 h-[300px]">
              <div className="h-full w-full animate-pulse bg-muted rounded-md" />
            </div>
          </div>
        </div>

        {/* Row 2: High-Risk Trend */}
        <div className="col-span-1 md:col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="h-5 w-56 bg-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="p-6 pt-0 h-[350px]">
            <div className="h-full w-full animate-pulse bg-muted rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
