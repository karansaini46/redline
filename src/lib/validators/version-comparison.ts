import { z } from "zod";

export const CreateVersionComparisonSchema = z.object({
  source_version_id: z.string().uuid("Invalid source version ID"),
  target_version_id: z.string().uuid("Invalid target version ID"),
  diff_summary: z.string().min(1, "Diff summary is required"), // Flag: Made required.
});

export const UpdateVersionComparisonSchema = z.object({
  diff_summary: z.string().min(1, "Diff summary is required").optional(),
});
