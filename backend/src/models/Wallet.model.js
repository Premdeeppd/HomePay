import mongoose from "mongoose";

/**
 * Wallet Model
 *
 * A shared wallet that family members or friends can use together.
 * Stores only the wallet metadata + balance — members are tracked
 * in the separate WalletMember collection (junction table pattern).
 *
 * Why no embedded members array?
 *   - "Find all wallets I belong to" would require $elemMatch on every wallet
 *   - Adding/removing members would require updating the wallet document
 *     (risk of write conflicts with concurrent balance updates)
 *   - The WalletMember collection allows efficient indexed queries
 */

const walletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Wallet name is required"],
      trim: true,
      minlength: [2, "Wallet name must be at least 2 characters"],
      maxlength: [50, "Wallet name must be at most 50 characters"],
    },

    description: {
      type: String,
      maxlength: [200, "Description must be at most 200 characters"],
      trim: true,
      default: null,
    },

    // The user who created this wallet. Has full admin privileges.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Shared balance in ₹. Any member can spend from it.
    balance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────

// "Show me wallets I own" — used on the wallet management page.
walletSchema.index({ owner: 1 });

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
