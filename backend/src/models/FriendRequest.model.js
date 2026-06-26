import mongoose from "mongoose";

/**
 * FriendRequest Model
 *
 * Represents a PENDING or REJECTED friend request.
 * This is a SHORT-LIVED document — it gets DELETED when accepted.
 *
 * Lifecycle:
 *   1. User A sends request → FriendRequest { sender: A, receiver: B, status: "pending" }
 *   2a. B accepts → DELETE this FriendRequest + CREATE a Friendship document
 *   2b. B rejects → status becomes "rejected", rejectedAt is set,
 *                    TTL auto-deletes after 30 days (cooldown period)
 *
 * Why separate from Friendship?
 *   - "Are A and B friends?" is the MOST FREQUENT query (runs on every transaction).
 *     It should hit the Friendship collection with a simple indexed lookup.
 *   - If friend requests and friendships lived in the same collection,
 *     every "are we friends?" query would need: { status: "accepted" } filter,
 *     which is slower and more error-prone.
 *   - Separation = single source of truth. Friendship exists = they're friends. Period.
 */

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "rejected"],
      default: "pending",
    },

    // Optional message: "Hey, it's Prem from college!"
    message: {
      type: String,
      maxlength: [200, "Message must be at most 200 characters"],
      trim: true,
      default: null,
    },

    // Set when the request is rejected.
    // The TTL index uses this to auto-delete rejected requests after 30 days.
    // Pending requests (rejectedAt = null) are NOT affected by the TTL.
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────

// Compound unique: prevents User A from sending multiple requests to User B.
// If A sends a request to B, a second attempt throws a duplicate key error.
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// "Show me my pending incoming requests" — the most common query.
// Receiver opens the friends page → sees pending requests to accept/reject.
friendRequestSchema.index({ receiver: 1, status: 1 });

// "Show me my sent requests" — used on the "Sent Requests" tab.
friendRequestSchema.index({ sender: 1, status: 1 });

// TTL index: auto-delete rejected requests after 30 days.
// Only affects documents where rejectedAt is NOT null.
// Pending requests (rejectedAt = null) are ignored by this TTL.
//
// 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds.
// After rejection, the user must wait 30 days before re-requesting.
friendRequestSchema.index(
  { rejectedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
