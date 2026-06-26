import Notification from "../../models/Notification.model.js";
import ApiError from "../../errors/apiError.js";
import { ErrorCodes } from "../../errors/errorCodes.js";

/**
 * Retrieve notifications for the current user, paginated.
 *
 * @param {string} userId - User ID
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{notifications: Array, total: number, page: number, totalPages: number}>}
 */
export async function getNotifications(userId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ user: userId });

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get the count of unread notifications for a user.
 * Used for badge polling on the frontend.
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}

/**
 * Mark a single notification as read.
 *
 * @param {string} notificationId - Notification ID
 * @param {string} userId - Logged in user ID (for authorization)
 * @returns {Promise<Object>} Updated notification document
 */
export async function markAsRead(notificationId, userId) {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw ApiError.from(ErrorCodes.NOT_FOUND, "Notification not found");
  }

  // Authorize: notification must belong to current user
  if (notification.user.toString() !== userId.toString()) {
    throw ApiError.from(ErrorCodes.FORBIDDEN, "Access denied");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
}

/**
 * Mark all unread notifications as read.
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function markAllAsRead(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
}
