import mongoose from "mongoose";
import bcrypt from "bcrypt";

/**
 * User Model
 *
 * The core identity document. Stores profile, auth credentials, and balance.
 * No embedded arrays — related data lives in separate collections
 * (sessions, friendships, walletMembers, etc.)
 *
 * Key design decisions:
 *   - `select: false` on password → never returned in queries unless explicitly asked
 *   - `sparse` unique on phone/googleId → allows null without duplicate conflicts
 *   - Text index on name + email → enables the user search feature
 *   - Pre-save hook → auto-hashes password so services don't need to remember
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // "PREM@Gmail.com" → "prem@gmail.com" before saving
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // ← IMPORTANT: excluded from ALL queries by default.
      // To include it: User.findOne({ email }).select("+password")
    },

    avatar: {
      type: String,
      default: "https://api.dicebear.com/9.x/initials/svg?seed=HP",
      // DiceBear generates avatar SVGs from initials. You'll override this
      // per user later (e.g., seed=Prem+Kumar).
    },

    // ── OAuth fields (deferred, but schema is ready) ──────────
    googleId: {
      type: String,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ── Financial ─────────────────────────────────────────────
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
      // Stored in ₹ (INR). In production, you'd store as paisa (integer)
      // to avoid floating-point rounding errors (₹10.50 → 1050 paisa).
      // For a learning project, Number is fine.
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Indexes ────────────────────────────────────────────────────

// Sparse unique: allows multiple users to have phone = null
// without triggering a duplicate key error.
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Sparse unique for Google OAuth (deferred, but index is ready).
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Text index: enables full-text search on name and email.
// Used by the user search feature: User.find({ $text: { $search: "prem" } })
userSchema.index({ name: "text", email: "text" });

// ── Pre-save Hook ──────────────────────────────────────────────
// Automatically hashes the password before saving to the database.
// Only runs if the password field was actually modified (not on every save).
//
// Why a hook instead of hashing in the service?
//   - You can't forget to hash — it's enforced at the schema level.
//   - Works for both User.create() and user.save() calls.
//   - The service layer stays clean — it just sets user.password = "plaintext".
//
// IMPORTANT: Must use `function()` syntax (not arrow function)
// because Mongoose binds `this` to the document being saved.
// Arrow functions don't have their own `this`.

userSchema.pre("save", async function () {
  // Only hash if the password was changed (or is new).
  // Without this check, the password would get re-hashed on every .save(),
  // making the original password unrecoverable.
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method ────────────────────────────────────────────
// Compares a plaintext password attempt against the stored hash.
//
// Usage in auth service:
//   const user = await User.findOne({ email }).select("+password");
//   const isMatch = await user.comparePassword("MyPassword123");
//
// Again, must use `function()` — `this` refers to the user document.

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
