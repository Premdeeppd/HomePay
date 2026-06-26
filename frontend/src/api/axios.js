import axios from "axios";
import useAuthStore from "../stores/useAuthStore.js";

/**
 * Axios instance configured for HomePay API.
 *
 * Key features:
 *   1. `withCredentials: true` → Allows browser to send httpOnly cookies
 *      containing the refresh token on every request, and receive cookies.
 *   2. Request Interceptor → Automatically injects the in-memory access token
 *      as the `Authorization: Bearer <token>` header.
 *   3. Response Interceptor (Silent Refresh) → If a request fails with 401
 *      and code `TOKEN_EXPIRED`, it halts execution, makes a single POST request
 *      to `/auth/refresh` to rotate tokens, saves the new access token in the
 *      Zustand store, and retries the original request.
 *   4. Concurrent Request Queueing → If 3 requests fail with 401 at the same
 *      time, only ONE refresh request is triggered. The other 2 wait in a queue
 *      and are retried once the new token is acquired.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to track token refreshing state
let isRefreshing = false;
// Queue to hold requests that failed due to expired token
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Request Interceptor ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error status is 401 (Unauthorized) and the request hasn't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const errorCode = error.response.data?.error?.code;

      // We only attempt to refresh tokens if the backend explicitly reports TOKEN_EXPIRED.
      // INVALID_TOKEN or other 401 errors represent tampered sessions and should trigger immediate logout.
      if (errorCode === "TOKEN_EXPIRED") {
        if (isRefreshing) {
          // If a refresh is already in progress, enqueue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // Mark the request as retried to avoid infinite loops if refresh fails
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call the refresh route directly using the standard axios object
          // to bypass this interceptor pipeline.
          const refreshResponse = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const { accessToken } = refreshResponse.data.data;

          // Save new token in Zustand store
          useAuthStore.getState().setAccessToken(accessToken);

          // Resolve all enqueued requests
          processQueue(null, accessToken);
          isRefreshing = false;

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails (e.g. refresh token also expired), reject the queue
          processQueue(refreshError, null);
          isRefreshing = false;

          // Force logout (clears state, redirects to login)
          useAuthStore.getState().logoutStateOnly();
          
          return Promise.reject(refreshError);
        }
      }
    }

    // Standardize client-facing error objects so frontend components
    // can write clean catch blocks: err.message, err.code, etc.
    const apiError = {
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      code: error.response?.data?.error?.code || "UNKNOWN_ERROR",
      errors: error.response?.data?.error?.errors || null,
      status: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  }
);

export default api;
