import { create } from "zustand";
import * as transactionApi from "../api/transaction.api.js";
import useAuthStore from "./useAuthStore.js";

/**
 * Zustand Transaction Store
 *
 * Manages transfer records, filtering pipelines, and balance snaps.
 */
const useTransactionStore = create((set, get) => ({
  transactions: [],
  currentTransaction: null,
  isLoading: false,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },

  fetchHistory: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const data = await transactionApi.getHistory(filters);
      set({
        transactions: data.transactions,
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

  fetchHistoryWithUser: async (userId, page = 1) => {
    set({ isLoading: true });
    try {
      const data = await transactionApi.getHistoryWithUser(userId, { page, limit: 10 });
      set({
        transactions: data.transactions,
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

  sendMoney: async ({ receiverId, amount, description }) => {
    set({ isLoading: true });
    try {
      const transaction = await transactionApi.sendMoney({ receiverId, amount, description });
      // Always refresh personal balance in auth store after sending money
      await useAuthStore.getState().fetchProfile();
      set({ isLoading: false });
      return transaction;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTransactionDetail: async (transactionId) => {
    set({ isLoading: true });
    try {
      const transaction = await transactionApi.getTransactionDetail(transactionId);
      set({ currentTransaction: transaction, isLoading: false });
    } catch (error) {
      set({ isLoading: false, currentTransaction: null });
      throw error;
    }
  },

  clearCurrentTransaction: () => set({ currentTransaction: null }),
}));

export default useTransactionStore;
