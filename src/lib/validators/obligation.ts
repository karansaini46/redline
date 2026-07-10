import { z } from "zod";

export const CreateObligationSchema = z.object({
  clause_id: z.string().uuid("Invalid clause ID"),
  description: z.string().min(1, "Description is required"), // Flag: Made required.
  recurring_rule: z.string().optional(),
  due_date: z.coerce.date().optional(),
});

export const UpdateObligationSchema = CreateObligationSchema.partial().omit({
  clause_id: true, // Typically wouldn't move an obligation to another clause
});
