import { Suspense } from "react";
import {
  getClauseRiskDistribution,
  getExpiringContracts,
  getHighRiskContractTrend,
  getDashboardKPIs,
  getRecentInsights,
} from "./actions";
import { RiskDistributionChart } from "./_components/RiskDistributionChart";
import { ExpiringContractsWidget } from "./_components/ExpiringContractsWidget";
import { HighRiskTrendChart } from "./_components/HighRiskTrendChart";
import {
  FileText,
  ShieldAlert,
  Clock,
  Activity,
  Sparkles,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProcessingTimeline } from "./_components/AIProcessingTimeline";
import { RecentInsightsFeed } from "./_components/RecentInsightsFeed";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleHover,
} from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Overview",
  description: "View portfolio metrics and active contract processing status.",
};

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
  const [kpis, recentInsights] = await Promise.all([
    getDashboardKPIs(),
    getRecentInsights(),
  ]);
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Top Header */}
      <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 mb-8 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1 text-foreground">
            Overview
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            Portfolio metrics and active processing status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-border hover:bg-surface-elevated shadow-none rounded-xl gap-2"
          >
            <Download className="size-4" />
            Report
          </Button>
          <Button
            size="sm"
            className="shadow-none bg-foreground hover:bg-foreground/90 text-background rounded-xl gap-2"
          >
            New Contract
          </Button>
        </div>
      </FadeIn>

      {/* AI Processing Status */}
      {kpis.processing > 0 && (
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-border/50 bg-surface shadow-sm overflow-hidden p-6 transition-colors hover:border-foreground/20">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
              <h3 className="text-sm font-medium tracking-tight flex items-center gap-2 text-foreground font-serif">
                <div className="size-2 rounded-full bg-foreground animate-pulse" />
                Active Pipeline
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-lg uppercase tracking-widest">
                Live
              </span>
            </div>
            <AIProcessingTimeline />
          </div>
        </FadeIn>
      )}

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Active Contracts",
            value: kpis.activeContracts.toLocaleString(),
            change: "Total",
            icon: FileText,
          },
          {
            label: "High Risk Flags",
            value: kpis.highRiskFlags.toLocaleString(),
            change: "Attention",
            icon: ShieldAlert,
          },
          {
            label: "Pending Renewals",
            value: kpis.pendingRenewals.toLocaleString(),
            change: "Upcoming",
            icon: Clock,
          },
          {
            label: "Processing",
            value: kpis.processing.toLocaleString(),
            change: "Current",
            icon: Activity,
          },
        ].map((kpi, i) => (
          <StaggerItem key={i}>
            <ScaleHover className="rounded-2xl border border-border/50 bg-surface shadow-sm p-6 h-full flex flex-col justify-between group hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <kpi.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-[10px] font-medium px-2 py-1 rounded-md uppercase tracking-widest text-muted-foreground bg-muted/50">
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <h3 className="text-3xl font-serif text-foreground">
                  {kpi.value}
                </h3>
              </div>
            </ScaleHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Charts Grid */}
      <FadeIn delay={0.2} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-border/50 bg-surface shadow-sm transition-all hover:border-foreground/20 overflow-hidden">
          <div className="flex flex-col space-y-1 p-6 border-b border-border/50 bg-muted/20">
            <h3 className="text-base font-medium font-serif tracking-tight">
              Clause Risk Distribution
            </h3>
            <p className="text-sm text-muted-foreground font-light">
              Risk severity across categories.
            </p>
          </div>
          <div className="p-6 h-[400px]">
            <Suspense
              fallback={
                <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
              }
            >
              <RiskDistributionSection />
            </Suspense>
          </div>
        </div>

        <div className="col-span-1 rounded-2xl border border-border/50 bg-surface shadow-sm transition-all flex flex-col hover:border-foreground/20 overflow-hidden">
          <div className="flex flex-col space-y-1 p-6 border-b border-border/50 bg-muted/20">
            <h3 className="text-base font-medium font-serif tracking-tight flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              Recent Insights
            </h3>
            <p className="text-sm text-muted-foreground font-light">
              Latest findings by Gemini.
            </p>
          </div>
          <div className="p-0 flex-1 overflow-hidden">
            <RecentInsightsFeed insights={recentInsights} />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-border/50 bg-surface shadow-sm transition-all hover:border-foreground/20 overflow-hidden">
          <div className="flex flex-col space-y-1 p-6 border-b border-border/50 bg-muted/20">
            <h3 className="text-base font-medium font-serif tracking-tight">
              High-Risk Trend
            </h3>
            <p className="text-sm text-muted-foreground font-light">
              New high-risk contracts added over 90 days.
            </p>
          </div>
          <div className="p-6 h-[400px]">
            <Suspense
              fallback={
                <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
              }
            >
              <HighRiskTrendSection />
            </Suspense>
          </div>
        </div>

        <div className="col-span-1 rounded-2xl border border-border/50 bg-surface shadow-sm transition-all flex flex-col hover:border-foreground/20 overflow-hidden">
          <div className="flex flex-col space-y-1 p-6 border-b border-border/50 bg-muted/20">
            <h3 className="text-base font-medium font-serif tracking-tight">
              Expirations
            </h3>
            <p className="text-sm text-muted-foreground font-light">
              Contracts expiring soon.
            </p>
          </div>
          <div className="p-0 flex-1 overflow-hidden h-[400px]">
            <Suspense
              fallback={
                <div className="p-6">
                  <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
                </div>
              }
            >
              <ExpiringContractsSection />
            </Suspense>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
