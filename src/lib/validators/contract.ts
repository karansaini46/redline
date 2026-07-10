import { z } from "zod";

export const ContractStatusEnum = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
]);

export const CreateContractSchema = z.object({
  org_id: z.string().uuid("Invalid organization ID"), // Flag: This was probably intended to be derived from context, but we make it required.
  title: z.string().min(1, "Title is required"), // Flag: Made required.
  status: ContractStatusEnum.default("DRAFT"),
  due_date: z.coerce.date().optional(),
});

export const UpdateContractSchema = CreateContractSchema.partial();
