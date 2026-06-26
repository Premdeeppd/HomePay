import mongoose from "mongoose";

/**
 * Session Model
 *
 * Each document represents ONE active login session.
 * A user can have multiple sessions (phone + laptop + tablet).
 *
 * Why a separate collection instead of storing refresh tokens on the User doc?
 *   1. Multi-device support — each device gets its own session
 *   2. "Logout from all devices" — just delete all sessions for a user
 *   3. Session management UI — user can see "logged in on Chrome, MacOS"
 *   4. Token rotation — when a refresh token is used, the old session is
 *      deleted and a new one is created (prevents replay attacks)
 *
 * Security:
 *   - The refresh token is stored HASHED (not raw). If the DB is breached,
 *     attackers can't use the hashed tokens to impersonate users.
 *   - TTL index auto-deletes expired sessions — no manual cleanup needed.
 */

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store the refresh token HASHED.
    // On refresh: hash the incoming raw token → find matching session.
    refreshToken: {
      type: String,
      required: true,
    },

    // Captured from req.headers["user-agent"] at login time.
    // Displayed in the "Active Sessions" UI: "Chrome on MacOS"
    userAgent: {
      type: String,
      default: "Unknown",
    },

    // Captured from req.ip at login time.
    // Useful for detecting suspicious logins from new locations.
    ipAddress: {
      type: String,
      default: "Unknown",
    },

    // Soft revocation flag.
    // Instead of deleting the session immediately, you can mark it revoked.
    // Useful for audit: "this session was revoked at [time]".
    isRevoked: {
      type: Boolean,
      default: false,
    },

    // When this session should expire.
    // The TTL index watches this field — MongoDB deletes the document
    // automatically once Date.now() > expiresAt.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────

// Find all sessions for a user (for "Active Sessions" page, "Logout All").
sessionSchema.index({ user: 1 });

// Look up a session by its hashed refresh token (on token refresh).
sessionSchema.index({ refreshToken: 1 });

// TTL index: MongoDB automatically deletes documents where
// `expiresAt` has passed. The `expireAfterSeconds: 0` means
// "delete exactly when expiresAt is reached" (no additional delay).
//
// This means expired sessions clean themselves up — no cron job needed.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
