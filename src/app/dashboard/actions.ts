"use server";

import { prisma } from "@/lib/prisma";
import { ClauseType, RiskSeverity } from "@prisma/client";

export async function getClauseRiskDistribution(orgId?: string) {
  let finalOrgId = orgId;
  if (!finalOrgId) {
    const org = await prisma.organization.findFirst();
    if (!org) return [];
    finalOrgId = org.id;
  }

  const result = await prisma.$queryRaw<
    { clause_type: ClauseType; risk_severity: RiskSeverity; count: number }[]
  >`
    SELECT 
      c.clause_type, 
      c.risk_severity, 
      COUNT(c.id)::int as count
    FROM "Clause" c
    JOIN "ContractVersion" cv ON c.contract_version_id = cv.id
    JOIN "Contract" co ON cv.contract_id = co.id
    WHERE co.org_id = ${finalOrgId} AND c.risk_severity IS NOT NULL
    GROUP BY c.clause_type, c.risk_severity
  `;

  return result.map((row) => ({
    clause_type: row.clause_type,
    risk_severity: row.risk_severity,
    count: Number(row.count),
  }));
}

export async function getExpiringContracts() {
  const org = await prisma.organization.findFirst();
  if (!org) return { days_30: 0, days_60: 0, days_90: 0 };
  const orgId = org.id;

  const result = await prisma.$queryRaw<
    { days_30: number; days_60: number; days_90: number }[]
  >`
    SELECT 
      COUNT(DISTINCT CASE WHEN o.due_date <= NOW() + INTERVAL '30 days' THEN c.id END)::int as days_30,
      COUNT(DISTINCT CASE WHEN o.due_date > NOW() + INTERVAL '30 days' AND o.due_date <= NOW() + INTERVAL '60 days' THEN c.id END)::int as days_60,
      COUNT(DISTINCT CASE WHEN o.due_date > NOW() + INTERVAL '60 days' AND o.due_date <= NOW() + INTERVAL '90 days' THEN c.id END)::int as days_90
    FROM "Contract" c
    JOIN "Obligation" o ON c.id = o.contract_id
    WHERE c.org_id = ${orgId} 
      AND o.due_date > NOW() 
      AND o.due_date <= NOW() + INTERVAL '90 days'
      AND o.status = 'OPEN'::"ObligationStatus"
  `;

  if (!result || result.length === 0) {
    return { days_30: 0, days_60: 0, days_90: 0 };
  }

  return {
    days_30: Number(result[0].days_30 || 0),
    days_60: Number(result[0].days_60 || 0),
    days_90: Number(result[0].days_90 || 0),
  };
}

export async function getHighRiskContractTrend() {
  const org = await prisma.organization.findFirst();
  if (!org) return [];
  const orgId = org.id;

  const result = await prisma.$queryRaw<{ date: Date; count: number }[]>`
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(id)::int as count
    FROM "Contract"
    WHERE org_id = ${orgId} 
      AND risk_score >= 75
      AND created_at >= NOW() - INTERVAL '90 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date ASC
  `;

  return result.map((row) => ({
    date: row.date.toISOString(),
    count: Number(row.count),
  }));
}

export async function getDashboardKPIs() {
  const org = await prisma.organization.findFirst();
  if (!org)
    return {
      activeContracts: 0,
      highRiskFlags: 0,
      pendingRenewals: 0,
      processing: 0,
    };

  const orgId = org.id;

  const activeContracts = await prisma.contract.count({
    where: { org_id: orgId },
  });

  const highRiskFlags = await prisma.clause.count({
    where: {
      contract_version: { contract: { org_id: orgId } },
      risk_severity: { in: ["HIGH", "CRITICAL"] },
    },
  });

  const pendingRenewals = await prisma.obligation.count({
    where: {
      contract: { org_id: orgId },
      description: { contains: "renewal", mode: "insensitive" },
      status: "OPEN",
    },
  });

  const processing = await prisma.contractVersion.count({
    where: {
      contract: { org_id: orgId },
      processing_status: { in: ["PENDING", "EXTRACTING"] },
    },
  });

  return { activeContracts, highRiskFlags, pendingRenewals, processing };
}

export async function getRecentInsights() {
  const org = await prisma.organization.findFirst();
  if (!org) return [];

  const orgId = org.id;

  const insights = await prisma.riskFlag.findMany({
    where: {
      clause: {
        contract_version: {
          contract: {
            org_id: orgId,
          },
        },
      },
      severity: { in: ["HIGH", "CRITICAL"] },
    },
    include: {
      clause: {
        include: {
          contract_version: {
            include: {
              contract: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 5,
  });

  return insights.map((insight) => ({
    id: insight.id,
    title: insight.category || "Risk Detected",
    contract: insight.clause.contract_version.contract.title,
    contractId: insight.clause.contract_version.contract.id,
    clauseId: insight.clause.id,
    time: insight.created_at,
    severity: insight.severity,
  }));
}
