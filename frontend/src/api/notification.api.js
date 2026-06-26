import api from "./axios.js";

export async function getNotifications({ page = 1, limit = 10 } = {}) {
  const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data.data;
}

export async function getUnreadCount() {
  const response = await api.get("/notifications/unread-count");
  return response.data.data.count;
}

export async function markRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data.data.notification;
}

export async function markAllRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data.data;
}
