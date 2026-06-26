import ApiResponse from "../../responses/apiResponse.js";
import * as friendService from "./friend.service.js";

export async function sendRequest(req, res) {
  const senderId = req.user.userId;
  const { receiverId, message } = req.body;

  const friendRequest = await friendService.sendFriendRequest(senderId, receiverId, message);

  return res
    .status(201)
    .json(new ApiResponse(201, "Friend request sent successfully", { friendRequest }));
}

export async function acceptRequest(req, res) {
  const currentUserId = req.user.userId;
  const { requestId } = req.params;

  const friendship = await friendService.acceptFriendRequest(requestId, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request accepted successfully", { friendship }));
}

export async function rejectRequest(req, res) {
  const currentUserId = req.user.userId;
  const { requestId } = req.params;

  const request = await friendService.rejectFriendRequest(requestId, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request rejected successfully", { friendRequest: request }));
}

export async function cancelRequest(req, res) {
  const currentUserId = req.user.userId;
  const { requestId } = req.params;

  await friendService.cancelFriendRequest(requestId, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request canceled successfully"));
}

export async function removeFriend(req, res) {
  const currentUserId = req.user.userId;
  const { friendshipId } = req.params;

  await friendService.removeFriend(friendshipId, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Friend removed successfully"));
}

export async function listFriends(req, res) {
  const userId = req.user.userId;
  const friends = await friendService.listFriends(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Friends list retrieved successfully", { friends }));
}

export async function incomingRequests(req, res) {
  const userId = req.user.userId;
  const requests = await friendService.getIncomingRequests(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Incoming friend requests retrieved", { requests }));
}

export async function outgoingRequests(req, res) {
  const userId = req.user.userId;
  const requests = await friendService.getOutgoingRequests(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Outgoing friend requests retrieved", { requests }));
}
