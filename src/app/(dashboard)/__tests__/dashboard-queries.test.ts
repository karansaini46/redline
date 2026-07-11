import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClauseType, RiskSeverity } from "@prisma/client";
import { getClauseRiskDistribution } from "../actions";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

describe("Dashboard Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getClauseRiskDistribution returns correct counts against the seeded fixture", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.organization.findFirst as any).mockResolvedValue({
      id: "org-1",
    });

    // Mock the raw SQL result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.$queryRaw as any).mockResolvedValue([
      { clause_type: ClauseType.LIABILITY_CAP, risk_severity: RiskSeverity.CRITICAL, count: 2 },
      { clause_type: ClauseType.LIABILITY_CAP, risk_severity: RiskSeverity.MEDIUM, count: 1 },
      { clause_type: ClauseType.PAYMENT_TERMS, risk_severity: RiskSeverity.LOW, count: 3 },
      { clause_type: ClauseType.AUTO_RENEWAL, risk_severity: RiskSeverity.HIGH, count: 1 },
    ]);

    const distribution = await getClauseRiskDistribution("org-1");
    
    expect(distribution).toHaveLength(4);

    const liabilityCritical = distribution.find(
      (d) => d.clause_type === ClauseType.LIABILITY_CAP && d.risk_severity === RiskSeverity.CRITICAL
    );
    expect(liabilityCritical).toBeDefined();
    expect(liabilityCritical?.count).toBe(2);

    const liabilityMedium = distribution.find(
      (d) => d.clause_type === ClauseType.LIABILITY_CAP && d.risk_severity === RiskSeverity.MEDIUM
    );
    expect(liabilityMedium).toBeDefined();
    expect(liabilityMedium?.count).toBe(1);

    const paymentLow = distribution.find(
      (d) => d.clause_type === ClauseType.PAYMENT_TERMS && d.risk_severity === RiskSeverity.LOW
    );
    expect(paymentLow).toBeDefined();
    expect(paymentLow?.count).toBe(3);

    const autoRenewalHigh = distribution.find(
      (d) => d.clause_type === ClauseType.AUTO_RENEWAL && d.risk_severity === RiskSeverity.HIGH
    );
    expect(autoRenewalHigh).toBeDefined();
    expect(autoRenewalHigh?.count).toBe(1);
  });
});
