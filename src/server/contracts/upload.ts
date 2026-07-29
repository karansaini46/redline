"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/server/rbac";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { extractTextQueue } from "@/server/queues/extractText.queue";
import { Prisma } from "@prisma/client";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export type UploadContractState = {
  success: boolean;
  error?: string;
  contractId?: string;
  versionId?: string;
};

export async function uploadContractAction(
  prevState: UploadContractState,
  formData: FormData,
): Promise<UploadContractState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const orgId = formData.get("orgId") as string;
  const contractId = formData.get("contractId") as string | null;
  const file = formData.get("file") as File | null;

  if (!orgId) {
    return { success: false, error: "Missing orgId" };
  }

  if (!file) {
    return { success: false, error: "No file uploaded" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File exceeds 20MB limit" };
  }

  const mimeType = file.type;
  const isValidMime =
    mimeType === "application/pdf" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isValidMime) {
    return {
      success: false,
      error: "Invalid file type. Only PDF and DOCX are allowed.",
    };
  }

  // Magic bytes check
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const isPDF = buffer
    .subarray(0, 5)
    .equals(Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])); // %PDF-
  const isDOCX = buffer
    .subarray(0, 4)
    .equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])); // PK\x03\x04

  if (!isPDF && !isDOCX) {
    return {
      success: false,
      error: "Invalid file signature. File may be corrupted or spoofed.",
    };
  }

  const extension = isPDF ? "pdf" : "docx";
  const fileName = file.name;

  try {
    // Authorize user for the organization
    await requireRole(orgId, userId, "MEMBER");

    // Process inside a transaction
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let resolvedContractId = contractId;
        let versionNumber = 1;

        if (resolvedContractId) {
          // Re-uploading to an existing contract
          const existingContract = await tx.contract.findFirst({
            where: { id: resolvedContractId, org_id: orgId },
          });

          if (!existingContract) {
            throw new Error("Contract not found");
          }

          const maxVersion = await tx.contractVersion.aggregate({
            where: { contract_id: resolvedContractId },
            _max: { version_number: true },
          });

          versionNumber = (maxVersion._max.version_number || 0) + 1;
        } else {
          // Creating a new contract
          const newContract = await tx.contract.create({
            data: {
              org_id: orgId,
              title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
              status: "DRAFT",
            },
          });
          resolvedContractId = newContract.id;

          await tx.auditLogEntry.create({
            data: {
              org_id: orgId,
              user_id: userId,
              action: "CONTRACT_CREATED",
              entity_type: "Contract",
              entity_id: resolvedContractId,
              details: { title: newContract.title },
            },
          });
        }

        const storagePath = `${orgId}/${resolvedContractId}/v${versionNumber}.${extension}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(storagePath, buffer, {
            contentType: isPDF
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            upsert: false, // Never overwrite
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          throw new Error("Failed to upload file to storage");
        }

        // Create new contract version
        const contractVersion = await tx.contractVersion.create({
          data: {
            contract_id: resolvedContractId,
            version_number: versionNumber,
            processing_status: "PENDING",
            storage_path: storagePath,
          },
        });

        await tx.auditLogEntry.create({
          data: {
            org_id: orgId,
            user_id: userId,
            action: "CONTRACT_VERSION_CREATED",
            entity_type: "ContractVersion",
            entity_id: contractVersion.id,
            details: { version_number: versionNumber },
          },
        });

        return {
          contractId: resolvedContractId,
          versionId: contractVersion.id,
        };
      },
    );

    if (extractTextQueue) {
      await extractTextQueue.add("extract-text", {
        contractVersionId: result.versionId,
        userId: userId,
      });
    }

    return {
      success: true,
      contractId: result.contractId,
      versionId: result.versionId,
    };
  } catch (err) {
    const error = err as Error;
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
