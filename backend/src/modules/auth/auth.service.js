import crypto from "crypto";
import User from "../../models/User.model.js";
import Session from "../../models/Session.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../utils/jwt.js";

/**
 * Helper function to create a SHA-256 hash of a token.
 *
 * Why SHA-256?
 *   We store refresh tokens hashed in the database so that if the database is
 *   compromised, an attacker cannot steal the active sessions. SHA-256 is fast,
 *   one-way, and secure for hashing random strings like tokens.
 *
 * @param {string} token - The raw refresh token
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Register a new user and start a session.
 *
 * @param {Object} userData - Registration fields
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - Plaintext password
 * @param {string} [userData.phone] - User's phone number
 * @param {string} userAgent - Client user-agent string
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 */
export async function register({ name, email, password, phone, userAgent, ipAddress }) {
  // 1. Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.from(ErrorCodes.EMAIL_ALREADY_EXISTS);
  }

  // 2. If phone is provided, check if it's already registered
  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw ApiError.from(ErrorCodes.CONFLICT, "Phone number is already registered");
    }
  }

  // 3. Create the user
  // Password hashing happens automatically in User.model.js pre-save hook
  const user = await User.create({
    name,
    email,
    password,
    phone,
    balance: 1000, // Starting balance of ₹1,000 for learning/simulation convenience
  });

  // Exclude password from the returned user object
  const userResponse = user.toObject();
  delete userResponse.password;

  // 4. Generate token pair
  const accessToken = generateAccessToken({ userId: user._id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // 5. Store the hashed refresh token in the session collection
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days matching JWT lifetime

  await Session.create({
    user: user._id,
    refreshToken: hashedRefreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
}

/**
 * Verify credentials and start a session.
 *
 * @param {Object} credentials - Email and password
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - Plaintext password
 * @param {string} userAgent - Client user-agent string
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 */
export async function login({ email, password, userAgent, ipAddress }) {
  // 1. Find user and explicitly select the password field
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.from(ErrorCodes.INVALID_CREDENTIALS);
  }

  // 2. Compare passwords using model instance method
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.from(ErrorCodes.INVALID_CREDENTIALS);
  }

  // 3. Generate token pair
  const accessToken = generateAccessToken({ userId: user._id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // 4. Store hashed refresh token in session
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Session.create({
    user: user._id,
    refreshToken: hashedRefreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
}

/**
 * Rotate the refresh token and session.
 *
 * Token rotation is a security mechanism where the refresh token is replaced
 * with a new one every time it's used. If an attacker steals a refresh token,
 * it becomes invalid as soon as the real user (or the attacker) uses it,
 * immediately invalidating all other tokens in the family.
 *
 * @param {string} refreshToken - Raw refresh token from cookie
 * @param {string} userAgent - Client user-agent string
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export async function refresh(refreshToken, userAgent, ipAddress) {
  if (!refreshToken) {
    throw ApiError.from(ErrorCodes.UNAUTHORIZED, "Refresh token required");
  }

  // 1. Decode token to find the user
  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.from(ErrorCodes.TOKEN_EXPIRED, "Session expired, please login again");
    }
    throw ApiError.from(ErrorCodes.INVALID_TOKEN, "Invalid session token");
  }

  // 2. Hash token to search database
  const hashedToken = hashToken(refreshToken);

  // 3. Find and delete the session. If not found, it is either revoked or already used (possible token theft).
  const session = await Session.findOneAndDelete({
    refreshToken: hashedToken,
    isRevoked: false,
  });

  if (!session) {
    // SECURITY WARNING: Replay attack or revoked session.
    // If the token is valid but the session is gone, it was either logged out,
    // expired, or a duplicate refresh request happened.
    throw ApiError.from(ErrorCodes.SESSION_REVOKED, "Session is no longer valid");
  }

  // 4. Retrieve user to populate the new access token
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "User no longer exists");
  }

  // 5. Generate new tokens (Rotation)
  const newAccessToken = generateAccessToken({ userId: user._id, email: user.email });
  const newRefreshToken = generateRefreshToken({ userId: user._id });

  const hashedNewRefreshToken = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 6. Save the new session
  await Session.create({
    user: user._id,
    refreshToken: hashedNewRefreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Revoke the current session by deleting it.
 *
 * @param {string} refreshToken - Raw refresh token from cookie
 * @returns {Promise<void>}
 */
export async function logout(refreshToken) {
  if (!refreshToken) return;

  const hashedToken = hashToken(refreshToken);
  await Session.deleteOne({ refreshToken: hashedToken });
}

/**
 * Revoke all sessions for a user (force logout from all devices).
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function logoutAll(userId) {
  await Session.deleteMany({ user: userId });
}

/**
 * List active sessions for the user.
 *
 * Used for security dashboards so users can see where they are logged in.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of session documents
 */
export async function getSessions(userId) {
  return Session.find({ user: userId }).sort({ updatedAt: -1 });
}
