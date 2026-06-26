import mongoose from "mongoose";
import User from "../../models/User.model.js";
import Transaction from "../../models/Transaction.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";

/**
 * Update user profile details.
 *
 * @param {string} userId - ID of the user updating their profile
 * @param {Object} updateData - Fields to update
 * @param {string} [updateData.name] - New name
 * @param {string} [updateData.phone] - New phone number
 * @param {string} [updateData.avatar] - New avatar URL
 * @returns {Promise<Object>} Updated user document
 */
export async function updateProfile(userId, { name, phone, avatar }) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
  }

  // If phone is being updated, verify it is unique
  if (phone !== undefined && phone !== user.phone) {
    if (phone !== null) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        throw ApiError.from(ErrorCodes.CONFLICT, "Phone number is already registered by another user");
      }
    }
    user.phone = phone;
  }

  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  return user;
}

/**
 * Search users by name or email, excluding the current user.
 *
 * Matches using case-insensitive regex for partial auto-complete search.
 *
 * @param {string} currentUserId - The searching user (to exclude them)
 * @param {string} query - The search string
 * @returns {Promise<Array>} List of matched user profiles
 */
export async function searchUsers(currentUserId, query) {
  if (!query || query.trim() === "") {
    return [];
  }

  const cleanQuery = query.trim();

  // Search by name or email using a case-insensitive regex.
  // Excludes the logged-in user from the results.
  return User.find({
    _id: { $ne: currentUserId },
    $or: [
      { name: { $regex: cleanQuery, $options: "i" } },
      { email: { $regex: cleanQuery, $options: "i" } },
    ],
  })
    .select("name email avatar phone")
    .limit(10);
}

/**
 * Retrieve current balance for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Current balance
 */
export async function getBalance(userId) {
  const user = await User.findById(userId).select("balance");
  if (!user) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
  }
  return user.balance;
}

/**
 * Simulate adding funds to personal wallet.
 *
 * Atomically increments user's balance and creates an audit transaction log.
 * Uses a Mongoose transaction to guarantee reliability.
 *
 * @param {string} userId - User ID
 * @param {Object} fundData - Amount and optional description
 * @param {number} fundData.amount - Amount in ₹ to add
 * @param {string} fundData.description - Transaction description
 * @returns {Promise<{user: Object, transaction: Object}>}
 */
export async function addFunds(userId, { amount, description }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
    }

    const previousBalance = user.balance;
    user.balance += amount;
    await user.save({ session });

    // Create a transaction audit log
    const transactionArray = await Transaction.create(
      [
        {
          type: "add_funds",
          sender: userId, // sender is the user adding funds
          amount,
          description: description || "Funds Added (Simulation)",
          balanceSnapshot: {
            senderBefore: previousBalance,
            senderAfter: user.balance,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
      },
      transaction: transactionArray[0],
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
