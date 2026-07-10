import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
