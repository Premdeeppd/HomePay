import { create } from "zustand";
import axios from "axios";

// Base URL for initial authentication requests before our main axios instance is fully configured
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Zustand Auth Store
 *
 * Manages the user session state.
 * Stores the accessToken ONLY in memory (state). It does not persist it in
 * localStorage (which is vulnerable to XSS). Persists session using the
 * browser's native cookie storage (via httpOnly refresh cookies).
 */
const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // ── Actions ──────────────────────────────────────────────────

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
  
  setUser: (user) => set({ user }),

  // Logs out client-side state without calling the backend.
  // Useful when the refresh token expires and the backend already revoked the session.
  logoutStateOnly: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  register: async ({ name, email, password, phone }) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/register`,
        { name, email, password, phone },
        { withCredentials: true }
      );
      
      const { user, accessToken } = response.data.data;
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error.response?.data || error;
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const { user, accessToken } = response.data.data;
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error.response?.data || error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // Always clear state client-side even if backend logout fails
      get().logoutStateOnly();
    }
  },

  // Verifies if the user has an active session cookie on reload/load.
  // Performs a silent refresh to boot up the session access token.
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Silent refresh to get access token
      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken } = refreshResponse.data.data;

      // 2. Fetch profile using access token
      const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { user } = profileResponse.data.data;

      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // Safe to swallow on boot — simply means user has no active session cookie
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Updates the user state (e.g. balance, name, avatar changes)
  fetchProfile: async () => {
    const token = get().accessToken;
    if (!token) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = response.data.data;
      set({ user });
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  },
}));

export default useAuthStore;
