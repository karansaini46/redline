import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { z } from "zod";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ClauseType } from "@prisma/client";

const ObligationSchema = z.object({
  description: z
    .string()
    .describe(
      "Description of the obligation (e.g. renewal deadline, payment due date)",
    ),
  due_date: z
    .string()
    .nullable()
    .optional()
    .describe(
      "ISO 8601 date string if a specific date is mentioned or calculable",
    ),
  recurring_rule: z
    .string()
    .nullable()
    .optional()
    .describe("Small grammar rule (e.g. 'monthly', 'yearly') if applicable"),
});

const ClauseSchema = z.object({
  clause_type: z.enum([
    "CONFIDENTIALITY",
    "INDEMNIFICATION",
    "TERMINATION",
    "PAYMENT_TERMS",
    "LIABILITY_CAP",
    "WARRANTY",
    "GOVERNING_LAW",
    "FORCE_MAJEURE",
    "IP_ASSIGNMENT",
    "NON_COMPETE",
    "AUTO_RENEWAL",
    "OTHER"
  ]),
  text_excerpt: z
    .string()
    .describe(
      "The exact text of the clause extracted from the document. Do not truncate.",
    ),
  page_number: z
    .number()
    .nullable()
    .optional()
    .describe("The page number if available, otherwise null."),
  char_start: z
    .number()
    .describe(
      "The start character index of the clause relative to the chunk provided.",
    ),
  char_end: z
    .number()
    .describe(
      "The end character index of the clause relative to the chunk provided.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score of this extraction between 0 and 1."),
  obligations: z
    .array(ObligationSchema)
    .optional()
    .describe(
      "Any candidate obligations (renewals, payments, notice periods) identified in this clause",
    ),
});

const ExtractionResponseSchema = z.object({
  clauses: z.array(ClauseSchema),
});

function calculateWordJaccard(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const words1 = str1
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const words2 = str2
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let intersection = 0;
  set1.forEach((w) => {
    if (set2.has(w)) intersection++;
  });
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

async function extractFromChunkWithRetry(
  llm: ChatGoogleGenerativeAI,
  chunk: string,
  retry: boolean = false,
): Promise<z.infer<typeof ClauseSchema>[]> {
  const structuredLlm = llm.withStructuredOutput(ExtractionResponseSchema, {
    name: "extract_clauses",
  });

  const systemPrompt = retry
    ? "CRITICAL INSTRUCTION: You are a legal contract analyzer. You MUST return ONLY valid JSON matching the schema. DO NOT wrap in markdown like ```json. Do not include conversational text. The clause types must strictly match the enum. Your output will be parsed programmatically. Malformed JSON will cause a system failure."
    : "You are an expert legal contract analyzer. Extract the following clause types from the text below: termination, indemnification, liability_cap, confidentiality, ip_assignment, non_compete, payment_terms, governing_law, auto_renewal, force_majeure, other. Also extract any candidate obligations (renewal deadlines, payment due dates, termination notice windows) found within these clauses. Return ONLY valid JSON matching the schema.";

  try {
    const response = await structuredLlm.invoke([
      ["system", systemPrompt],
      [
        "human",
        `Analyze the following contract text chunk and extract the relevant clauses.\n\nText:\n${chunk}`,
      ],
    ]);
    return response.clauses || [];
  } catch (error) {
    if (!retry) {
      console.warn(
        "Malformed JSON or output error from LLM, retrying with stricter prompt...",
        error,
      );
      return extractFromChunkWithRetry(llm, chunk, true);
    }
    throw new Error(
      `LLM extraction failed after retry: ${(error as Error).message}`,
    );
  }
}

export async function extractClauses(contractVersionId: string, text: string) {
  if (!text || text.trim().length === 0) {
    return;
  }

  const version = await prisma.contractVersion.findUnique({
    where: { id: contractVersionId },
  });
  if (!version) return;
  const contractId = version.contract_id;

  // 1. Chunk long contracts (>8k tokens ~32k chars) with ~500 token (~2k char) overlap
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 30000,
    chunkOverlap: 2000,
  });

  const chunks = await splitter.splitText(text);

  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 1, // Let Langchain do 1 network retry, but we handle the parsing retry manually
  });

  const allExtractedClauses: z.infer<typeof ClauseSchema>[] = [];
  let currentIndex = 0;

  for (const chunk of chunks) {
    // Determine where this chunk actually started in the global text
    const chunkGlobalStart = text.indexOf(
      chunk,
      Math.max(0, currentIndex - 5000),
    );
    currentIndex =
      chunkGlobalStart > -1
        ? chunkGlobalStart + chunk.length
        : currentIndex + chunk.length;
    const actualGlobalStart = chunkGlobalStart > -1 ? chunkGlobalStart : 0;

    const chunkClauses = await extractFromChunkWithRetry(model, chunk, false);

    // Adjust char_start and char_end to global offsets
    for (const clause of chunkClauses) {
      // Try to find the exact text excerpt in the global text for precise offsets,
      // otherwise fallback to the chunk's global start + local offset
      let globalStart = -1;
      if (clause.text_excerpt) {
        globalStart = text.indexOf(
          clause.text_excerpt,
          Math.max(0, actualGlobalStart - 1000),
        );
      }

      if (globalStart > -1) {
        clause.char_start = globalStart;
        clause.char_end = globalStart + clause.text_excerpt.length;
      } else {
        clause.char_start = actualGlobalStart + clause.char_start;
        clause.char_end = actualGlobalStart + clause.char_end;
      }
      allExtractedClauses.push(clause);
    }
  }

  // 2. Merge and de-duplicate (same clause_type with >90% text overlap)
  const deduplicatedClauses: z.infer<typeof ClauseSchema>[] = [];

  for (const clause of allExtractedClauses) {
    const isDuplicate = deduplicatedClauses.some((existing) => {
      if (existing.clause_type !== clause.clause_type) return false;
      const overlap = calculateWordJaccard(
        existing.text_excerpt,
        clause.text_excerpt,
      );
      return overlap > 0.9;
    });

    if (!isDuplicate) {
      deduplicatedClauses.push(clause);
    }
  }

  // 3. Persist each extracted clause to DB
  if (deduplicatedClauses.length > 0) {
    // Generate embeddings in batch
    const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-embedding-001", // Default Gemini embedding model
    });

    const textsToEmbed = deduplicatedClauses.map((c) => c.text_excerpt);
    const embeddings = await embeddingsModel.embedDocuments(textsToEmbed);

    const recordsToInsert = deduplicatedClauses.map((c) => ({
      contract_version_id: contractVersionId,
      clause_type: c.clause_type,
      text: c.text_excerpt,
      page_number: c.page_number ?? null,
      char_start: c.char_start,
      char_end: c.char_end,
    }));

    // Prisma doesn't natively return created IDs from createMany in a way that maps easily if there are duplicates,
    // but here we can just create them and fetch, or create them one by one/in a transaction.
    // Or we can just use createMany and then query them back based on text and contract_version_id.
    // Since we need to update vectors by ID, it's safer to use $transaction.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (let i = 0; i < recordsToInsert.length; i++) {
        const record = recordsToInsert[i];
        const embedding = embeddings[i];

        // Insert without embedding first
        const created = await tx.clause.create({
          data: record,
        });

        // Then update the embedding column via raw SQL
        // Convert embedding array to Postgres vector string: '[0.1, 0.2, ...]'
        const vectorString = `[${embedding.join(",")}]`;
        await tx.$executeRaw`
          UPDATE "Clause" 
          SET embedding = ${vectorString}::vector 
          WHERE id = ${created.id}
        `;

        const clauseObligations = deduplicatedClauses[i].obligations;
        if (clauseObligations && clauseObligations.length > 0) {
          await tx.obligation.createMany({
            data: clauseObligations.map((o) => {
              const parsedDate = o.due_date ? new Date(o.due_date) : null;
              const safeDate =
                parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
              return {
                contract_id: contractId,
                clause_id: created.id,
                description: o.description,
                due_date: safeDate,
                recurring_rule: o.recurring_rule,
                status: "OPEN",
              };
            }),
          });
        }
      }
    });
  }
}
