import { describe, it, expect } from "vitest";
import { ClauseType, RiskSeverity } from "@prisma/client";
import { calculateDeterministicRisk } from "../scoreClause";

describe("calculateDeterministicRisk", () => {
  describe("AUTO_RENEWAL", () => {
    it("should flag HIGH severity for automatic renewal without notice", () => {
      const result = calculateDeterministicRisk(
        ClauseType.AUTO_RENEWAL,
        "This agreement automatically renews without notice for successive one-year terms.",
      );
      expect(result.severity).toBe(RiskSeverity.HIGH);
      expect(result.flags.length).toBe(1);
      expect(result.flags[0].category).toBe("Automatic Renewal Without Notice");
    });

    it("should flag MEDIUM severity for notice period less than 30 days", () => {
      const result = calculateDeterministicRisk(
        ClauseType.AUTO_RENEWAL,
        "Party must provide written notice of non-renewal at least fifteen days prior to expiration.",
      );
      expect(result.severity).toBe(RiskSeverity.MEDIUM);
      expect(result.flags[0].category).toBe("Notice Period Too Short");
    });

    it("should pass (LOW severity) for notice period 30 days or more", () => {
      const result = calculateDeterministicRisk(
        ClauseType.AUTO_RENEWAL,
        "Party must provide written notice of non-renewal at least sixty days prior to expiration.",
      );
      expect(result.severity).toBe(RiskSeverity.LOW);
      expect(result.flags.length).toBe(0);
    });
  });

  describe("INDEMNIFICATION", () => {
    it("should flag HIGH severity if not mutual", () => {
      const result = calculateDeterministicRisk(
        ClauseType.INDEMNIFICATION,
        "Customer agrees to indemnify, defend and hold harmless the Company.",
      );
      expect(result.severity).toBe(RiskSeverity.HIGH);
      expect(result.flags[0].category).toBe("One-Sided Indemnification");
    });

    it("should flag HIGH severity if it covers indirect damages", () => {
      const result = calculateDeterministicRisk(
        ClauseType.INDEMNIFICATION,
        "Each party shall mutually indemnify the other against any direct and indirect damages.",
      );
      expect(result.severity).toBe(RiskSeverity.HIGH);
      // 'mutual' is present, so it shouldn't have One-Sided flag
      expect(result.flags.length).toBe(1);
      expect(result.flags[0].category).toBe("Broad Indemnification Scope");
    });

    it("should pass (LOW severity) for mutual indemnification without indirect damages", () => {
      const result = calculateDeterministicRisk(
        ClauseType.INDEMNIFICATION,
        "The parties mutually agree to indemnify each other against third-party claims for direct damages.",
      );
      expect(result.severity).toBe(RiskSeverity.LOW);
      expect(result.flags.length).toBe(0);
    });
  });

  describe("LIABILITY_CAP", () => {
    it("should flag CRITICAL severity for unlimited liability", () => {
      const result = calculateDeterministicRisk(
        ClauseType.LIABILITY_CAP,
        "The liability of the service provider shall be without limit.",
      );
      expect(result.severity).toBe(RiskSeverity.CRITICAL);
      expect(result.flags[0].category).toBe("Unlimited Liability");
    });

    it("should pass (LOW severity) when liability is limited", () => {
      const result = calculateDeterministicRisk(
        ClauseType.LIABILITY_CAP,
        "Total liability is capped at the total fees paid in the trailing 12 months.",
      );
      expect(result.severity).toBe(RiskSeverity.LOW);
      expect(result.flags.length).toBe(0);
    });
  });

  describe("PAYMENT_TERMS", () => {
    it("should flag MEDIUM severity for extended payment terms", () => {
      const result = calculateDeterministicRisk(
        ClauseType.PAYMENT_TERMS,
        "Invoices shall be payable net 90 days from receipt.",
      );
      expect(result.severity).toBe(RiskSeverity.MEDIUM);
      expect(result.flags[0].category).toBe("Extended Payment Terms");
    });

    it("should pass (LOW severity) for standard payment terms", () => {
      const result = calculateDeterministicRisk(
        ClauseType.PAYMENT_TERMS,
        "Invoices shall be payable net 30 days from receipt.",
      );
      expect(result.severity).toBe(RiskSeverity.LOW);
      expect(result.flags.length).toBe(0);
    });
  });

  describe("WARRANTY", () => {
    it("should flag HIGH severity for 'as is' disclaimer", () => {
      const result = calculateDeterministicRisk(
        ClauseType.WARRANTY,
        "The software is provided as is without any warranty of any kind.",
      );
      expect(result.severity).toBe(RiskSeverity.HIGH);
      expect(result.flags[0].category).toBe("Disclaimer of All Warranties");
    });
  });
});
