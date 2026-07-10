import { z } from "zod";

export const CreateContractVersionSchema = z.object({
  contract_id: z.string().uuid("Invalid contract ID"),
  version_number: z
    .number()
    .int()
    .positive("Version must be a positive integer"),
  content_text: z.string().min(1, "Content text is required"),
});

// version_number generally shouldn't be updated after creation
export const UpdateContractVersionSchema = z.object({
  content_text: z.string().min(1, "Content text is required").optional(),
});
