import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { semanticSearchClauses } from "../src/server/search/semanticSearch";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

describe("Semantic Search", () => {
  let orgId: string;

  beforeAll(async () => {
    // 1. Create a dummy organization and contract
    const org = await prisma.organization.create({
      data: { name: "Test Org for Semantic Search" },
    });
    orgId = org.id;

    const contract = await prisma.contract.create({
      data: { org_id: org.id, title: "Test Contract" },
    });

    const cv = await prisma.contractVersion.create({
      data: {
        contract_id: contract.id,
        version_number: 1,
        content_text: "test",
      },
    });

    // 2. Generate embeddings for the clauses
    const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
    });

    const texts = [
      "The service provider's liability shall not exceed the total fees paid in the past 12 months, capped at $50,000.",
      "The service provider accepts unlimited liability exposure for any breaches of data security or negligence.",
    ];

    const vectors = await embeddingsModel.embedDocuments(texts);

    // 3. Insert clauses
    const c1 = await prisma.clause.create({
      data: {
        contract_version_id: cv.id,
        clause_type: "LIABILITY_CAP",
        text: texts[0],
        char_start: 0,
        char_end: texts[0].length,
      },
    });

    await prisma.$executeRaw`UPDATE "Clause" SET embedding = ${`[${vectors[0].join(",")}]`}::vector WHERE id = ${c1.id}`;

    const c2 = await prisma.clause.create({
      data: {
        contract_version_id: cv.id,
        clause_type: "LIABILITY_CAP",
        text: texts[1],
        char_start: 0,
        char_end: texts[1].length,
      },
    });

    await prisma.$executeRaw`UPDATE "Clause" SET embedding = ${`[${vectors[1].join(",")}]`}::vector WHERE id = ${c2.id}`;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
  });

  it("should rank unlimited liability exposure higher than $50k cap", async () => {
    const results = await semanticSearchClauses({
      orgId,
      query: "unlimited liability exposure",
      limit: 5,
    });

    expect(results.length).toBe(2);

    // The highest similarity result should be the one about unlimited liability
    expect(results[0].text).toContain("unlimited liability exposure");
    expect(results[1].text).toContain("capped at $50,000");

    // Similarity score should be higher
    expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
  });
});
