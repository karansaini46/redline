import { Suspense } from "react";
import { getClauseRiskDistribution, getExpiringContracts, getHighRiskContractTrend } from "./actions";
import { RiskDistributionChart } from "./_components/RiskDistributionChart";
import { ExpiringContractsWidget } from "./_components/ExpiringContractsWidget";
import { HighRiskTrendChart } from "./_components/HighRiskTrendChart";

// Server components for data fetching
async function RiskDistributionSection() {
  const data = await getClauseRiskDistribution();
  return <RiskDistributionChart data={data} />;
}

async function ExpiringContractsSection() {
  const data = await getExpiringContracts();
  return <ExpiringContractsWidget data={data} />;
}

async function HighRiskTrendSection() {
  const data = await getHighRiskContractTrend();
  return <HighRiskTrendChart data={data} />;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Risk</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1: Clause Risk Distribution (2 cols) and Expiring Contracts (1 col) */}
        <div className="col-span-1 md:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Clause Risk Distribution</h3>
            <p className="text-sm text-muted-foreground">Risk severity across different clause categories.</p>
          </div>
          <div className="p-6 pt-0 h-[300px]">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted rounded-md" />}>
              <RiskDistributionSection />
            </Suspense>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <h3 className="font-semibold leading-none tracking-tight">Upcoming Expirations</h3>
              <p className="text-sm text-muted-foreground">Contracts expiring soon.</p>
            </div>
            <div className="p-6 pt-0 h-[300px]">
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted rounded-md" />}>
                <ExpiringContractsSection />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Row 2: High-Risk Trend */}
        <div className="col-span-1 md:col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">High-Risk Contracts Trend</h3>
            <p className="text-sm text-muted-foreground">New high-risk contracts added over the last 90 days.</p>
          </div>
          <div className="p-6 pt-0 h-[350px]">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted rounded-md" />}>
              <HighRiskTrendSection />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
