/**
 * Centralized error code registry.
 *
 * Each entry is a plain object with:
 *   status  – HTTP status code to send in the response
 *   code    – machine-readable string the frontend can switch on
 *   message – human-readable default message (can be overridden at throw-time)
 *
 * Usage:
 *   throw ApiError.from(ErrorCodes.UNAUTHORIZED);
 *   throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
 */

export const ErrorCodes = {
  // ── Generic ──────────────────────────────────────────────
  VALIDATION_ERROR: {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
  },
  BAD_REQUEST: {
    status: 400,
    code: "BAD_REQUEST",
    message: "Bad request",
  },
  UNAUTHORIZED: {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Authentication required",
  },
  FORBIDDEN: {
    status: 403,
    code: "FORBIDDEN",
    message: "Access denied",
  },
  NOT_FOUND: {
    status: 404,
    code: "NOT_FOUND",
    message: "Resource not found",
  },
  CONFLICT: {
    status: 409,
    code: "CONFLICT",
    message: "Resource already exists",
  },
  INTERNAL_ERROR: {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  },

  // ── Auth ─────────────────────────────────────────────────
  INVALID_CREDENTIALS: {
    status: 401,
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password",
  },
  TOKEN_EXPIRED: {
    status: 401,
    code: "TOKEN_EXPIRED",
    message: "Token has expired",
  },
  INVALID_TOKEN: {
    status: 401,
    code: "INVALID_TOKEN",
    message: "Invalid or malformed token",
  },
  SESSION_REVOKED: {
    status: 401,
    code: "SESSION_REVOKED",
    message: "Session has been revoked",
  },
  EMAIL_ALREADY_EXISTS: {
    status: 409,
    code: "EMAIL_ALREADY_EXISTS",
    message: "Email is already registered",
  },

  // ── Friend ───────────────────────────────────────────────
  SELF_FRIEND_REQUEST: {
    status: 400,
    code: "SELF_FRIEND_REQUEST",
    message: "Cannot send friend request to yourself",
  },
  DUPLICATE_REQUEST: {
    status: 409,
    code: "DUPLICATE_REQUEST",
    message: "Friend request already exists",
  },
  ALREADY_FRIENDS: {
    status: 409,
    code: "ALREADY_FRIENDS",
    message: "You are already friends",
  },
  NOT_FRIENDS: {
    status: 403,
    code: "NOT_FRIENDS",
    message: "You must be friends to perform this action",
  },

  // ── Transaction ──────────────────────────────────────────
  INSUFFICIENT_BALANCE: {
    status: 400,
    code: "INSUFFICIENT_BALANCE",
    message: "Insufficient balance",
  },
  INVALID_AMOUNT: {
    status: 400,
    code: "INVALID_AMOUNT",
    message: "Amount must be greater than 0",
  },
  SELF_TRANSFER: {
    status: 400,
    code: "SELF_TRANSFER",
    message: "Cannot send money to yourself",
  },

  // ── Wallet ───────────────────────────────────────────────
  NOT_WALLET_OWNER: {
    status: 403,
    code: "NOT_WALLET_OWNER",
    message: "Only the wallet owner can perform this action",
  },
  NOT_WALLET_MEMBER: {
    status: 403,
    code: "NOT_WALLET_MEMBER",
    message: "You are not a member of this wallet",
  },
  ALREADY_WALLET_MEMBER: {
    status: 409,
    code: "ALREADY_WALLET_MEMBER",
    message: "User is already a wallet member",
  },
};
