import { ErrorCodes } from "./errorCodes.js";

/**
 * Custom error class for operational (expected) errors.
 *
 * "Operational" means the error is part of normal app flow
 * (bad user input, unauthenticated request, insufficient balance, etc.)
 * as opposed to programming bugs (TypeError, ReferenceError).
 *
 * The global errorHandler middleware knows how to serialize this
 * into a consistent JSON response.
 *
 * @example
 *   // Using a predefined error code (most common):
 *   throw ApiError.from(ErrorCodes.UNAUTHORIZED);
 *
 *   // Overriding the default message:
 *   throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
 *
 *   // For Zod validation failures (with field-level details):
 *   throw ApiError.validationError([
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Must be at least 8 characters" },
 *   ]);
 */
class ApiError extends Error {
  /**
   * @param {number}  statusCode - HTTP status code (e.g., 400, 401, 404)
   * @param {string}  code       - Machine-readable error code (e.g., "UNAUTHORIZED")
   * @param {string}  message    - Human-readable description
   * @param {Array}   errors     - Optional array of field-level errors (for validation)
   */
  constructor(statusCode, code, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.errors = errors;

    // Distinguishes expected errors from programming bugs.
    // The errorHandler checks this: operational → send structured JSON,
    // non-operational → log + generic 500.
    this.isOperational = true;

    // Removes the ApiError constructor itself from the stack trace,
    // so the trace starts at the line where ApiError was thrown.
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory: create an ApiError from a predefined ErrorCode object.
   *
   * @param {Object} errorCode    - An entry from ErrorCodes (e.g., ErrorCodes.UNAUTHORIZED)
   * @param {string} [customMessage] - Override the default message if needed
   * @returns {ApiError}
   */
  static from(errorCode, customMessage) {
    return new ApiError(
      errorCode.status,
      errorCode.code,
      customMessage || errorCode.message
    );
  }

  /**
   * Factory: create a validation error with field-level details.
   * Used by the validate middleware when Zod parsing fails.
   *
   * @param {Array<{field: string, message: string}>} errors
   * @returns {ApiError}
   */
  static validationError(errors) {
    return new ApiError(
      ErrorCodes.VALIDATION_ERROR.status,
      ErrorCodes.VALIDATION_ERROR.code,
      ErrorCodes.VALIDATION_ERROR.message,
      errors
    );
  }
}

export default ApiError;
