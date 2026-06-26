import env from "../../config/env.js";
import ApiResponse from "../../responses/apiResponse.js";
import User from "../../models/User.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import * as authService from "./auth.service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax", // none for cross-site cookie in prod (if hosted on separate domains)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
};

/**
 * Auth Controller
 *
 * Controllers handle Express req/res logic:
 *   1. Extract input parameters (from req.body, req.headers, req.ip, etc.)
 *   2. Call the service layer to perform business logic
 *   3. Set cookies (e.g., httpOnly refresh token)
 *   4. Return standardized JSON responses using ApiResponse
 */

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  const userAgent = req.headers["user-agent"] || "Unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

  const { user, accessToken, refreshToken } = await authService.register({
    name,
    email,
    password,
    phone,
    userAgent,
    ipAddress,
  });

  // Set the refresh token as a secure, httpOnly cookie
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  return res
    .status(201)
    .json(new ApiResponse(201, "Registration successful", { user, accessToken }));
}

export async function login(req, res) {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"] || "Unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
    userAgent,
    ipAddress,
  });

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  return res
    .status(200)
    .json(new ApiResponse(200, "Login successful", { user, accessToken }));
}

export async function refresh(req, res) {
  // Read refresh token from httpOnly cookie
  const { refreshToken } = req.cookies;
  const userAgent = req.headers["user-agent"] || "Unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

  try {
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(
      refreshToken,
      userAgent,
      ipAddress
    );

    // Set the rotated refresh token cookie
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    return res
      .status(200)
      .json(new ApiResponse(200, "Token refreshed successfully", { accessToken }));
  } catch (error) {
    // If refresh fails, clear client's cookie to prevent infinite retry loops
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    throw error;
  }
}

export async function logout(req, res) {
  const { refreshToken } = req.cookies;

  await authService.logout(refreshToken);

  // Clear cookie from browser
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);

  return res
    .status(200)
    .json(new ApiResponse(200, "Logout successful"));
}

export async function logoutAll(req, res) {
  const userId = req.user.userId;

  await authService.logoutAll(userId);

  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);

  return res
    .status(200)
    .json(new ApiResponse(200, "Logged out from all devices"));
}

export async function me(req, res) {
  // req.user is set by the auth middleware and contains { userId, email }
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Current user profile retrieved", { user }));
}

export async function sessions(req, res) {
  const userId = req.user.userId;
  const activeSessions = await authService.getSessions(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Active sessions retrieved", { sessions: activeSessions }));
}
