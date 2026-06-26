import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore.js";

/**
 * Route protection wrapper.
 *
 * Checks Zustand auth state:
 *   - If authentication is booting (isLoading = true), displays a loading screen.
 *   - If authenticated, renders child routes (via Outlet).
 *   - If not authenticated, redirects to `/login`.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
          <p className="font-sans text-sm text-slate-400">Securing your session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
