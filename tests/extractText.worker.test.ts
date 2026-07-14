import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractTextProcessor } from "../src/server/queues/extractText.worker";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

vi.mock("../src/lib/prisma", () => {
  const mPrisma = {
    contractVersion: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb(mPrisma)),
  };
  return { prisma: mPrisma };
});

vi.mock("@prisma/client", () => {
  return {
    ProcessingStatus: {
      PENDING: "PENDING",
      EXTRACTING: "EXTRACTING",
      EXTRACTED: "EXTRACTED",
      FAILED: "FAILED",
    },
  };
});

vi.mock("mammoth", () => ({
  extractRawText: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn(async () => {
    return {
      text: "Lots of text here that is sufficiently long to avoid the OCR fallback. We need more than 50 characters per page.",
      numpages: 1,
    };
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(async (pathName) => {
          try {
            // Read the actual file from the test fixtures
            // path in the test is just 'test.pdf' or 'scanned.pdf'
            const filePath = path.join(__dirname, "fixtures", pathName);
            const buffer = fs.readFileSync(filePath);
            const arrayBuffer = buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength,
            );
            return { data: { arrayBuffer: () => arrayBuffer }, error: null };
          } catch (e) {
            return { data: null, error: e };
          }
        }),
      })),
    },
  })),
}));

import { prisma } from "../src/lib/prisma";

describe("extractTextWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract text from a text-layer PDF", async () => {
    const buffer = fs.readFileSync(
      path.join(__dirname, "fixtures/text_layer.pdf"),
    );
    const job = {
      data: {
        contractVersionId: "test-version-1",
        buffer,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contractVersion.findUnique as any).mockResolvedValue({
      id: "test-version-1",
      storage_path: "text_layer.pdf",
    });

    await extractTextProcessor(job);

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "test-version-1" },
        data: expect.objectContaining({ processing_status: "EXTRACTING" }),
      }),
    );

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "test-version-1" },
        data: expect.objectContaining({
          processing_status: "EXTRACTED",
          content_text: expect.stringContaining("Lots of text here"),
        }),
      }),
    );
  });

  it("should fallback to OCR for a scanned PDF (simulated)", async () => {
    // Override the mock to return short text to trigger OCR
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pdfParse).mockImplementationOnce(
      async () => ({ text: "short", numpages: 1 }) as any,
    );

    const buffer = fs.readFileSync(
      path.join(__dirname, "fixtures/scanned.pdf"),
    );
    const job = {
      data: {
        contractVersionId: "test-version-2",
        buffer,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contractVersion.findUnique as any).mockResolvedValue({
      id: "test-version-2",
      storage_path: "scanned.pdf",
    });

    await extractTextProcessor(job);

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "test-version-2" },
        data: expect.objectContaining({
          processing_status: "EXTRACTED",
          content_text: expect.stringContaining("Extracted text from OCR API"),
        }),
      }),
    );
  });
});
