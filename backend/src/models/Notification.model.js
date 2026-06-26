import mongoose from "mongoose";

/**
 * Notification Model
 *
 * In-app notification inbox. Notifications are created by other modules
 * (friend service, transaction service, wallet service) and read by the
 * notification module.
 *
 * Not real-time (no Socket.IO for now). The frontend polls for unread
 * count on page navigation or on a timer (every 30 seconds).
 *
 * The `relatedModel` + `relatedId` pattern is called a "polymorphic reference" —
 * it lets you link to ANY document type (FriendRequest, Transaction, Wallet)
 * without needing separate fields for each. The frontend uses this to
 * navigate to the right page when the user clicks a notification.
 *
 * TTL auto-deletes notifications older than 90 days — keeps the
 * collection lean without manual cleanup.
 */

const notificationSchema = new mongoose.Schema({
  // Who receives this notification.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: [
      "friend_request",   // "Prem sent you a friend request"
      "friend_accepted",  // "Prem accepted your friend request"
      "money_received",   // "Prem sent you ₹500"
      "wallet_invite",    // "Prem added you to 'Kumar Family' wallet"
      "wallet_deposit",   // "Prem deposited ₹1000 into 'Kumar Family'"
      "wallet_spend",     // "Prem spent ₹500 from 'Kumar Family'"
    ],
    required: true,
  },

  // Short display text: "Prem sent you ₹500"
  title: {
    type: String,
    required: [true, "Notification title is required"],
    maxlength: [200, "Title must be at most 200 characters"],
  },

  // Optional longer description.
  message: {
    type: String,
    maxlength: [500, "Message must be at most 500 characters"],
    default: null,
  },

  // ── Polymorphic reference ────────────────────────────────────
  // Which model does this notification relate to?
  // The frontend uses this to build a "Go to" link.
  //
  // Example: { relatedModel: "Transaction", relatedId: "507f1f77..." }
  // → clicking the notification navigates to that transaction's detail page.
  relatedModel: {
    type: String,
    enum: ["FriendRequest", "Friendship", "Transaction", "Wallet"],
    default: null,
  },

  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    // No `ref` here — it's polymorphic (could reference any model).
    // You'll manually populate based on `relatedModel` if needed.
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  readAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes ────────────────────────────────────────────────────

// "My unread notifications, newest first" — the primary query.
// Compound index covers both the filter (user + isRead) and sort (createdAt).
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// "All my notifications" — when the user scrolls past unread.
notificationSchema.index({ user: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 90 days.
// 90 days = 90 * 24 * 60 * 60 = 7,776,000 seconds.
// Keeps the collection from growing unbounded.
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
