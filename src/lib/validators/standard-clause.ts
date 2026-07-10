import { z } from "zod";
import { ClauseTypeEnum } from "./clause";

export const CreateStandardClauseLibrarySchema = z.object({
  org_id: z.string().uuid("Invalid organization ID"),
  title: z.string().min(1, "Title is required"), // Flag: Made required.
  clause_type: ClauseTypeEnum,
  text: z.string().min(1, "Clause text is required"),
});

export const UpdateStandardClauseLibrarySchema =
  CreateStandardClauseLibrarySchema.partial().omit({
    org_id: true,
  });
