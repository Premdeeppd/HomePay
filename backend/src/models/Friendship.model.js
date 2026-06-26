import mongoose from "mongoose";

/**
 * Friendship Model
 *
 * Represents a CONFIRMED friendship between two users.
 * If a document exists here, they are friends. If it doesn't, they're not.
 * No status field needed — existence IS the status.
 *
 * ── The Ordered Pair Convention ──────────────────────────────
 *
 * Problem: If A and B are friends, should we store (A→B) or (B→A)?
 * If we store both, we waste space and risk inconsistency.
 * If we store one, which direction?
 *
 * Solution: ALWAYS store the smaller ObjectId as `user1` and the larger as `user2`.
 *
 *   orderedPair("67abc", "12def") → { user1: "12def", user2: "67abc" }
 *   orderedPair("12def", "67abc") → { user1: "12def", user2: "67abc" }
 *   // Same result regardless of order!
 *
 * This guarantees:
 *   - Exactly ONE document per friendship pair (compound unique index)
 *   - "Are A and B friends?" is a single indexed lookup (no $or needed)
 *
 * The `orderedPair()` helper in utils/helpers.js handles the ordering.
 * Every service that creates or queries friendships must use it.
 */

const friendshipSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    // Convention: always the SMALLER ObjectId (alphabetically)
  },

  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    // Convention: always the LARGER ObjectId (alphabetically)
  },

  // When the friendship was formed (when the request was accepted).
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes ────────────────────────────────────────────────────

// Compound unique: guarantees only ONE document per friend pair.
// Combined with the ordered pair convention, this is airtight.
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Separate index on user2:
//
// The compound index { user1, user2 } helps queries that:
//   ✅ filter by user1 only        → Friendship.find({ user1: X })
//   ✅ filter by user1 AND user2   → Friendship.findOne({ user1: X, user2: Y })
//
// But it does NOT help queries that:
//   ❌ filter by user2 only        → Friendship.find({ user2: X })
//
// "List all friends of X" needs BOTH directions:
//   Friendship.find({ $or: [{ user1: X }, { user2: X }] })
//
// Without this index, the { user2: X } branch would do a full collection scan.
friendshipSchema.index({ user2: 1 });

const Friendship = mongoose.model("Friendship", friendshipSchema);

export default Friendship;
