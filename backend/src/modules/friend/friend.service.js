import mongoose from "mongoose";
import User from "../../models/User.model.js";
import FriendRequest from "../../models/FriendRequest.model.js";
import Friendship from "../../models/Friendship.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import { orderedPair } from "../../utils/helpers.js";
import { createNotification } from "../../utils/notification.js";

/**
 * Send a friend request.
 *
 * Checks blocklists/cooldowns, prevents self-requests, checks existing
 * friendships and duplicate requests, and creates a pending FriendRequest
 * along with a notification for the receiver.
 *
 * @param {string} senderId - ID of user sending the request
 * @param {string} receiverId - ID of user receiving the request
 * @param {string} [message] - Optional invite message
 * @returns {Promise<Object>} Created FriendRequest document
 */
export async function sendFriendRequest(senderId, receiverId, message = null) {
  // 1. Prevent self-requests
  if (senderId.toString() === receiverId.toString()) {
    throw ApiError.from(ErrorCodes.SELF_FRIEND_REQUEST);
  }

  // 2. Verify receiver exists
  const receiverUser = await User.findById(receiverId);
  if (!receiverUser) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Target user not found");
  }

  const senderUser = await User.findById(senderId);
  if (!senderUser) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Sender user not found");
  }

  // 3. Verify they are not already friends
  const pair = orderedPair(senderId, receiverId);
  const alreadyFriends = await Friendship.exists(pair);
  if (alreadyFriends) {
    throw ApiError.from(ErrorCodes.ALREADY_FRIENDS);
  }

  // 4. Check for any existing requests in either direction
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      if (existingRequest.sender.toString() === senderId.toString()) {
        throw ApiError.from(ErrorCodes.DUPLICATE_REQUEST, "Friend request already sent and pending");
      } else {
        throw ApiError.from(
          ErrorCodes.DUPLICATE_REQUEST,
          "This user has already sent you a friend request. Check your inbox!"
        );
      }
    } else if (existingRequest.status === "rejected") {
      // Cooldown check. In our DB, rejected requests auto-expire in 30 days due to TTL.
      // If it exists in the collection, the cooldown is active.
      throw ApiError.from(
        ErrorCodes.DUPLICATE_REQUEST,
        "A previous request was recently rejected. There is a 30-day cooldown period."
      );
    }
  }

  // 5. Create the FriendRequest
  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    message,
    status: "pending",
  });

  // 6. Create notification for receiver
  await createNotification({
    user: receiverId,
    type: "friend_request",
    title: `${senderUser.name} sent you a friend request`,
    message: message || "Would like to be friends to make payments.",
    relatedModel: "FriendRequest",
    relatedId: friendRequest._id,
  });

  return friendRequest;
}

/**
 * Accept a pending friend request.
 *
 * Uses a Mongoose transaction to atomically:
 *   1. Delete the FriendRequest document
 *   2. Create the Friendship document
 *   3. Generate a notification for the sender
 *
 * @param {string} requestId - The ID of the friend request to accept
 * @param {string} currentUserId - The ID of the receiver accepting the request
 * @returns {Promise<Object>} Created Friendship document
 */
export async function acceptFriendRequest(requestId, currentUserId) {
  const request = await FriendRequest.findById(requestId);
  if (!request || request.status !== "pending") {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Pending friend request not found");
  }

  // Verify the recipient is the one accepting
  if (request.receiver.toString() !== currentUserId.toString()) {
    throw ApiError.from(ErrorCodes.FORBIDDEN, "You cannot accept a friend request sent to someone else");
  }

  const receiverUser = await User.findById(currentUserId);
  const pair = orderedPair(request.sender, request.receiver);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create the friendship
    const friendshipArray = await Friendship.create([pair], { session });
    const friendship = friendshipArray[0];

    // 2. Delete the request
    await FriendRequest.deleteOne({ _id: requestId }).session(session);

    // 3. Notify the sender
    await createNotification(
      {
        user: request.sender,
        type: "friend_accepted",
        title: `${receiverUser.name} accepted your friend request`,
        message: "You can now send and receive money.",
        relatedModel: "Friendship",
        relatedId: friendship._id,
      },
      { session }
    );

    await session.commitTransaction();
    return friendship;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Reject a friend request.
 *
 * Updates status to "rejected" and sets rejectedAt.
 * Triggering the TTL index to auto-delete after 30 days.
 *
 * @param {string} requestId - ID of the request to reject
 * @param {string} currentUserId - ID of the receiver rejecting the request
 * @returns {Promise<Object>} Updated FriendRequest document
 */
export async function rejectFriendRequest(requestId, currentUserId) {
  const request = await FriendRequest.findOne({ _id: requestId, status: "pending" });
  if (!request) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Pending friend request not found");
  }

  if (request.receiver.toString() !== currentUserId.toString()) {
    throw ApiError.from(ErrorCodes.FORBIDDEN, "You cannot reject a friend request sent to someone else");
  }

  request.status = "rejected";
  request.rejectedAt = new Date();
  await request.save();

  return request;
}

/**
 * Cancel an outgoing friend request.
 *
 * Sender changes mind and cancels the request. Deletes the request from the DB.
 *
 * @param {string} requestId - ID of request to cancel
 * @param {string} currentUserId - ID of sender canceling the request
 * @returns {Promise<void>}
 */
export async function cancelFriendRequest(requestId, currentUserId) {
  const request = await FriendRequest.findOne({ _id: requestId, status: "pending" });
  if (!request) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Pending friend request not found");
  }

  if (request.sender.toString() !== currentUserId.toString()) {
    throw ApiError.from(ErrorCodes.FORBIDDEN, "You cannot cancel a request you did not send");
  }

  await FriendRequest.deleteOne({ _id: requestId });
}

/**
 * Remove an existing friendship (unfriend).
 *
 * @param {string} friendshipId - The Friendship ID to delete
 * @param {string} currentUserId - The user initiating the deletion
 * @returns {Promise<void>}
 */
export async function removeFriend(friendshipId, currentUserId) {
  const friendship = await Friendship.findById(friendshipId);
  if (!friendship) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Friendship not found");
  }

  // Ensure current user is part of the friendship
  if (
    friendship.user1.toString() !== currentUserId.toString() &&
    friendship.user2.toString() !== currentUserId.toString()
  ) {
    throw ApiError.from(ErrorCodes.FORBIDDEN, "Access denied");
  }

  await Friendship.deleteOne({ _id: friendshipId });
}

/**
 * List all active friends for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of friends with profiles
 */
export async function listFriends(userId) {
  const friendships = await Friendship.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate("user1", "name email avatar phone")
    .populate("user2", "name email avatar phone");

  return friendships.map((f) => {
    // Determine which populated field is the OTHER user
    const isUser1 = f.user1._id.toString() === userId.toString();
    const friend = isUser1 ? f.user2 : f.user1;

    return {
      friendshipId: f._id,
      friend: {
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar,
        phone: friend.phone,
      },
      createdAt: f.createdAt,
    };
  });
}

/**
 * List incoming pending friend requests.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of incoming pending requests with sender details
 */
export async function getIncomingRequests(userId) {
  return FriendRequest.find({
    receiver: userId,
    status: "pending",
  })
    .populate("sender", "name email avatar")
    .sort({ createdAt: -1 });
}

/**
 * List outgoing pending friend requests.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of outgoing pending requests with receiver details
 */
export async function getOutgoingRequests(userId) {
  return FriendRequest.find({
    sender: userId,
    status: "pending",
  })
    .populate("receiver", "name email avatar")
    .sort({ createdAt: -1 });
}
