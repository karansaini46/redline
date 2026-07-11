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

  const result = await prisma.$queryRaw<{ clause_type: ClauseType; risk_severity: RiskSeverity; count: number }[]>`
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

  return result.map(row => ({
    clause_type: row.clause_type,
    risk_severity: row.risk_severity,
    count: Number(row.count)
  }));
}

export async function getExpiringContracts() {
  const org = await prisma.organization.findFirst();
  if (!org) return { days_30: 0, days_60: 0, days_90: 0 };
  const orgId = org.id;

  const result = await prisma.$queryRaw<{ days_30: number; days_60: number; days_90: number }[]>`
    SELECT 
      SUM(CASE WHEN due_date <= NOW() + INTERVAL '30 days' THEN 1 ELSE 0 END)::int as days_30,
      SUM(CASE WHEN due_date > NOW() + INTERVAL '30 days' AND due_date <= NOW() + INTERVAL '60 days' THEN 1 ELSE 0 END)::int as days_60,
      SUM(CASE WHEN due_date > NOW() + INTERVAL '60 days' AND due_date <= NOW() + INTERVAL '90 days' THEN 1 ELSE 0 END)::int as days_90
    FROM "Contract"
    WHERE org_id = ${orgId} 
      AND due_date > NOW() 
      AND due_date <= NOW() + INTERVAL '90 days'
  `;

  if (!result || result.length === 0) {
    return { days_30: 0, days_60: 0, days_90: 0 };
  }

  return {
    days_30: Number(result[0].days_30 || 0),
    days_60: Number(result[0].days_60 || 0),
    days_90: Number(result[0].days_90 || 0)
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

  return result.map(row => ({
    date: row.date.toISOString(),
    count: Number(row.count)
  }));
}
