import { z } from "zod";

export const RiskSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const CreateRiskFlagSchema = z.object({
  clause_id: z.string().uuid("Invalid clause ID"),
  severity: RiskSeverityEnum,
  description: z.string().min(1, "Description is required"), // Flag: Made required.
});

export const UpdateRiskFlagSchema = z.object({
  severity: RiskSeverityEnum.optional(),
  description: z.string().min(1, "Description is required").optional(),
});
