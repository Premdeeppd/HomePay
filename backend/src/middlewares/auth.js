import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../errors/apiError.js";
import { ErrorCodes } from "../errors/errorCodes.js";

/**
 * Authentication middleware.
 *
 * Verifies the JWT access token from the Authorization header.
 * If valid, attaches the decoded payload to req.user and calls next().
 * If missing/invalid/expired, throws an appropriate ApiError.
 *
 * Token flow:
 *   1. Frontend stores access token in memory (Zustand store)
 *   2. Axios interceptor attaches it: `Authorization: Bearer <token>`
 *   3. This middleware extracts and verifies it
 *   4. If expired, frontend uses refresh token (httpOnly cookie) to get a new one
 *
 * Note: This middleware only handles ACCESS tokens.
 * Refresh token logic lives in the auth service.
 *
 * @example
 *   // Protect a route:
 *   router.get("/profile", auth, userController.getProfile);
 *
 *   // In the controller, access the authenticated user:
 *   const userId = req.user.userId;
 */
const auth = (req, res, next) => {
  // 1. Extract the token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.from(ErrorCodes.UNAUTHORIZED, "No token provided");
  }

  // "Bearer eyJhbGciOiJI..." → "eyJhbGciOiJI..."
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.from(ErrorCodes.UNAUTHORIZED, "No token provided");
  }

  // 2. Verify the token
  // jwt.verify is synchronous — it either returns the decoded payload
  // or throws an error (JsonWebTokenError or TokenExpiredError).
  // Express 5 catches synchronous throws automatically.
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // 3. Attach decoded payload to request
    // The payload was set during token creation (in jwt.js util):
    // { userId: "...", email: "..." }
    req.user = decoded;

    next();
  } catch (error) {
    // Differentiate between expired and malformed tokens.
    // The frontend uses this distinction: TOKEN_EXPIRED triggers
    // a refresh attempt, INVALID_TOKEN triggers a full logout.
    if (error.name === "TokenExpiredError") {
      throw ApiError.from(ErrorCodes.TOKEN_EXPIRED);
    }
    throw ApiError.from(ErrorCodes.INVALID_TOKEN);
  }
};

export default auth;
