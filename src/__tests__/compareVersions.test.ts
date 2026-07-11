/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClauseType } from "@prisma/client";
import { compareVersions } from "@/server/contracts/compare";

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

  it("matches clauses, identifies modification, and generates summary indicating decreased risk", async () => {
    // 1. Mock findFirst to return null (no existing comparison)
    (prisma.versionComparison.findFirst as any).mockResolvedValue(null);

    // 2. Mock $queryRaw to return clauses
    (prisma.$queryRaw as any).mockImplementation(
      async (strings: any, ...values: any[]) => {
        const versionId = values[0];
        if (versionId === "source-1") {
          return [
            {
              id: "clause-s1",
              clause_type: ClauseType.LIABILITY_CAP,
              text: "The liability under this agreement is strictly unlimited.",
              embedding_text: JSON.stringify([1.0, 0.0, 0.0]),
            },
          ];
        } else if (versionId === "target-2") {
          return [
            {
              id: "clause-t1",
              clause_type: ClauseType.LIABILITY_CAP,
              text: "The liability under this agreement is strictly capped at $100k.",
              embedding_text: JSON.stringify([0.9, 0.1, 0.0]),
            },
          ];
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

    // Diff JSON should show modified clause
    const diffJson = comparison.diff_json as any[];
    expect(diffJson).toHaveLength(1);

    const diffItem = diffJson[0];
    expect(diffItem.type).toBe("modified");
    expect(diffItem.clauseType).toBe(ClauseType.LIABILITY_CAP);
    expect(diffItem.diff).toBeDefined();

    // Check specific diff words
    const addedWord = diffItem.diff.find((d: any) => d.added);
    expect(addedWord).toBeDefined();
    expect(addedWord.value).toContain("capped at $100k");

    const removedWord = diffItem.diff.find((d: any) => d.removed);
    expect(removedWord).toBeDefined();
    expect(removedWord.value).toContain("unlimited");
  });
});
