import { z } from "zod";

const objectIdSchema = z
  .string({ required_error: "User ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const sendRequestSchema = z.object({
  receiverId: objectIdSchema,
  message: z
    .string()
    .trim()
    .max(200, "Message must be at most 200 characters")
    .optional()
    .nullable(),
});
