import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore.js";
import toast from "react-hot-toast";

/**
 * RegisterPage.
 *
 * Professional register form using the design system.
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        phone: phone.trim() === "" ? null : phone.trim(),
      });
      toast.success("Account created successfully! Welcome to HomePay.");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to create account. Please check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-6 py-12 text-fg-primary font-sans">
      <div className="w-full max-w-[420px] bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-accent inline-block">
            HomePay
          </Link>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-fg-primary">Create your account</h2>
          <p className="mt-2 text-sm text-fg-secondary">Join wallets and manage family spendings</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
              placeholder="Prem Kumar"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Email Address *
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
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Phone Number (10 digits)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
              placeholder="Min 8 chars, 1 capital letter, 1 number"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-border-light pt-6">
          <p className="text-xs text-fg-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
