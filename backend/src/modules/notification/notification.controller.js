import ApiResponse from "../../responses/apiResponse.js";
import * as notificationService from "./notification.service.js";

export async function list(req, res) {
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await notificationService.getNotifications(userId, { page, limit });

  return res
    .status(200)
    .json(new ApiResponse(200, "Notifications retrieved successfully", result));
}

export async function unreadCount(req, res) {
  const userId = req.user.userId;
  const count = await notificationService.getUnreadCount(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Unread count retrieved successfully", { count }));
}

export async function read(req, res) {
  const userId = req.user.userId;
  const { notificationId } = req.params;

  const notification = await notificationService.markAsRead(notificationId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Notification marked as read", { notification }));
}

export async function readAll(req, res) {
  const userId = req.user.userId;

  await notificationService.markAllAsRead(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "All notifications marked as read"));
}
