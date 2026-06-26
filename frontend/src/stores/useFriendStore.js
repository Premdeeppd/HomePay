import { create } from "zustand";
import * as friendApi from "../api/friend.api.js";
import * as userApi from "../api/user.api.js";

/**
 * Zustand Friend Store
 *
 * Manages relationships, request status, and friend lists.
 */
const useFriendStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  isLoading: false,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const friends = await friendApi.listFriends();
      set({ friends, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const [incoming, outgoing] = await Promise.all([
        friendApi.getIncomingRequests(),
        friendApi.getOutgoingRequests(),
      ]);
      set({
        incomingRequests: incoming,
        outgoingRequests: outgoing,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendFriendRequest: async (receiverId, message) => {
    set({ isLoading: true });
    try {
      await friendApi.sendFriendRequest({ receiverId, message });
      // Refresh requests list
      await get().fetchRequests();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  acceptFriendRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      await friendApi.acceptRequest(requestId);
      // Refresh friends list and request list
      await Promise.all([get().fetchFriends(), get().fetchRequests()]);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  rejectFriendRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      await friendApi.rejectRequest(requestId);
      // Refresh requests list
      await get().fetchRequests();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelFriendRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      await friendApi.cancelRequest(requestId);
      // Refresh requests list
      await get().fetchRequests();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeFriend: async (friendshipId) => {
    set({ isLoading: true });
    try {
      await friendApi.removeFriend(friendshipId);
      // Refresh friends list
      await get().fetchFriends();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  searchUsers: async (query) => {
    if (!query || query.trim() === "") {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const results = await userApi.searchUsers(query);
      set({ searchResults: results, isLoading: false });
    } catch (error) {
      set({ isLoading: false, searchResults: [] });
      throw error;
    }
  },

  clearSearch: () => set({ searchResults: [] }),
}));

export default useFriendStore;
