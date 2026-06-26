import ApiResponse from "../../responses/apiResponse.js";
import User from "../../models/User.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";
import * as userService from "./user.service.js";

export async function getProfile(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile retrieved successfully", { user }));
}

export async function updateProfile(req, res) {
  const { name, phone, avatar } = req.body;
  const userId = req.user.userId;

  const updatedUser = await userService.updateProfile(userId, { name, phone, avatar });

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", { user: updatedUser }));
}

export async function search(req, res) {
  const query = req.query.q || "";
  const currentUserId = req.user.userId;

  const users = await userService.searchUsers(currentUserId, query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Search results retrieved", { users }));
}

export async function getBalance(req, res) {
  const userId = req.user.userId;
  const balance = await userService.getBalance(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Balance retrieved successfully", { balance }));
}

export async function addFunds(req, res) {
  const userId = req.user.userId;
  const { amount, description } = req.body;

  const { user, transaction } = await userService.addFunds(userId, { amount, description });

  return res
    .status(200)
    .json(new ApiResponse(200, "Funds added successfully", { user, transaction }));
}
