import { z } from "zod";

export const CreateCommentSchema = z.object({
  clause_id: z.string().uuid("Invalid clause ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment content cannot be empty"),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
});
