import ApiError from "../errors/apiError.js";
import { ErrorCodes } from "../errors/errorCodes.js";
import env from "../config/env.js";

/**
 * Global error-handling middleware.
 *
 * Express recognizes this as an error handler because it has 4 parameters
 * (err, req, res, next). It MUST be mounted AFTER all routes in app.js.
 *
 * How errors reach here:
 *   1. You throw an ApiError in a controller/service → Express 5 catches it automatically
 *   2. Mongoose throws a ValidationError or CastError → caught here
 *   3. Zod throws a ZodError (if not caught by validate middleware) → caught here
 *   4. JWT throws JsonWebTokenError/TokenExpiredError → caught here
 *   5. Any unhandled error → caught as 500
 *
 * Express 5 improvement: Async errors are auto-forwarded here.
 * In Express 4, you needed try/catch or asyncHandler() — not anymore.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ── 1. ApiError (your custom operational errors) ──────────
  // This is the most common case. Your services throw these.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: {
        code: err.code,
        ...(err.errors.length > 0 && { errors: err.errors }),
      },
    });
  }

  // ── 2. Zod validation error ───────────────────────────────
  // If a Zod error somehow bypasses the validate middleware
  // (e.g., manual schema.parse() in a service), catch it here.
  if (err.name === "ZodError") {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: ErrorCodes.VALIDATION_ERROR.message,
      error: {
        code: ErrorCodes.VALIDATION_ERROR.code,
        errors: formattedErrors,
      },
    });
  }

  // ── 3. Mongoose validation error ──────────────────────────
  // Thrown when a document fails schema-level validation
  // (e.g., required field missing, enum mismatch).
  if (err.name === "ValidationError" && err.errors) {
    const formattedErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      error: {
        code: ErrorCodes.VALIDATION_ERROR.code,
        errors: formattedErrors,
      },
    });
  }

  // ── 4. Mongoose CastError (bad ObjectId) ──────────────────
  // Thrown when you pass "abc123" where a valid ObjectId is expected.
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Invalid ${err.path}: ${err.value}`,
      error: {
        code: ErrorCodes.BAD_REQUEST.code,
      },
    });
  }

  // ── 5. Mongoose duplicate key error (code 11000) ──────────
  // Thrown when a unique index is violated
  // (e.g., registering with an email that already exists).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `${field} already exists`,
      error: {
        code: ErrorCodes.CONFLICT.code,
      },
    });
  }

  // ── 6. JWT errors ─────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: ErrorCodes.INVALID_TOKEN.message,
      error: {
        code: ErrorCodes.INVALID_TOKEN.code,
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: ErrorCodes.TOKEN_EXPIRED.message,
      error: {
        code: ErrorCodes.TOKEN_EXPIRED.code,
      },
    });
  }

  // ── 7. Unhandled / unexpected errors → 500 ────────────────
  // These are programming bugs — log them fully for debugging.
  // In production, don't leak error details to the client.
  console.error("Unhandled Error:", err);

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message:
      env.NODE_ENV === "development"
        ? err.message
        : ErrorCodes.INTERNAL_ERROR.message,
    error: {
      code: ErrorCodes.INTERNAL_ERROR.code,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

export default errorHandler;
