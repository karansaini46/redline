import { describe, it, expect } from "vitest";
import { ClauseType, RiskSeverity } from "@prisma/client";
import { calculateDeterministicRisk } from "@/server/risk/scoreClause";

describe("calculateDeterministicRisk", () => {
  it("flags short auto-renewal notice period (Rule 1)", () => {
    const text =
      "This agreement automatically renews. Notice must be given 15 days in advance.";
    const result = calculateDeterministicRisk(ClauseType.AUTO_RENEWAL, text);
    expect(result.severity).toBe(RiskSeverity.MEDIUM);
    expect(
      result.flags.some((f) => f.category === "Notice Period Too Short"),
    ).toBe(true);
  });

  it("flags auto-renewal without notice (Rule 2)", () => {
    const text = "This agreement automatically renews without notice.";
    const result = calculateDeterministicRisk(ClauseType.AUTO_RENEWAL, text);
    expect(result.severity).toBe(RiskSeverity.HIGH);
    expect(
      result.flags.some(
        (f) => f.category === "Automatic Renewal Without Notice",
      ),
    ).toBe(true);
  });

  it("flags non-mutual indemnification (Rule 3)", () => {
    const text = "Customer shall indemnify the Company from all claims.";
    const result = calculateDeterministicRisk(ClauseType.INDEMNIFICATION, text);
    expect(result.severity).toBe(RiskSeverity.HIGH);
    expect(
      result.flags.some((f) => f.category === "One-Sided Indemnification"),
    ).toBe(true);
  });

  it("flags broad indemnification with indirect/consequential damages (Rule 4)", () => {
    const text =
      "Both parties agree to mutual indemnification for any indirect damages.";
    const result = calculateDeterministicRisk(ClauseType.INDEMNIFICATION, text);
    expect(result.severity).toBe(RiskSeverity.HIGH);
    expect(
      result.flags.some((f) => f.category === "Broad Indemnification Scope"),
    ).toBe(true);
  });

  it("flags unlimited liability (Rule 5)", () => {
    const text = "The liability of the service provider is unlimited.";
    const result = calculateDeterministicRisk(ClauseType.LIABILITY_CAP, text);
    expect(result.severity).toBe(RiskSeverity.CRITICAL);
    expect(result.flags.some((f) => f.category === "Unlimited Liability")).toBe(
      true,
    );
  });

  it("flags extended payment terms net 60 (Rule 6)", () => {
    const text = "Payment terms are net 60 days.";
    const result = calculateDeterministicRisk(ClauseType.PAYMENT_TERMS, text);
    expect(result.severity).toBe(RiskSeverity.MEDIUM);
    expect(
      result.flags.some((f) => f.category === "Extended Payment Terms"),
    ).toBe(true);
  });

  it("flags extended payment terms net 90 (Rule 7)", () => {
    const text = "Payment terms are net 90.";
    const result = calculateDeterministicRisk(ClauseType.PAYMENT_TERMS, text);
    expect(result.severity).toBe(RiskSeverity.MEDIUM);
    expect(
      result.flags.some((f) => f.category === "Extended Payment Terms"),
    ).toBe(true);
  });

  it("flags as-is warranty (Rule 8)", () => {
    const text = "The software is provided as-is without warranty.";
    const result = calculateDeterministicRisk(ClauseType.WARRANTY, text);
    expect(result.severity).toBe(RiskSeverity.HIGH);
    expect(
      result.flags.some((f) => f.category === "Disclaimer of All Warranties"),
    ).toBe(true);
  });

  it("returns low severity for safe clauses", () => {
    const text = "Payment terms are net 30 days.";
    const result = calculateDeterministicRisk(ClauseType.PAYMENT_TERMS, text);
    expect(result.severity).toBe(RiskSeverity.LOW);
    expect(result.flags).toHaveLength(0);
  });
});
