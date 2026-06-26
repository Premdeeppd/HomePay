import bcrypt from "bcrypt";

/**
 * Password hashing utilities using bcrypt.
 *
 * Why bcrypt?
 *   1. It's intentionally SLOW — each hash takes ~250ms with 12 rounds.
 *      This is a feature, not a bug. If an attacker gets your DB,
 *      they can only try ~4 passwords/second instead of millions.
 *
 *   2. It auto-generates a unique salt per password.
 *      Two users with the same password get different hashes.
 *
 *   3. The salt is stored inside the hash string itself:
 *      "$2b$12$salt22chars.hash31chars..."
 *      So you don't need a separate salt column.
 *
 * SALT_ROUNDS (cost factor):
 *   10 → ~10 hashes/sec (minimum recommended)
 *   12 → ~3 hashes/sec  (good balance for a payment app)
 *   14 → ~1 hash/sec    (high security, slower registration/login)
 */
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password.
 *
 * @param {string} plaintext - The raw password from the user
 * @returns {Promise<string>} The bcrypt hash string
 *
 * @example
 *   const hash = await hashPassword("MySecurePass123");
 *   // "$2b$12$LJ3m4gK..."  (60 chars)
 */
export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored hash.
 *
 * @param {string} plaintext - The password the user just typed
 * @param {string} hash      - The stored hash from the database
 * @returns {Promise<boolean>} true if they match
 *
 * @example
 *   const isMatch = await comparePassword("MySecurePass123", user.password);
 *   if (!isMatch) throw ApiError.from(ErrorCodes.INVALID_CREDENTIALS);
 */
export async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}
