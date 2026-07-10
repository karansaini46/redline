import { z } from "zod";

export const RoleEnum = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const CreateMembershipSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  org_id: z.string().uuid("Invalid organization ID"),
  role: RoleEnum.default("VIEWER"),
});

export const UpdateMembershipSchema = z.object({
  role: RoleEnum,
});
