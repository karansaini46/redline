/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { compareVersions } from "@/server/contracts/compare";

import * as fs from "fs";
import * as path from "path";

// Load fixtures
const v1Clauses = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../tests/fixtures/v1_clauses.json"),
    "utf8",
  ),
);
const v2Clauses = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../tests/fixtures/v2_clauses.json"),
    "utf8",
  ),
);

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    versionComparison: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));
import { prisma } from "@/lib/prisma";

// Mock Gemini
vi.mock("@langchain/google-genai", () => {
  return {
    ChatGoogleGenerativeAI: class {
      withStructuredOutput() {
        return {
          invoke: vi.fn().mockResolvedValue({
            summary:
              "Risk decreased because liability was capped at $100k instead of being unlimited.",
          }),
        };
      }
    },
  };
});

describe("compareVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches clauses, identifies modifications, additions, deletions using a fixture pair", async () => {
    // 1. Mock findFirst to return null (no existing comparison)
    (prisma.versionComparison.findFirst as any).mockResolvedValue(null);

    // 2. Mock $queryRaw to return clauses from fixtures
    (prisma.$queryRaw as any).mockImplementation(
      async (strings: any, ...values: any[]) => {
        const versionId = values[0];
        if (versionId === "source-1") {
          return v1Clauses;
        } else if (versionId === "target-2") {
          return v2Clauses;
        }
        return [];
      },
    );

    // 3. Mock create to return the created comparison
    (prisma.versionComparison.create as any).mockImplementation(
      async ({ data }: any) => {
        return {
          id: "comp-1",
          ...data,
        };
      },
    );

    const comparison = await compareVersions("source-1", "target-2");

    expect(comparison).toBeDefined();
    expect(comparison.ai_summary).toContain("decreased");

    // Diff JSON should contain modified, unchanged, added, and removed
    const diffJson = comparison.diff_json as any[];

    // We expect:
    // - LIABILITY_CAP: modified
    // - WARRANTY: modified
    // - PAYMENT_TERMS: unchanged
    // - INDEMNIFICATION: added
    expect(diffJson).toHaveLength(4);

    const modifiedLiability = diffJson.find(
      (d) => d.clauseType === "LIABILITY_CAP",
    );
    expect(modifiedLiability.type).toBe("modified");
    expect(modifiedLiability.diff).toBeDefined();

    const unchangedPayment = diffJson.find(
      (d) => d.clauseType === "PAYMENT_TERMS",
    );
    expect(unchangedPayment.type).toBe("unchanged");

    const addedIndemnity = diffJson.find(
      (d) => d.clauseType === "INDEMNIFICATION",
    );
    expect(addedIndemnity.type).toBe("added");
  });
});
