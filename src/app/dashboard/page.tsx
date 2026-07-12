import { Suspense } from "react";
import { getClauseRiskDistribution, getExpiringContracts, getHighRiskContractTrend, getDashboardKPIs } from "./actions";
import { RiskDistributionChart } from "./_components/RiskDistributionChart";
import { ExpiringContractsWidget } from "./_components/ExpiringContractsWidget";
import { HighRiskTrendChart } from "./_components/HighRiskTrendChart";
import { FileText, ShieldAlert, Clock, ArrowUpRight, Activity, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProcessingTimeline } from "./_components/AIProcessingTimeline";
import { RecentInsightsFeed } from "./_components/RecentInsightsFeed";
import { FadeIn, StaggerContainer, StaggerItem, ScaleHover } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";

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

export default async function DashboardPage() {
  const kpis = await getDashboardKPIs();
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Top Header */}
      <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Portfolio metrics and active processing status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-surface shadow-sm gap-2">
            <Download className="size-3.5" />
            Report
          </Button>
          <Button size="sm" className="shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            New Contract
          </Button>
        </div>
      </FadeIn>

      {/* AI Processing Status */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-border/40 bg-surface shadow-sm overflow-hidden p-6 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium tracking-tight flex items-center gap-2 text-foreground">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              Active Pipeline
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
          <AIProcessingTimeline />
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Contracts", value: kpis.activeContracts.toLocaleString(), change: "Total", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "High Risk Flags", value: kpis.highRiskFlags.toLocaleString(), change: "Attention", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Pending Renewals", value: kpis.pendingRenewals.toLocaleString(), change: "Upcoming", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Processing", value: kpis.processing.toLocaleString(), change: "Current", icon: ArrowUpRight, color: "text-success", bg: "bg-success/10" },
        ].map((kpi, i) => (
          <StaggerItem key={i}>
            <ScaleHover className="rounded-xl border border-border/40 bg-surface shadow-sm p-5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className={`size-8 rounded-lg ${kpi.bg} flex items-center justify-center shadow-sm`}>
                  <kpi.icon className={`size-4 ${kpi.color}`} />
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${kpi.change === 'Attention' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</h3>
              </div>
            </ScaleHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Charts Grid */}
      <FadeIn delay={0.2} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-border/40 bg-surface shadow-sm hover:shadow-md hover:border-border/80 transition-all">
          <div className="flex flex-col space-y-1 p-5 border-b border-border/40">
            <h3 className="text-sm font-medium tracking-tight">Clause Risk Distribution</h3>
            <p className="text-xs text-muted-foreground">Risk severity across categories.</p>
          </div>
          <div className="p-5 h-[320px]">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <RiskDistributionSection />
            </Suspense>
          </div>
        </div>

        <div className="col-span-1 rounded-xl border border-border/40 bg-surface shadow-sm hover:shadow-md hover:border-border/80 transition-all flex flex-col">
          <div className="flex flex-col space-y-1 p-5 border-b border-border/40">
            <h3 className="text-sm font-medium tracking-tight flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              Recent Insights
            </h3>
            <p className="text-xs text-muted-foreground">Latest findings by Gemini.</p>
          </div>
          <div className="p-0 flex-1 overflow-hidden">
            <RecentInsightsFeed />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 rounded-xl border border-border/40 bg-surface shadow-sm hover:shadow-md hover:border-border/80 transition-all">
          <div className="flex flex-col space-y-1 p-5 border-b border-border/40">
            <h3 className="text-sm font-medium tracking-tight">High-Risk Trend</h3>
            <p className="text-xs text-muted-foreground">New high-risk contracts added over 90 days.</p>
          </div>
          <div className="p-5 h-[320px]">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <HighRiskTrendSection />
            </Suspense>
          </div>
        </div>

        <div className="col-span-1 rounded-xl border border-border/40 bg-surface shadow-sm hover:shadow-md hover:border-border/80 transition-all flex flex-col">
          <div className="flex flex-col space-y-1 p-5 border-b border-border/40">
            <h3 className="text-sm font-medium tracking-tight">Expirations</h3>
            <p className="text-xs text-muted-foreground">Contracts expiring soon.</p>
          </div>
          <div className="p-0 flex-1 overflow-hidden h-[320px]">
            <Suspense fallback={<div className="p-5"><Skeleton className="h-full w-full" /></div>}>
              <ExpiringContractsSection />
            </Suspense>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
