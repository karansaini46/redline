import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextProcessor } from '../src/server/queues/extractText.worker';
import { PrismaClient, ProcessingStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mPrisma = {
    contractVersion: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    PrismaClient: class { constructor() { return mPrisma; } },
    ProcessingStatus: {
      PENDING: 'PENDING',
      EXTRACTING: 'EXTRACTING',
      EXTRACTED: 'EXTRACTED',
      FAILED: 'FAILED'
    }
  };
});

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const prisma = new PrismaClient();

describe('extractTextWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract text from a text-layer PDF', async () => {
    const buffer = fs.readFileSync(path.join(__dirname, 'fixtures/text_layer.pdf'));
    const job = {
      data: {
        contractVersionId: 'test-version-1',
        buffer
      }
    } as any;

    (prisma.contractVersion.findUnique as any).mockResolvedValue({
      id: 'test-version-1',
      storage_path: 'test.pdf'
    });

    await extractTextProcessor(job);

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-version-1' },
        data: expect.objectContaining({ processing_status: 'EXTRACTING' })
      })
    );

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-version-1' },
        data: expect.objectContaining({ 
          processing_status: 'EXTRACTED',
          content_text: expect.stringContaining('Lots of text here')
        })
      })
    );
  });

  it('should fallback to OCR for a scanned PDF (simulated)', async () => {
    const buffer = fs.readFileSync(path.join(__dirname, 'fixtures/scanned.pdf'));
    const job = {
      data: {
        contractVersionId: 'test-version-2',
        buffer
      }
    } as any;

    (prisma.contractVersion.findUnique as any).mockResolvedValue({
      id: 'test-version-2',
      storage_path: 'scanned.pdf'
    });

    await extractTextProcessor(job);

    expect(prisma.contractVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-version-2' },
        data: expect.objectContaining({ 
          processing_status: 'EXTRACTED',
          content_text: expect.stringContaining('Extracted text from OCR API')
        })
      })
    );
  });
});
