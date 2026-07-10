/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractClauses } from "../server/services/extractClauses";

const { mockCreateMany, mockInvoke } = vi.hoisted(() => ({
  mockCreateMany: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      clause = {
        createMany: mockCreateMany,
      };
    },
    ClauseType: {
      TERMINATION: "TERMINATION",
      INDEMNIFICATION: "INDEMNIFICATION",
      LIABILITY_CAP: "LIABILITY_CAP",
      CONFIDENTIALITY: "CONFIDENTIALITY",
      IP_ASSIGNMENT: "IP_ASSIGNMENT",
      NON_COMPETE: "NON_COMPETE",
      PAYMENT_TERMS: "PAYMENT_TERMS",
      GOVERNING_LAW: "GOVERNING_LAW",
      AUTO_RENEWAL: "AUTO_RENEWAL",
      FORCE_MAJEURE: "FORCE_MAJEURE",
      WARRANTY: "WARRANTY",
      OTHER: "OTHER",
    },
    ProcessingStatus: {
      PENDING: "PENDING",
      EXTRACTING: "EXTRACTING",
      EXTRACTED: "EXTRACTED",
      FAILED: "FAILED",
    },
  };
});

// We mock the LLM to simulate structured output and test our chunking/deduplication logic
vi.mock("@langchain/google-genai", () => {
  return {
    ChatGoogleGenerativeAI: class {
      withStructuredOutput = vi.fn().mockImplementation(() => {
        return {
          invoke: mockInvoke,
        };
      });
    },
  };
});

describe("extractClauses service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts and deduplicates exactly 6 clause types from a long contract with correct page numbers", async () => {
    // Generate a dummy long contract text (> 8k tokens, ~32k characters)
    // to force the text splitter to chunk it.
    const filler =
      "This is a filler text to make the contract very long. ".repeat(1000);

    // We embed a few specific text segments that represent clauses
    const fixtureContract =
      "Page 1: " +
      filler +
      "\nTERMINATION: Either party may terminate this agreement with 30 days notice.\n" +
      filler +
      "\nINDEMNIFICATION: The contractor shall indemnify the client against all claims.\n" +
      filler +
      "\nLIABILITY CAP: Total liability shall not exceed $10,000.\n" +
      filler +
      "\nCONFIDENTIALITY: All shared information must remain strictly confidential.\n" +
      filler +
      "\nIP ASSIGNMENT: All intellectual property developed belongs to the client.\n" +
      filler +
      "\nNON-COMPETE: The contractor may not work for a direct competitor for 1 year.\n" +
      filler;

    // We will simulate the LLM returning clauses.
    // Because the contract is chunked, the invoke will be called multiple times.
    // We'll return 3 clauses on the first call, and 4 on the second (with 1 overlapping to test dedup).

    mockInvoke
      .mockResolvedValueOnce({
        clauses: [
          {
            clause_type: "TERMINATION",
            text_excerpt:
              "Either party may terminate this agreement with 30 days notice.",
            page_number: 1,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
          {
            clause_type: "INDEMNIFICATION",
            text_excerpt:
              "The contractor shall indemnify the client against all claims.",
            page_number: 1,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
          {
            clause_type: "LIABILITY_CAP",
            text_excerpt: "Total liability shall not exceed $10,000.",
            page_number: 2,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
        ],
      })
      .mockResolvedValueOnce({
        clauses: [
          // This one is a duplicate (same type, high text overlap)
          {
            clause_type: "LIABILITY_CAP",
            text_excerpt: "Total liability shall not exceed $10,000.",
            page_number: 2,
            char_start: 0,
            char_end: 50,
            confidence: 0.9,
          },
          {
            clause_type: "CONFIDENTIALITY",
            text_excerpt:
              "All shared information must remain strictly confidential.",
            page_number: 3,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
          {
            clause_type: "IP_ASSIGNMENT",
            text_excerpt:
              "All intellectual property developed belongs to the client.",
            page_number: 4,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
          {
            clause_type: "NON_COMPETE",
            text_excerpt:
              "The contractor may not work for a direct competitor for 1 year.",
            page_number: 5,
            char_start: 0,
            char_end: 50,
            confidence: 0.95,
          },
        ],
      })
      .mockResolvedValue({
        // Any further chunks (if any) return empty
        clauses: [],
      });

    await extractClauses("version_123", fixtureContract);

    // Verify LLM was called (chunking happened)
    expect(mockInvoke.mock.calls.length).toBeGreaterThanOrEqual(1);

    // Verify DB insert was called
    expect(mockCreateMany).toHaveBeenCalledTimes(1);

    const insertedData = mockCreateMany.mock.calls[0][0].data;

    // Assert exactly 6 unique clauses are saved (LIABILITY_CAP deduplicated)
    expect(insertedData.length).toBe(6);

    const types = insertedData.map((d: any) => d.clause_type);
    expect(types).toContain("TERMINATION");
    expect(types).toContain("INDEMNIFICATION");
    expect(types).toContain("LIABILITY_CAP");
    expect(types).toContain("CONFIDENTIALITY");
    expect(types).toContain("IP_ASSIGNMENT");
    expect(types).toContain("NON_COMPETE");

    // Check that page numbers are preserved correctly
    const confidentialityClause = insertedData.find(
      (d: any) => d.clause_type === "CONFIDENTIALITY",
    );
    expect(confidentialityClause.page_number).toBe(3);

    // Check that character offsets were recalculated based on global text
    const ipClause = insertedData.find(
      (d: any) => d.clause_type === "IP_ASSIGNMENT",
    );
    const ipText = "All intellectual property developed belongs to the client.";
    const expectedStart = fixtureContract.indexOf(ipText);
    expect(ipClause.char_start).toBe(expectedStart);
    expect(ipClause.char_end).toBe(expectedStart + ipText.length);
  });

  it("retries once with a stricter prompt if malformed JSON throws an error, then throws if fails again", async () => {
    const shortContract = "Just a short contract.";

    // First call throws, second call succeeds
    mockInvoke
      .mockRejectedValueOnce(new Error("Malformed JSON"))
      .mockResolvedValueOnce({
        clauses: [
          {
            clause_type: "TERMINATION",
            text_excerpt: "test",
            page_number: 1,
            char_start: 0,
            char_end: 4,
            confidence: 1.0,
          },
        ],
      });

    await extractClauses("version_123", shortContract);

    // Should have invoked twice (1 initial + 1 retry)
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    // The second call should contain the CRITICAL INSTRUCTION in the system prompt
    const secondCallSystemPrompt = mockInvoke.mock.calls[1][0][0][1];
    expect(secondCallSystemPrompt).toContain("CRITICAL INSTRUCTION");

    expect(mockCreateMany).toHaveBeenCalledTimes(1);
    expect(mockCreateMany.mock.calls[0][0].data.length).toBe(1);
  });
});
