import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * JWT utility functions.
 *
 * Token strategy:
 *   Access Token  → short-lived (15m), sent in response body,
 *                   stored in-memory (Zustand) on frontend.
 *   Refresh Token → long-lived (7d), sent as httpOnly cookie,
 *                   JavaScript can't access it (XSS-safe).
 *
 * Both tokens use the same JWT_SECRET for signing. In a more
 * advanced setup, you'd use separate secrets for each token type.
 *
 * The payload should be minimal — just enough to identify the user:
 *   { userId: "...", email: "..." }
 *
 * Never put sensitive data (password, balance) in the token payload —
 * JWTs are base64-encoded (not encrypted), anyone can decode and read them.
 */

/**
 * Generate a short-lived access token.
 *
 * @param {Object} payload - Data to encode (e.g., { userId, email })
 * @returns {string} Signed JWT string
 *
 * @example
 *   const token = generateAccessToken({ userId: user._id, email: user.email });
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE || "15m",
  });
}

/**
 * Generate a long-lived refresh token.
 *
 * @param {Object} payload - Data to encode (e.g., { userId })
 * @returns {string} Signed JWT string
 *
 * @example
 *   const refreshToken = generateRefreshToken({ userId: user._id });
 *   // Store hashed version in the sessions collection
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRE || "7d",
  });
}

/**
 * Verify and decode a token.
 *
 * @param {string} token - The JWT string to verify
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError} If token is malformed
 * @throws {TokenExpiredError} If token has expired
 *
 * @example
 *   try {
 *     const decoded = verifyToken(token);
 *     console.log(decoded.userId);
 *   } catch (err) {
 *     // Handle error
 *   }
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
