import api from "./axios.js";

export async function sendFriendRequest({ receiverId, message }) {
  const response = await api.post("/friends/request", { receiverId, message });
  return response.data.data;
}

export async function acceptRequest(requestId) {
  const response = await api.patch(`/friends/request/${requestId}/accept`);
  return response.data.data;
}

export async function rejectRequest(requestId) {
  const response = await api.patch(`/friends/request/${requestId}/reject`);
  return response.data.data;
}

export async function cancelRequest(requestId) {
  const response = await api.delete(`/friends/request/${requestId}/cancel`);
  return response.data.data;
}

export async function listFriends() {
  const response = await api.get("/friends/list");
  return response.data.data.friends;
}

export async function getIncomingRequests() {
  const response = await api.get("/friends/requests/incoming");
  return response.data.data.requests;
}

export async function getOutgoingRequests() {
  const response = await api.get("/friends/requests/outgoing");
  return response.data.data.requests;
}

export async function removeFriend(friendshipId) {
  const response = await api.delete(`/friends/${friendshipId}`);
  return response.data.data;
}
