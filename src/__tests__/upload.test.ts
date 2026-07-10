import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadContractAction } from "../server/contracts/upload";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";

vi.mock("../lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user1" } }),
}));

vi.mock("../server/rbac", () => ({
  requireRole: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
  },
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
    contract: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    contractVersion: {
      aggregate: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("uploadContractAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormData = (
    fileData: number[],
    mimeType: string,
    fileName: string,
    contractId?: string,
  ) => {
    const formData = new FormData();
    formData.append("orgId", "org1");
    if (contractId) {
      formData.append("contractId", contractId);
    }
    const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    formData.append("file", file);
    return formData;
  };

  // Dummy valid PDF magic bytes
  const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x00];

  it("rejects files over 20MB", async () => {
    const formData = new FormData();
    formData.append("orgId", "org1");

    // Create a dummy file and manually override its size
    const file = new File([""], "test.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: 21 * 1024 * 1024 });
    formData.append("file", file);

    const result = await uploadContractAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/exceeds 20MB/i);
  });

  it("rejects invalid magic bytes for a PDF", async () => {
    const formData = createFormData(
      [0x00, 0x01, 0x02, 0x03, 0x04],
      "application/pdf",
      "test.pdf",
    );
    const result = await uploadContractAction({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid file signature/i);
  });

  it("rejects invalid MIME types", async () => {
    const formData = createFormData(pdfBytes, "image/png", "test.png");
    const result = await uploadContractAction({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid file type/i);
  });

  it("handles first upload (creates new contract and version 1)", async () => {
    const formData = createFormData(pdfBytes, "application/pdf", "test.pdf");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contract.create as any).mockResolvedValue({
      id: "contract1",
      org_id: "org1",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contractVersion.create as any).mockResolvedValue({
      id: "version1",
    });

    const result = await uploadContractAction({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(result.contractId).toBe("contract1");
    expect(result.versionId).toBe("version1");

    expect(prisma.contract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ org_id: "org1", title: "test" }),
      }),
    );

    expect(prisma.contractVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contract_id: "contract1",
          version_number: 1,
          processing_status: "PENDING",
          storage_path: "org1/contract1/v1.pdf",
        }),
      }),
    );
  });

  it("handles re-upload to existing contract (increments to version 2)", async () => {
    const formData = createFormData(
      pdfBytes,
      "application/pdf",
      "test.pdf",
      "contract1",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contract.findFirst as any).mockResolvedValue({
      id: "contract1",
      org_id: "org1",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contractVersion.aggregate as any).mockResolvedValue({
      _max: { version_number: 1 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.contractVersion.create as any).mockResolvedValue({
      id: "version2",
    });

    const result = await uploadContractAction({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(result.contractId).toBe("contract1");
    expect(result.versionId).toBe("version2");

    expect(prisma.contract.findFirst).toHaveBeenCalledWith({
      where: { id: "contract1", org_id: "org1" },
    });

    expect(prisma.contractVersion.aggregate).toHaveBeenCalledWith({
      where: { contract_id: "contract1" },
      _max: { version_number: true },
    });

    expect(prisma.contractVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contract_id: "contract1",
          version_number: 2,
          processing_status: "PENDING",
          storage_path: "org1/contract1/v2.pdf",
        }),
      }),
    );

    // Verify no overwrites (upsert: false)
    expect(supabase.storage.from).toHaveBeenCalledWith("contracts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockUpload = (supabase.storage.from as any)().upload;
    expect(mockUpload).toHaveBeenCalledWith(
      "org1/contract1/v2.pdf",
      expect.any(Buffer),
      expect.objectContaining({ upsert: false }),
    );
  });
});
