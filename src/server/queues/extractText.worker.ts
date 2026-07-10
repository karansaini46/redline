import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { PrismaClient, ProcessingStatus } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth");
import { extractClauses } from "../services/extractClauses";
// import { createClient } from '@supabase/supabase-js'; // We would use this to fetch from storage

const prisma = new PrismaClient();
const redisUrl = process.env.UPSTASH_REDIS_URL;
const connection = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractTextProcessor = async (
  job: Job<{ contractVersionId: string; buffer?: any }>,
) => {
  const { contractVersionId } = job.data;

  // 1. Fetch ContractVersion
  const version = await prisma.contractVersion.findUnique({
    where: { id: contractVersionId },
  });

  if (!version) {
    throw new Error(`ContractVersion ${contractVersionId} not found`);
  }

  try {
    // 2. Mark as EXTRACTING
    await prisma.contractVersion.update({
      where: { id: contractVersionId },
      data: { processing_status: ProcessingStatus.EXTRACTING },
    });

    // 3. Fetch file from storage (Simulated for this implementation or fetching locally if we had access)
    // Real implementation would use:
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    // const { data, error } = await supabase.storage.from('contracts').download(version.storage_path!);
    // const buffer = Buffer.from(await data.arrayBuffer());

    // Since we don't have a real uploaded file buffer here, we simulate parsing a buffer.
    // In the tests, we pass `job.data.buffer` directly to avoid supabase calls.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = (job.data as any).buffer
      ? Buffer.from((job.data as any).buffer)
      : Buffer.from("");
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
    await prisma.contractVersion.update({
      where: { id: contractVersionId },
      data: {
        processing_status: ProcessingStatus.EXTRACTED,
        content_text: extractedText,
      },
    });

    // 5. Extract clauses from text using LangChain + Gemini
    await extractClauses(contractVersionId, extractedText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error processing ContractVersion ${contractVersionId}:`,
      errorMessage,
    );

    // Update as FAILED and store the error
    await prisma.contractVersion.update({
      where: { id: contractVersionId },
      data: {
        processing_status: ProcessingStatus.FAILED,
        error_message: errorMessage,
      },
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
