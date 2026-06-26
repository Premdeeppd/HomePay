import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore.js";

/**
 * Guest-only Route Wrapper.
 *
 * Prevents logged-in users from accessing login or registration pages
 * (redirects them straight to the Dashboard).
 */
const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
      </div>
    );
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default AuthRoute;
