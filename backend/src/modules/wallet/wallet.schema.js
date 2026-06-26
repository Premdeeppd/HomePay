import { z } from "zod";

const objectIdSchema = z
  .string({ required_error: "ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createWalletSchema = z.object({
  name: z
    .string({ required_error: "Wallet name is required" })
    .trim()
    .min(2, "Wallet name must be at least 2 characters")
    .max(50, "Wallet name must be at most 50 characters"),
  
  description: z
    .string()
    .trim()
    .max(200, "Description must be at most 200 characters")
    .optional()
    .nullable(),
});

export const addMemberSchema = z.object({
  userId: objectIdSchema,
});

export const depositFundsSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .min(0.01, "Minimum deposit is ₹0.01")
    .max(100000, "Maximum deposit limit is ₹1,00,000"),
});

export const spendFundsSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .min(0.01, "Minimum spend is ₹0.01")
    .max(100000, "Maximum spend limit is ₹1,00,000"),
  
  receiverId: objectIdSchema.optional().nullable(),
  
  description: z
    .string({ required_error: "Description is required for merchant spending" })
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(200, "Description must be at most 200 characters"),
});
