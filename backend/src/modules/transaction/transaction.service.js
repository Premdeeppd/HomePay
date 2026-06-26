import mongoose from "mongoose";
import User from "../../models/User.model.js";
import Friendship from "../../models/Friendship.model.js";
import Transaction from "../../models/Transaction.model.js";
import WalletMember from "../../models/WalletMember.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import { orderedPair } from "../../utils/helpers.js";
import { createNotification } from "../../utils/notification.js";

/**
 * Send money directly to a friend (P2P Transfer).
 *
 * Enforces friendship check, sender balance check, and runs inside a Mongoose
 * transaction to guarantee atomic ledger safety (both balances update and log created).
 *
 * @param {string} senderId - ID of user sending the money
 * @param {Object} txnData - Transfer details
 * @param {string} txnData.receiverId - ID of friend receiving the money
 * @param {number} txnData.amount - Amount in ₹ to send
 * @param {string} [txnData.description] - Description
 * @returns {Promise<Object>} Created Transaction document
 */
export async function sendMoney(senderId, { receiverId, amount, description }) {
  if (senderId.toString() === receiverId.toString()) {
    throw ApiError.from(ErrorCodes.SELF_TRANSFER);
  }

  // 1. Verify friendship exists (Critical for fraud prevention!)
  const pair = orderedPair(senderId, receiverId);
  const isFriends = await Friendship.exists(pair);
  if (!isFriends) {
    throw ApiError.from(
      ErrorCodes.NOT_FRIENDS,
      "You can only send money to users who are your confirmed friends"
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Lock sender and receiver documents in session
    const sender = await User.findById(senderId).session(session);
    if (!sender) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "Sender user not found");
    }

    const receiver = await User.findById(receiverId).session(session);
    if (!receiver) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "Receiver user not found");
    }

    // 3. Check sufficient balance
    if (sender.balance < amount) {
      throw ApiError.from(ErrorCodes.INSUFFICIENT_BALANCE);
    }

    const senderBefore = sender.balance;
    const receiverBefore = receiver.balance;

    // 4. Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    // 5. Log transaction
    const transactionArray = await Transaction.create(
      [
        {
          type: "p2p_transfer",
          sender: senderId,
          receiver: receiverId,
          amount,
          description: description || "Money transfer",
          balanceSnapshot: {
            senderBefore,
            senderAfter: sender.balance,
            receiverBefore,
            receiverAfter: receiver.balance,
          },
        },
      ],
      { session }
    );

    const transaction = transactionArray[0];

    // 6. Notify receiver
    await createNotification(
      {
        user: receiverId,
        type: "money_received",
        title: `${sender.name} sent you ₹${amount.toLocaleString("en-IN")}`,
        message: description || "P2P Transfer received.",
        relatedModel: "Transaction",
        relatedId: transaction._id,
      },
      { session }
    );

    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Retrieve transaction history for a user.
 * Supports pagination, type filtering, and date range filters.
 *
 * @param {string} userId - User ID
 * @param {Object} options - Pagination and filter parameters
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.type] - Filter by transaction type
 * @param {string} [options.startDate] - ISO date string
 * @param {string} [options.endDate] - ISO date string
 * @returns {Promise<{transactions: Array, total: number, page: number, totalPages: number}>}
 */
export async function getHistory(userId, { page = 1, limit = 10, type, startDate, endDate }) {
  const query = {
    $or: [{ sender: userId }, { receiver: userId }],
  };

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("wallet", "name");

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Retrieve transaction history specifically between current user and another user.
 *
 * @param {string} currentUserId - Logged in user
 * @param {string} otherUserId - Specific friend user
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{transactions: Array, total: number, page: number, totalPages: number}>}
 */
export async function getHistoryWithUser(currentUserId, otherUserId, { page = 1, limit = 10 }) {
  const query = {
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  };

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("wallet", "name");

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Retrieve details for a single transaction.
 * Enforces role-based visibility checking.
 *
 * @param {string} transactionId - Transaction ObjectId
 * @param {string} currentUserId - The user querying details
 * @returns {Promise<Object>} Populated transaction document
 */
export async function getTransactionDetail(transactionId, currentUserId) {
  const transaction = await Transaction.findById(transactionId)
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("wallet", "name owner");

  if (!transaction) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Transaction not found");
  }

  // Authorize: user must be sender, receiver, or a wallet member (if wallet transaction)
  const isSender = transaction.sender._id.toString() === currentUserId.toString();
  const isReceiver = transaction.receiver && transaction.receiver._id.toString() === currentUserId.toString();
  
  let isWalletMember = false;
  if (transaction.wallet) {
    isWalletMember = await WalletMember.exists({
      wallet: transaction.wallet._id,
      user: currentUserId,
    });
  }

  if (!isSender && !isReceiver && !isWalletMember) {
    throw ApiError.from(
      ErrorCodes.FORBIDDEN,
      "You do not have permission to view this transaction"
    );
  }

  return transaction;
}
