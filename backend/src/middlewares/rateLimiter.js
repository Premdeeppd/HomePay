import rateLimit from "express-rate-limit";
import ApiError from "../errors/apiError.js";
import { ErrorCodes } from "../errors/errorCodes.js";
import env from "../config/env.js";

/**
 * Rate Limiting Middlewares
 *
 * Protects auth endpoints against brute-force and Denial of Service (DoS) attacks.
 * Uses express-rate-limit to track requests by client IP.
 *
 * When limits are exceeded, the custom handler throws an ApiError, which is
 * caught by the global errorHandler and returned as a standardized JSON response.
 */

const limitHandler = (req, res, next, options) => {
  // express-rate-limit supports custom handlers. Since Express 5 catches
  // synchronous throws in middleware, throwing here automatically forwards
  // the structured error to our global error handler.
  next(
    ApiError.from(
      ErrorCodes.TOO_MANY_REQUESTS,
      options.message || "Too many requests, please try again later"
    )
  );
};

// Limit logins to 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // max requests per window
  message: "Too many login attempts from this IP. Please try again after 15 minutes.",
  handler: limitHandler,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable deprecated `X-RateLimit-*` headers
  skip: () => env.NODE_ENV === "development",
});

// Limit registrations to 3 accounts per hour per IP (prevent bot spam)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: "Too many accounts created from this IP. Please try again after an hour.",
  handler: limitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "development",
});

// Limit refresh requests to 10 per 15 minutes (prevent token spamming)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: "Too many token refresh attempts. Please try again after 15 minutes.",
  handler: limitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "development",
});
