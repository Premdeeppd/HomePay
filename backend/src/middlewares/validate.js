import ApiError from "../errors/apiError.js";

/**
 * Zod validation middleware factory.
 *
 * Returns a middleware that validates req.body against a Zod schema.
 * If validation fails, it throws an ApiError with field-level details.
 * If validation passes, it replaces req.body with the parsed (cleaned) data.
 *
 * Why replace req.body?
 *   Zod's .parse() strips unknown fields and applies transforms
 *   (trim, toLowerCase, etc.). By replacing req.body, your controller
 *   receives only the fields you defined — no extra junk from the client.
 *
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware
 *
 * @example
 *   // In your route file:
 *   import { z } from "zod";
 *   import validate from "../../middlewares/validate.js";
 *
 *   const registerSchema = z.object({
 *     name:     z.string().min(2).max(50).trim(),
 *     email:    z.string().email().toLowerCase(),
 *     password: z.string().min(8),
 *   });
 *
 *   router.post("/register", validate(registerSchema), authController.register);
 *   // By the time authController.register runs, req.body is guaranteed to be:
 *   // { name: "Prem", email: "prem@gmail.com", password: "SecurePass1" }
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Format Zod's issues into a cleaner array:
    // [{ field: "email", message: "Invalid email" }, ...]
    const formattedErrors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    throw ApiError.validationError(formattedErrors);
  }

  // Replace raw body with parsed + cleaned data
  req.body = result.data;
  next();
};

export default validate;
