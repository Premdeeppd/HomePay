import { create } from "zustand";
import * as notificationApi from "../api/notification.api.js";

/**
 * Zustand Notification Store
 *
 * Manages notification center states and badge counts.
 */
const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const data = await notificationApi.getNotifications({ page, limit: 10 });
      set({
        notifications: data.notifications,
        pagination: {
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error("Failed to fetch unread notifications count:", error);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationApi.markRead(notificationId);
      // Decr unread count locally for instant UI response
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        ),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllRead();
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date(),
        })),
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },
}));

export default useNotificationStore;
