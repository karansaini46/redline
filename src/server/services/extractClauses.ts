import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ClauseType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ClauseSchema = z.object({
  clause_type: z.nativeEnum(ClauseType),
  text_excerpt: z.string().describe("The exact text of the clause extracted from the document. Do not truncate."),
  page_number: z.number().nullable().optional().describe("The page number if available, otherwise null."),
  char_start: z.number().describe("The start character index of the clause relative to the chunk provided."),
  char_end: z.number().describe("The end character index of the clause relative to the chunk provided."),
  confidence: z.number().min(0).max(1).describe("Confidence score of this extraction between 0 and 1.")
});

const ExtractionResponseSchema = z.object({
  clauses: z.array(ClauseSchema)
});

function calculateWordJaccard(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let intersection = 0;
  set1.forEach(w => {
    if (set2.has(w)) intersection++;
  });
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

async function extractFromChunkWithRetry(
  llm: ChatGoogleGenerativeAI, 
  chunk: string, 
  retry: boolean = false
): Promise<z.infer<typeof ClauseSchema>[]> {
  const structuredLlm = llm.withStructuredOutput(ExtractionResponseSchema, { name: "extract_clauses" });
  
  const systemPrompt = retry 
    ? "CRITICAL INSTRUCTION: You are a legal contract analyzer. You MUST return ONLY valid JSON matching the schema. DO NOT wrap in markdown like ```json. Do not include conversational text. The clause types must strictly match the enum. Your output will be parsed programmatically. Malformed JSON will cause a system failure."
    : "You are an expert legal contract analyzer. Extract the following clause types from the text below: termination, indemnification, liability_cap, confidentiality, ip_assignment, non_compete, payment_terms, governing_law, auto_renewal, force_majeure, other. Return ONLY valid JSON matching the schema.";
  
  try {
    const response = await structuredLlm.invoke([
      ["system", systemPrompt],
      ["human", `Analyze the following contract text chunk and extract the relevant clauses.\n\nText:\n${chunk}`]
    ]);
    return response.clauses || [];
  } catch (error) {
    if (!retry) {
      console.warn("Malformed JSON or output error from LLM, retrying with stricter prompt...", error);
      return extractFromChunkWithRetry(llm, chunk, true);
    }
    throw new Error(`LLM extraction failed after retry: ${(error as Error).message}`);
  }
}

export async function extractClauses(contractVersionId: string, text: string) {
  if (!text || text.trim().length === 0) {
    return;
  }

  // 1. Chunk long contracts (>8k tokens ~32k chars) with ~500 token (~2k char) overlap
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 30000, 
    chunkOverlap: 2000,
  });

  const chunks = await splitter.splitText(text);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 1, // Let Langchain do 1 network retry, but we handle the parsing retry manually
  });

  const allExtractedClauses: z.infer<typeof ClauseSchema>[] = [];
  let currentIndex = 0;

  for (const chunk of chunks) {
    // Determine where this chunk actually started in the global text
    const chunkGlobalStart = text.indexOf(chunk, Math.max(0, currentIndex - 5000));
    currentIndex = chunkGlobalStart > -1 ? chunkGlobalStart + chunk.length : currentIndex + chunk.length;
    const actualGlobalStart = chunkGlobalStart > -1 ? chunkGlobalStart : 0;

    const chunkClauses = await extractFromChunkWithRetry(model, chunk, false);
    
    // Adjust char_start and char_end to global offsets
    for (const clause of chunkClauses) {
      // Try to find the exact text excerpt in the global text for precise offsets, 
      // otherwise fallback to the chunk's global start + local offset
      let globalStart = -1;
      if (clause.text_excerpt) {
         globalStart = text.indexOf(clause.text_excerpt, Math.max(0, actualGlobalStart - 1000));
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
    const isDuplicate = deduplicatedClauses.some(existing => {
      if (existing.clause_type !== clause.clause_type) return false;
      const overlap = calculateWordJaccard(existing.text_excerpt, clause.text_excerpt);
      return overlap > 0.90;
    });

    if (!isDuplicate) {
      deduplicatedClauses.push(clause);
    }
  }

  // 3. Persist each extracted clause to DB
  if (deduplicatedClauses.length > 0) {
    const recordsToInsert = deduplicatedClauses.map(c => ({
      contract_version_id: contractVersionId,
      clause_type: c.clause_type,
      text: c.text_excerpt,
      page_number: c.page_number ?? null,
      char_start: c.char_start,
      char_end: c.char_end,
    }));

    await prisma.clause.createMany({
      data: recordsToInsert,
    });
  }
}
