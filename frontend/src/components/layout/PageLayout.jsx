import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiBell, FiLogOut, FiUser, FiMenu, FiX, FiCheck, FiInbox } from "react-icons/fi";
import useAuthStore from "../../stores/useAuthStore.js";
import useNotificationStore from "../../stores/useNotificationStore.js";
import { formatCurrency } from "../../utils/format.js";
import toast from "react-hot-toast";

/**
 * PageLayout Component.
 *
 * Provides a clean, calm, and professional dashboard layout.
 * Conforming exactly to the design system:
 *   - Max width container around 1200px
 *   - Foreground & background colors mapped to theme variables
 *   - Generous spacing, clean borders, subtle drop shadows
 *   - Professional bell notification panel with mark-all-read action
 */
export default function PageLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Poll unread count on page render and every 30 seconds
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      await fetchNotifications(1);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Friends", path: "/friends" },
    { name: "Shared Wallets", path: "/wallets" },
    { name: "History", path: "/transactions" },
  ];

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkOneRead = async (notifId, e) => {
    e.stopPropagation();
    try {
      await markAsRead(notifId);
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-secondary text-fg-primary">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-bg-primary border-b border-border-light shadow-subtle">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-accent flex items-center gap-2">
              <span>HomePay</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors py-2 border-b-2 ${
                      isActive
                        ? "border-accent text-fg-primary"
                        : "border-transparent text-fg-secondary hover:text-fg-primary"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile, notifications, logout */}
          <div className="hidden md:flex items-center gap-6">
            {/* User card */}
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name || "HP"}`}
                alt="Avatar"
                className="w-8 h-8 rounded-sm bg-bg-tertiary object-cover border border-border-light"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-fg-primary leading-none">{user?.name}</p>
                <p className="text-[10px] text-fg-secondary font-medium mt-0.5">
                  Balance: <span className="font-semibold text-fg-primary">{formatCurrency(user?.balance)}</span>
                </p>
              </div>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={handleNotifClick}
                className="p-2 text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary rounded-sm transition-colors relative"
                aria-label="Notifications"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-bg-primary border border-border-medium rounded-sm shadow-subtle z-50 text-sm">
                  <div className="p-4 border-b border-border-light flex items-center justify-between font-semibold">
                    <span>Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border-light">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-fg-tertiary flex flex-col items-center gap-2">
                        <FiInbox className="w-8 h-8" />
                        <p className="text-xs">Your inbox is empty</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 transition-colors hover:bg-bg-secondary flex gap-3 items-start ${
                            !notif.isRead ? "bg-accent-subtle/30" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-fg-primary text-xs leading-normal">{notif.title}</p>
                            {notif.message && <p className="text-[11px] text-fg-secondary mt-1">{notif.message}</p>}
                            <span className="text-[9px] text-fg-tertiary block mt-2">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkOneRead(notif._id, e)}
                              className="p-1 text-fg-tertiary hover:text-accent rounded-sm hover:bg-bg-tertiary transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-fg-secondary hover:text-accent hover:bg-accent-subtle rounded-sm transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-4">
            {/* Notification bell mobile */}
            <div className="relative">
              <button
                onClick={handleNotifClick}
                className="p-2 text-fg-secondary hover:text-fg-primary rounded-sm transition-colors relative"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-fg-secondary hover:text-fg-primary"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-light bg-bg-primary px-6 py-4 flex flex-col gap-4 text-sm font-medium">
            {/* User Info Mobile */}
            <div className="flex items-center gap-3 pb-4 border-b border-border-light">
              <img
                src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name || "HP"}`}
                alt="Avatar"
                className="w-10 h-10 rounded-sm bg-bg-tertiary object-cover border border-border-light"
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-fg-primary">{user?.name}</p>
                <p className="text-xs text-fg-secondary font-semibold mt-0.5">
                  Balance: {formatCurrency(user?.balance)}
                </p>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 hover:text-accent transition-colors ${
                  location.pathname === link.path ? "text-accent font-semibold" : "text-fg-secondary"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 text-fg-secondary hover:text-accent font-semibold border-t border-border-light mt-2"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-light bg-bg-primary py-6 text-center text-xs text-fg-tertiary font-medium">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} HomePay. Calm and professional P2P Shared Wallets.</p>
          <div className="flex gap-4">
            <span className="hover:text-fg-secondary cursor-pointer">Security Policy</span>
            <span className="hover:text-fg-secondary cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
