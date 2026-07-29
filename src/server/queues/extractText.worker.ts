/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { ProcessingStatus } from "@prisma/client";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { extractClauses } from "../services/extractClauses";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "../../lib/prisma";
const redisUrl = process.env.UPSTASH_REDIS_URL;
const isRemoteRedis =
  redisUrl &&
  !redisUrl.includes("127.0.0.1") &&
  !redisUrl.includes("localhost");
const connection = isRemoteRedis
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractTextProcessor = async (
  job: Job<{ contractVersionId: string; userId?: string; buffer?: any }>,
) => {
  const { contractVersionId, userId } = job.data;

  // 1. Fetch ContractVersion
  const version = await prisma.contractVersion.findUnique({
    where: { id: contractVersionId },
    include: { contract: true },
  });

  if (!version) {
    throw new Error(`ContractVersion ${contractVersionId} not found`);
  }

  try {
    // 2. Mark as EXTRACTING
    await prisma.$transaction(async (tx) => {
      await tx.contractVersion.update({
        where: { id: contractVersionId },
        data: { processing_status: ProcessingStatus.EXTRACTING },
      });
      if (userId) {
        await tx.auditLogEntry.create({
          data: {
            org_id: version.contract.org_id,
            user_id: userId,
            action: "PROCESSING_STATUS_CHANGED",
            entity_type: "ContractVersion",
            entity_id: contractVersionId,
            details: { status: ProcessingStatus.EXTRACTING },
          },
        });
      }
    });

    // 3. Fetch file from storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(version.storage_path!);

    if (downloadError || !data) {
      throw new Error(
        `Failed to download file from storage: ${downloadError?.message}`,
      );
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const isDocx = version.storage_path?.endsWith(".docx");
    let extractedText = "";

    if (isDocx) {
      // DOCX Parsing
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      // PDF Parsing (Assuming PDF if not DOCX)
      const data = await pdfParse(buffer);
      extractedText = data.text;

      // Calculate average characters per page
      const charsPerPage = extractedText.length / data.numpages;

      // If characters per page is very low, treat as scanned PDF and use OCR
      if (charsPerPage < 50) {
        console.log(
          `Detected scanned PDF for version ${contractVersionId} (${charsPerPage} chars/page). Falling back to OCR...`,
        );

        /*
         * Hosted OCR API Justification:
         * Installing and running local OCR dependencies (like tesseract, ghostscript, pdf2image/canvas)
         * on a Node.js server/serverless environment often fails due to native system dependencies
         * (e.g., Cairo, Pango, leptonica) missing in typical Vercel/Docker node images.
         * Furthermore, running local OCR on large PDFs is extremely slow and memory intensive,
         * which can exceed serverless function limits.
         * Therefore, a dedicated hosted OCR API is faster, more scalable, and significantly more reliable.
         */

        // Simulating a call to a hosted OCR API
        const ocrText = await callHostedOcrApi(buffer);
        extractedText = ocrText;
      }
    }

    // 4. Update as EXTRACTED
    await prisma.$transaction(async (tx) => {
      await tx.contractVersion.update({
        where: { id: contractVersionId },
        data: {
          processing_status: ProcessingStatus.EXTRACTED,
          content_text: extractedText,
        },
      });
      if (userId) {
        await tx.auditLogEntry.create({
          data: {
            org_id: version.contract.org_id,
            user_id: userId,
            action: "PROCESSING_STATUS_CHANGED",
            entity_type: "ContractVersion",
            entity_id: contractVersionId,
            details: { status: ProcessingStatus.EXTRACTED },
          },
        });
      }
    });

    // 5. Extract clauses from text using LangChain + Gemini
    await extractClauses(contractVersionId, extractedText, userId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error processing ContractVersion ${contractVersionId}:`,
      errorMessage,
    );

    // Update as FAILED and store the error
    await prisma.$transaction(async (tx) => {
      await tx.contractVersion.update({
        where: { id: contractVersionId },
        data: {
          processing_status: ProcessingStatus.FAILED,
          error_message: errorMessage,
        },
      });
      if (userId) {
        await tx.auditLogEntry.create({
          data: {
            org_id: version.contract.org_id,
            user_id: userId,
            action: "PROCESSING_STATUS_CHANGED",
            entity_type: "ContractVersion",
            entity_id: contractVersionId,
            details: { status: ProcessingStatus.FAILED, error: errorMessage },
          },
        });
      }
    });

    throw error; // Let BullMQ handle retries
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractTextWorker = connection
  ? new Worker("extract-text", extractTextProcessor, {
      connection: connection as any,
    })
  : null;

/**
 * Simulates a hosted OCR API call
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callHostedOcrApi(buffer: Buffer): Promise<string> {
  // In a real app:
  // const res = await fetch('https://api.ocr.space/parse/image', { ... })
  return new Promise((resolve) =>
    setTimeout(() => resolve("Extracted text from OCR API"), 500),
  );
}
