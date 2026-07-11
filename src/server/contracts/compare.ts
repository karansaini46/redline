import { ClauseType, VersionComparison } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { diffWords, Change } from "diff";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

interface ClauseWithVector {
  id: string;
  clause_type: ClauseType;
  text: string;
  embedding: number[] | null;
}

export interface DiffResult {
  type: "added" | "removed" | "modified" | "unchanged";
  clauseType: ClauseType;
  sourceClauseId?: string;
  targetClauseId?: string;
  text?: string;
  diff?: Change[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const LLMResponseSchema = z.object({
  summary: z
    .string()
    .describe(
      "A one-paragraph summary of what changed and whether overall risk increased, decreased, or stayed the same, and why.",
    ),
});

export async function compareVersions(
  sourceVersionId: string,
  targetVersionId: string,
): Promise<VersionComparison> {
  // Check if comparison already exists
  const existing = await prisma.versionComparison.findFirst({
    where: {
      source_version_id: sourceVersionId,
      target_version_id: targetVersionId,
    },
  });

  if (existing) {
    return existing;
  }

  // Fetch clauses for both versions
  const sourceClausesRaw = await prisma.$queryRaw<
    Array<{
      id: string;
      clause_type: ClauseType;
      text: string;
      embedding_text: string | null;
    }>
  >`
    SELECT id, clause_type, text, embedding::text as embedding_text 
    FROM "Clause" 
    WHERE contract_version_id = ${sourceVersionId}
  `;

  const targetClausesRaw = await prisma.$queryRaw<
    Array<{
      id: string;
      clause_type: ClauseType;
      text: string;
      embedding_text: string | null;
    }>
  >`
    SELECT id, clause_type, text, embedding::text as embedding_text 
    FROM "Clause" 
    WHERE contract_version_id = ${targetVersionId}
  `;

  const parseClauses = (
    clauses: typeof sourceClausesRaw,
  ): ClauseWithVector[] => {
    return clauses.map((c) => ({
      ...c,
      embedding: c.embedding_text ? JSON.parse(c.embedding_text) : null,
    }));
  };

  const sourceClauses = parseClauses(sourceClausesRaw);
  const targetClauses = parseClauses(targetClausesRaw);

  const results: DiffResult[] = [];

  const sourceGrouped = groupBy(sourceClauses, "clause_type");
  const targetGrouped = groupBy(targetClauses, "clause_type");

  const allTypes = new Set([
    ...Object.keys(sourceGrouped),
    ...Object.keys(targetGrouped),
  ]) as Set<ClauseType>;

  for (const type of Array.from(allTypes)) {
    const sClauses = sourceGrouped[type] || [];
    const tClauses = targetGrouped[type] || [];

    // Bipartite matching by highest similarity
    while (sClauses.length > 0 && tClauses.length > 0) {
      let bestSim = -1;
      let bestSIndex = -1;
      let bestTIndex = -1;

      for (let i = 0; i < sClauses.length; i++) {
        for (let j = 0; j < tClauses.length; j++) {
          const s = sClauses[i];
          const t = tClauses[j];
          if (s.embedding && t.embedding) {
            const sim = cosineSimilarity(s.embedding, t.embedding);
            if (sim > bestSim) {
              bestSim = sim;
              bestSIndex = i;
              bestTIndex = j;
            }
          } else {
            // fallback if no embedding? Should not happen in normal flow, but handle gracefully
            if (s.text === t.text && bestSim < 1) {
              bestSim = 1;
              bestSIndex = i;
              bestTIndex = j;
            }
          }
        }
      }

      if (bestSim >= 0.7) {
        // Match found
        const matchedS = sClauses[bestSIndex];
        const matchedT = tClauses[bestTIndex];

        if (matchedS.text === matchedT.text) {
          results.push({
            type: "unchanged",
            clauseType: type as ClauseType,
            sourceClauseId: matchedS.id,
            targetClauseId: matchedT.id,
            text: matchedS.text,
          });
        } else {
          results.push({
            type: "modified",
            clauseType: type as ClauseType,
            sourceClauseId: matchedS.id,
            targetClauseId: matchedT.id,
            diff: diffWords(matchedS.text, matchedT.text),
          });
        }

        sClauses.splice(bestSIndex, 1);
        tClauses.splice(bestTIndex, 1);
      } else {
        // No more matches above threshold for this type
        break;
      }
    }

    // Remaining are added/removed
    for (const s of sClauses) {
      results.push({
        type: "removed",
        clauseType: type as ClauseType,
        sourceClauseId: s.id,
        text: s.text,
      });
    }
    for (const t of tClauses) {
      results.push({
        type: "added",
        clauseType: type as ClauseType,
        targetClauseId: t.id,
        text: t.text,
      });
    }
  }

  // Generate AI Summary
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 1,
  });

  const structuredLlm = model.withStructuredOutput(LLMResponseSchema, {
    name: "generate_diff_summary",
  });

  // Filter out unchanged to minimize prompt size
  const changedResults = results.filter((r) => r.type !== "unchanged");

  let summaryText = "";
  if (changedResults.length === 0) {
    summaryText = "No changes between these versions.";
  } else {
    // Exclude full text/diff objects if they are too big?
    // Actually, passing diff objects makes it clear to LLM what was added/removed at a word level.
    const simplifiedChanges = changedResults.map((r) => {
      if (r.type === "modified") {
        return {
          type: r.type,
          clauseType: r.clauseType,
          modifications: r.diff?.map((d) =>
            d.added
              ? `ADDED: ${d.value}`
              : d.removed
                ? `REMOVED: ${d.value}`
                : `KEPT: ${d.value}`,
          ),
        };
      }
      return {
        type: r.type,
        clauseType: r.clauseType,
        text: r.text,
      };
    });

    const prompt = `Analyze the following changes between two contract versions. \n\nChanges:\n${JSON.stringify(simplifiedChanges, null, 2)}`;
    const systemPrompt =
      "You are an expert legal contract risk analyzer. Provide a one-paragraph summary of what changed and whether overall risk increased, decreased, or stayed the same, and why.";

    const llmResponse = await structuredLlm.invoke([
      ["system", systemPrompt],
      ["human", prompt],
    ]);
    summaryText = llmResponse.summary;
  }

  // Persist
  const newComparison = await prisma.versionComparison.create({
    data: {
      source_version_id: sourceVersionId,
      target_version_id: targetVersionId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff_json: results as any,
      ai_summary: summaryText,
    },
  });

  return newComparison;
}

function groupBy<T, K extends keyof T>(
  array: T[],
  key: K,
): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}
