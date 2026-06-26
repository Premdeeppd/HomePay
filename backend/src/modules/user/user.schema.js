import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .optional(),
  
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .nullable(),
  
  avatar: z
    .string()
    .trim()
    .url("Invalid avatar URL format")
    .optional(),
});

export const addFundsSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(100000, "Cannot add more than ₹1,00,000 in a single transaction"),
  
  description: z
    .string()
    .trim()
    .max(100, "Description is too long")
    .default("Added funds (Simulation)"),
});
