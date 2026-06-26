import { create } from "zustand";
import * as walletApi from "../api/wallet.api.js";
import useAuthStore from "./useAuthStore.js";

/**
 * Zustand Wallet Store
 *
 * Manages shared wallets, members, deposit/spend ledger actions.
 */
const useWalletStore = create((set, get) => ({
  wallets: [],
  currentWallet: null,
  walletMembers: [],
  walletTransactions: [],
  myRole: "member",
  isLoading: false,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },

  fetchWallets: async () => {
    set({ isLoading: true });
    try {
      const wallets = await walletApi.listWallets();
      set({ wallets, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchWalletDetails: async (walletId) => {
    set({ isLoading: true });
    try {
      const data = await walletApi.getWalletDetails(walletId);
      set({
        currentWallet: data.wallet,
        myRole: data.myRole,
        walletMembers: data.members,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, currentWallet: null });
      throw error;
    }
  },

  createWallet: async ({ name, description }) => {
    set({ isLoading: true });
    try {
      const wallet = await walletApi.createWallet({ name, description });
      await get().fetchWallets();
      return wallet;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addMember: async (walletId, userId) => {
    set({ isLoading: true });
    try {
      await walletApi.addWalletMember(walletId, userId);
      // Refresh wallet members list
      await get().fetchWalletDetails(walletId);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeMember: async (walletId, userId) => {
    set({ isLoading: true });
    try {
      await walletApi.removeWalletMember(walletId, userId);
      // Refresh wallet details
      await get().fetchWalletDetails(walletId);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deposit: async (walletId, amount) => {
    set({ isLoading: true });
    try {
      await walletApi.depositToWallet(walletId, amount);
      // Refresh balance in auth store & wallet details & transactions
      await Promise.all([
        useAuthStore.getState().fetchProfile(),
        get().fetchWalletDetails(walletId),
        get().fetchWalletTransactions(walletId, 1),
      ]);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  spend: async (walletId, { amount, receiverId, description }) => {
    set({ isLoading: true });
    try {
      await walletApi.spendFromWallet(walletId, { amount, receiverId, description });
      // Refresh auth profile (if transferred to self/friend) & wallet details & transactions
      await Promise.all([
        useAuthStore.getState().fetchProfile(),
        get().fetchWalletDetails(walletId),
        get().fetchWalletTransactions(walletId, 1),
      ]);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchWalletTransactions: async (walletId, page = 1) => {
    set({ isLoading: true });
    try {
      const data = await walletApi.getWalletTransactions(walletId, { page, limit: 10 });
      set({
        walletTransactions: data.transactions,
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
}));

export default useWalletStore;
