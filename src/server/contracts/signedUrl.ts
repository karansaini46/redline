"use server";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/server/rbac";

export async function getSignedUrlAction(
  storagePath: string,
  orgId: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Viewer role is enough to view the contract document
    await requireRole(orgId, userId, "VIEWER");

    if (!storagePath.startsWith(`${orgId}/`)) {
      return { success: false, error: "Invalid storage path or access denied" };
    }

    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(storagePath, 60 * 60); // 1 hour expiration

    if (error || !data) {
      console.error("Failed to generate signed URL:", error);
      return { success: false, error: "Failed to fetch document" };
    }

    return { success: true, url: data.signedUrl };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
