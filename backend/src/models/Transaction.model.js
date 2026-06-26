import mongoose from "mongoose";

/**
 * Transaction Model
 *
 * Records EVERY money movement in the system. This is your financial audit log.
 * Transactions are IMMUTABLE — once created, they are never updated or deleted.
 *
 * Four transaction types:
 *
 *   ┌─────────────────┬────────┬──────────┬────────┬─────────────────────────────────┐
 *   │ Type            │ sender │ receiver │ wallet │ What happens                    │
 *   ├─────────────────┼────────┼──────────┼────────┼─────────────────────────────────┤
 *   │ add_funds       │ user   │ —        │ —      │ User adds ₹ to own balance      │
 *   │ p2p_transfer    │ userA  │ userB    │ —      │ A sends ₹ to friend B           │
 *   │ wallet_deposit  │ user   │ —        │ wallet │ User moves ₹ from self → wallet │
 *   │ wallet_spend    │ user   │ user/—   │ wallet │ Spend from wallet → person/shop │
 *   └─────────────────┴────────┴──────────┴────────┴─────────────────────────────────┘
 *
 * balanceSnapshot: Captures balances BEFORE the transaction.
 *   This lets you reconstruct the balance timeline without replaying
 *   every transaction. If something looks wrong, you can trace exactly
 *   what each balance was at any point in time.
 */

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["p2p_transfer", "wallet_deposit", "wallet_spend", "add_funds"],
      required: true,
    },

    // Who initiated the transaction. Always set.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who received the money. Set for p2p_transfer and wallet_spend (to person).
    // Null for wallet_deposit, add_funds, and wallet_spend (to merchant).
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Which wallet is involved. Set for wallet_deposit and wallet_spend.
    // Null for p2p_transfer and add_funds.
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be at least ₹0.01"],
    },

    // Optional note: "Lunch money", "Groceries at BigBazaar", etc.
    description: {
      type: String,
      maxlength: [200, "Description must be at most 200 characters"],
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },

    // ── Balance Snapshot (audit trail) ──────────────────────────
    // Records what the balances looked like BEFORE this transaction.
    // "After" = "Before" ± amount. Stored for quick verification.
    //
    // Not all fields are relevant for all transaction types.
    // For p2p_transfer: senderBefore, senderAfter, receiverBefore, receiverAfter
    // For wallet_deposit: senderBefore, senderAfter, walletBefore, walletAfter
    // For wallet_spend: walletBefore, walletAfter, (receiverBefore, receiverAfter if to person)
    // For add_funds: senderBefore, senderAfter
    balanceSnapshot: {
      senderBefore: { type: Number, default: null },
      senderAfter: { type: Number, default: null },
      receiverBefore: { type: Number, default: null },
      receiverAfter: { type: Number, default: null },
      walletBefore: { type: Number, default: null },
      walletAfter: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────

// "My sent transactions, newest first" — used on the transaction history page.
// The compound index { sender, createdAt } lets MongoDB satisfy BOTH the
// filter (sender = me) and the sort (createdAt desc) from a single index.
transactionSchema.index({ sender: 1, createdAt: -1 });

// "Money I received, newest first"
transactionSchema.index({ receiver: 1, createdAt: -1 });

// "Wallet transaction history, newest first"
transactionSchema.index({ wallet: 1, createdAt: -1 });

// "Transactions between me and a specific friend"
// Used when clicking a friend's name to see all money exchanged.
transactionSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Filter by transaction type across all transactions.
transactionSchema.index({ type: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
