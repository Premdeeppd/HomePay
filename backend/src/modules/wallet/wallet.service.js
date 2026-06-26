import mongoose from "mongoose";
import Wallet from "../../models/Wallet.model.js";
import WalletMember from "../../models/WalletMember.model.js";
import User from "../../models/User.model.js";
import Friendship from "../../models/Friendship.model.js";
import Transaction from "../../models/Transaction.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import { orderedPair } from "../../utils/helpers.js";
import { createNotification } from "../../utils/notification.js";

/**
 * Create a new shared wallet.
 *
 * Uses a transaction to create the Wallet doc and the WalletMember pivot doc
 * (representing the owner) atomically.
 *
 * @param {string} ownerId - ID of user creating the wallet
 * @param {Object} walletData - Wallet details
 * @param {string} walletData.name - Wallet name
 * @param {string} [walletData.description] - Description
 * @returns {Promise<Object>} Created Wallet document
 */
export async function createWallet(ownerId, { name, description }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create Wallet
    const walletArray = await Wallet.create(
      [
        {
          name,
          description,
          owner: ownerId,
          balance: 0,
        },
      ],
      { session }
    );
    const wallet = walletArray[0];

    // 2. Add creator as the owner member
    await WalletMember.create(
      [
        {
          wallet: wallet._id,
          user: ownerId,
          role: "owner",
          addedBy: ownerId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return wallet;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * List all wallets the user belongs to.
 * Returns the wallet metadata, their role, and join timestamp.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of membership structures
 */
export async function listMyWallets(userId) {
  const memberships = await WalletMember.find({ user: userId })
    .populate({
      path: "wallet",
      populate: { path: "owner", select: "name email avatar" },
    })
    .sort({ joinedAt: -1 });

  return memberships
    .filter((m) => m.wallet !== null) // Filter out orphaned memberships if any
    .map((m) => ({
      wallet: m.wallet,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
}

/**
 * Retrieve wallet details and all its members.
 * Enforces membership check.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} userId - Logged in user querying details
 * @returns {Promise<{wallet: Object, myRole: string, members: Array}>}
 */
export async function getWalletDetails(walletId, userId) {
  // 1. Verify membership
  const member = await WalletMember.findOne({ wallet: walletId, user: userId });
  if (!member) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_MEMBER);
  }

  // 2. Fetch Wallet details
  const wallet = await Wallet.findById(walletId).populate("owner", "name email avatar");
  if (!wallet) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Wallet not found");
  }

  // 3. Fetch all members with their profiles
  const members = await WalletMember.find({ wallet: walletId })
    .populate("user", "name email avatar phone")
    .populate("addedBy", "name");

  return {
    wallet,
    myRole: member.role,
    members,
  };
}

/**
 * Invite a friend to the shared wallet.
 * Enforces friendship check and owner-only privilege.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} ownerId - ID of owner sending the invite
 * @param {string} targetUserId - ID of user to invite
 * @returns {Promise<Object>} Created WalletMember membership doc
 */
export async function addMember(walletId, ownerId, targetUserId) {
  // 1. Verify requester is owner of the wallet member pivot
  const requester = await WalletMember.findOne({
    wallet: walletId,
    user: ownerId,
    role: "owner",
  });
  if (!requester) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_OWNER);
  }

  const wallet = await Wallet.findById(walletId);
  if (!wallet) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Wallet not found");
  }

  const ownerUser = await User.findById(ownerId);

  // 2. Verify target user is a friend of the owner (anti-fraud check!)
  const pair = orderedPair(ownerId, targetUserId);
  const isFriends = await Friendship.exists(pair);
  if (!isFriends) {
    throw ApiError.from(
      ErrorCodes.NOT_FRIENDS,
      "You can only add users who are your confirmed friends to a shared wallet"
    );
  }

  // 3. Verify target is not already a member
  const alreadyMember = await WalletMember.exists({ wallet: walletId, user: targetUserId });
  if (alreadyMember) {
    throw ApiError.from(ErrorCodes.ALREADY_WALLET_MEMBER);
  }

  // 4. Create membership
  const member = await WalletMember.create({
    wallet: walletId,
    user: targetUserId,
    role: "member",
    addedBy: ownerId,
  });

  // 5. Notify the invited user
  await createNotification({
    user: targetUserId,
    type: "wallet_invite",
    title: `${ownerUser.name} added you to the shared wallet '${wallet.name}'`,
    message: "You can now deposit and spend from this shared balance.",
    relatedModel: "Wallet",
    relatedId: walletId,
  });

  return member;
}

/**
 * Remove a member from the shared wallet.
 * Owner-only privilege. The owner cannot remove themselves.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} ownerId - ID of wallet owner
 * @param {string} targetUserId - ID of user to remove
 * @returns {Promise<void>}
 */
export async function removeMember(walletId, ownerId, targetUserId) {
  // 1. Verify requester is owner
  const requester = await WalletMember.findOne({
    wallet: walletId,
    user: ownerId,
    role: "owner",
  });
  if (!requester) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_OWNER);
  }

  // 2. Prevent removing the owner
  if (ownerId.toString() === targetUserId.toString()) {
    throw ApiError.from(ErrorCodes.BAD_REQUEST, "The wallet owner cannot be removed");
  }

  // 3. Delete membership pivot document
  const deleteResult = await WalletMember.deleteOne({ wallet: walletId, user: targetUserId });
  if (deleteResult.deletedCount === 0) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Member not found in this wallet");
  }
}

/**
 * Move funds from personal user balance into shared wallet balance.
 *
 * Transaction-backed atomic ledger updates.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} userId - ID of user depositing
 * @param {number} amount - Amount in ₹ to deposit
 * @returns {Promise<Object>} Created Transaction record
 */
export async function deposit(walletId, userId, amount) {
  // 1. Verify membership
  const member = await WalletMember.findOne({ wallet: walletId, user: userId });
  if (!member) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_MEMBER);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Lock user and wallet docs
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
    }

    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "Wallet not found");
    }

    // 3. Check personal balance
    if (user.balance < amount) {
      throw ApiError.from(ErrorCodes.INSUFFICIENT_BALANCE);
    }

    const userBefore = user.balance;
    const walletBefore = wallet.balance;

    // 4. Update balances
    user.balance -= amount;
    wallet.balance += amount;

    await user.save({ session });
    await wallet.save({ session });

    // 5. Log transaction
    const transactionArray = await Transaction.create(
      [
        {
          type: "wallet_deposit",
          sender: userId,
          wallet: walletId,
          amount,
          description: `Deposit to ${wallet.name}`,
          balanceSnapshot: {
            senderBefore: userBefore,
            senderAfter: user.balance,
            walletBefore,
            walletAfter: wallet.balance,
          },
        },
      ],
      { session }
    );

    const transaction = transactionArray[0];

    // 6. Notify other wallet members of the deposit
    const otherMembers = await WalletMember.find({
      wallet: walletId,
      user: { $ne: userId },
    }).session(session);

    for (const m of otherMembers) {
      await createNotification(
        {
          user: m.user,
          type: "wallet_deposit",
          title: `${user.name} deposited ₹${amount.toLocaleString("en-IN")} into '${wallet.name}'`,
          relatedModel: "Wallet",
          relatedId: walletId,
        },
        { session }
      );
    }

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
 * Spend shared wallet balance.
 *
 * Can go to a person (must be friend) or an external merchant description.
 * Transaction-backed atomic ledger updates.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} userId - ID of member initiating spend
 * @param {Object} spendData - Spending details
 * @param {number} spendData.amount - Amount in ₹ to spend
 * @param {string} [spendData.receiverId] - Optional receiver (P2P Friend) ID
 * @param {string} spendData.description - Description/Merchant label
 * @returns {Promise<Object>} Created Transaction record
 */
export async function spend(walletId, userId, { amount, receiverId = null, description }) {
  // 1. Verify membership
  const member = await WalletMember.findOne({ wallet: walletId, user: userId });
  if (!member) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_MEMBER);
  }

  const spenderUser = await User.findById(userId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      throw ApiError.from(ErrorCodes.NOT_FOUND, "Wallet not found");
    }

    // 2. Verify wallet balance
    if (wallet.balance < amount) {
      throw ApiError.from(
        ErrorCodes.INSUFFICIENT_BALANCE,
        "Shared wallet does not have enough balance"
      );
    }

    const walletBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save({ session });

    let receiverUser = null;
    let receiverBefore = null;

    // 3. Process destination (person or merchant)
    if (receiverId) {
      // Spend to a person: verify friendship first!
      const pair = orderedPair(userId, receiverId);
      const isFriends = await Friendship.exists(pair);
      if (!isFriends) {
        throw ApiError.from(
          ErrorCodes.NOT_FRIENDS,
          "You can only send wallet spendings to confirmed friends"
        );
      }

      receiverUser = await User.findById(receiverId).session(session);
      if (!receiverUser) {
        throw ApiError.from(ErrorCodes.NOT_FOUND, "Recipient user not found");
      }

      receiverBefore = receiverUser.balance;
      receiverUser.balance += amount;
      await receiverUser.save({ session });
    }

    // 4. Log transaction
    const transactionArray = await Transaction.create(
      [
        {
          type: "wallet_spend",
          sender: userId,
          receiver: receiverId,
          wallet: walletId,
          amount,
          description: description || "Wallet spend",
          balanceSnapshot: {
            walletBefore,
            walletAfter: wallet.balance,
            ...(receiverId && {
              receiverBefore,
              receiverAfter: receiverUser.balance,
            }),
          },
        },
      ],
      { session }
    );

    const transaction = transactionArray[0];

    // 5. Notify receiver if transfer to user
    if (receiverId && receiverUser) {
      await createNotification(
        {
          user: receiverId,
          type: "money_received",
          title: `${spenderUser.name} sent you ₹${amount.toLocaleString(
            "en-IN"
          )} from wallet '${wallet.name}'`,
          message: description,
          relatedModel: "Transaction",
          relatedId: transaction._id,
        },
        { session }
      );
    }

    // 6. Notify other wallet members of the spend
    const otherMembers = await WalletMember.find({
      wallet: walletId,
      user: { $ne: userId },
    }).session(session);

    const notificationTitle = receiverId
      ? `${spenderUser.name} spent ₹${amount.toLocaleString("en-IN")} from '${
          wallet.name
        }' to ${receiverUser.name}`
      : `${spenderUser.name} spent ₹${amount.toLocaleString("en-IN")} from '${
          wallet.name
        }' for '${description}'`;

    for (const m of otherMembers) {
      await createNotification(
        {
          user: m.user,
          type: "wallet_spend",
          title: notificationTitle,
          message: description,
          relatedModel: "Wallet",
          relatedId: walletId,
        },
        { session }
      );
    }

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
 * Retrieve transaction history for a wallet.
 * Enforces membership check.
 *
 * @param {string} walletId - Wallet ObjectId
 * @param {string} userId - Logged in user requesting history
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{transactions: Array, total: number, page: number, totalPages: number}>}
 */
export async function getWalletTransactions(walletId, userId, { page = 1, limit = 10 }) {
  // 1. Verify membership
  const member = await WalletMember.findOne({ wallet: walletId, user: userId });
  if (!member) {
    throw ApiError.from(ErrorCodes.NOT_WALLET_MEMBER);
  }

  const skip = (page - 1) * limit;

  // 2. Query transactions
  const transactions = await Transaction.find({ wallet: walletId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar");

  const total = await Transaction.countDocuments({ wallet: walletId });

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
