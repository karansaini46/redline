import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ClauseType, ContractStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface SemanticSearchOptions {
  orgId: string;
  query: string;
  filters?: {
    clauseType?: ClauseType;
    status?: ContractStatus;
  };
  limit?: number;
}

export interface SemanticSearchResult {
  id: string;
  clause_type: ClauseType;
  text: string;
  char_start: number;
  char_end: number;
  page_number: number | null;
  similarity: number;
  contract_title: string;
}

export async function semanticSearchClauses({
  orgId,
  query,
  filters,
  limit = 20,
}: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
  const embeddingsModel = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
  });

  const queryEmbedding = await embeddingsModel.embedQuery(query);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  const conditions: Prisma.Sql[] = [Prisma.sql`ct.org_id = ${orgId}`];

  if (filters?.clauseType) {
    conditions.push(
      Prisma.sql`c.clause_type = ${filters.clauseType}::"ClauseType"`,
    );
  }

  if (filters?.status) {
    conditions.push(
      Prisma.sql`ct.status = ${filters.status}::"ContractStatus"`,
    );
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const sqlQuery = Prisma.sql`
    SELECT 
      c.id, 
      c.clause_type, 
      c.text, 
      c.char_start, 
      c.char_end, 
      c.page_number,
      ct.title as contract_title,
      1 - (c.embedding <=> ${vectorString}::vector) as similarity
    FROM "Clause" c
    JOIN "ContractVersion" cv ON c.contract_version_id = cv.id
    JOIN "Contract" ct ON cv.contract_id = ct.id
    WHERE ${whereClause}
    ORDER BY c.embedding <=> ${vectorString}::vector
    LIMIT ${limit}
  `;

  const results = await prisma.$queryRaw<SemanticSearchResult[]>(sqlQuery);
  return results;
}
