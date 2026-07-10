import { z } from "zod";

export const ClauseTypeEnum = z.enum([
  "CONFIDENTIALITY",
  "INDEMNIFICATION",
  "TERMINATION",
  "PAYMENT",
  "LIABILITY",
  "WARRANTY",
  "GOVERNING_LAW",
  "FORCE_MAJEURE",
  "OTHER",
]);

export const CreateClauseSchema = z
  .object({
    contract_version_id: z.string().uuid("Invalid contract version ID"),
    clause_type: ClauseTypeEnum.default("OTHER"),
    text: z.string().min(1, "Clause text is required"),
    page_number: z.number().int().positive().optional(),
    char_start: z.number().int().min(0, "Character start must be >= 0"),
    char_end: z.number().int().min(0, "Character end must be >= 0"),
    is_standard: z.boolean().default(false),
    // Note: embedding is omitted here because it's usually generated server-side.
  })
  .refine((data) => data.char_end > data.char_start, {
    message: "char_end must be greater than char_start",
    path: ["char_end"],
  });

export const UpdateClauseSchema = z.object({
  clause_type: ClauseTypeEnum.optional(),
  text: z.string().min(1, "Clause text is required").optional(),
  page_number: z.number().int().positive().optional(),
  char_start: z.number().int().min(0).optional(),
  char_end: z.number().int().min(0).optional(),
  is_standard: z.boolean().optional(),
});
