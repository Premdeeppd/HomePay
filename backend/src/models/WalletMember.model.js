import mongoose from "mongoose";

/**
 * WalletMember Model (Junction Table)
 *
 * Links users to wallets in a many-to-many relationship.
 * Each document = one user's membership in one wallet.
 *
 * This is a "junction table" (also called "pivot table" or "join table") —
 * a pattern from relational databases adapted for MongoDB.
 *
 * Traditional approach (embedded array):
 *   Wallet { members: [{ user: ObjectId, role: "member" }] }
 *   Problem: "Find all wallets I belong to" requires scanning EVERY wallet's
 *   members array with $elemMatch. Slow at scale.
 *
 * Junction table approach (this model):
 *   WalletMember { wallet: ObjectId, user: ObjectId, role: "member" }
 *   Solution: "Find all wallets I belong to" = WalletMember.find({ user: myId })
 *   Fast, indexed, simple.
 *
 * Business Rules:
 *   - When a wallet is created, the owner is auto-added with role: "owner"
 *   - Only the owner can add/remove members
 *   - Members being added must be friends of the owner
 *   - The owner cannot be removed (enforced in the service layer)
 */

const walletMemberSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  role: {
    type: String,
    enum: ["owner", "member"],
    default: "member",
  },

  // Who invited this member. For the owner, this is their own ID.
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes ────────────────────────────────────────────────────

// Compound unique: a user can only be a member of the same wallet ONCE.
// Prevents the owner from accidentally adding someone twice.
walletMemberSchema.index({ wallet: 1, user: 1 }, { unique: true });

// "Find all wallets I belong to" — the primary query for the wallets page.
// WalletMember.find({ user: myId }).populate("wallet")
walletMemberSchema.index({ user: 1 });

const WalletMember = mongoose.model("WalletMember", walletMemberSchema);

export default WalletMember;
