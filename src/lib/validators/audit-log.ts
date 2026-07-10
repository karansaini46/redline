import { z } from "zod";

export const CreateAuditLogEntrySchema = z.object({
  org_id: z.string().uuid("Invalid organization ID"),
  user_id: z.string().uuid("Invalid user ID"),
  action: z.string().min(1, "Action is required"),
  entity_type: z.string().min(1, "Entity type is required"),
  entity_id: z.string().min(1, "Entity ID is required"),
  details: z.any().optional(), // Can be JSON
});

// Audit logs are typically append-only and should not be updated
export const UpdateAuditLogEntrySchema = z.never();
