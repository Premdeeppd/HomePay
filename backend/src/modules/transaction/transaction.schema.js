import { z } from "zod";

const objectIdSchema = z
  .string({ required_error: "User ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const sendMoneySchema = z.object({
  receiverId: objectIdSchema,
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .min(0.01, "Minimum amount is ₹0.01")
    .max(100000, "Maximum limit per transfer is ₹1,00,000"),
  description: z
    .string()
    .trim()
    .max(200, "Description must be at most 200 characters")
    .optional()
    .nullable(),
});
