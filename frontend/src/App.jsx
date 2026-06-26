import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import useAuthStore from "./stores/useAuthStore.js";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import AuthRoute from "./components/layout/AuthRoute.jsx";

// Page Components
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import FriendsPage from "./pages/friends/FriendsPage.jsx";
import WalletsPage from "./pages/wallet/WalletsPage.jsx";
import WalletDetailPage from "./pages/wallet/WalletDetailPage.jsx";
import TransactionHistoryPage from "./pages/transactions/TransactionHistoryPage.jsx";

import "./app.css";

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check if the user has an active session cookie on boot (silent session refresh)
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      {/* Centralized toaster notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #334155",
            fontFamily: "sans-serif",
          },
        }}
      />
      <Routes>
        {/* Guest Only Routes (Login, Register) */}
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Member Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/wallets/:walletId" element={<WalletDetailPage />} />
          <Route path="/transactions" element={<TransactionHistoryPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
