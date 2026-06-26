import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore.js";
import toast from "react-hot-toast";

/**
 * LoginPage.
 *
 * Professional sign-in form using the red accent color,
 * clean typography, subtle rounding, and generous whitespace.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Welcome back to HomePay!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-6 py-12 text-fg-primary font-sans">
      <div className="w-full max-w-[400px] bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-accent inline-block">
            HomePay
          </Link>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-fg-primary">Sign in to your account</h2>
          <p className="mt-2 text-sm text-fg-secondary">Connect with friends and share wallets</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-border-light pt-6">
          <p className="text-xs text-fg-secondary">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
