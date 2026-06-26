import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiBriefcase, FiArrowRight, FiInfo } from "react-icons/fi";
import useWalletStore from "../../stores/useWalletStore.js";
import PageLayout from "../../components/layout/PageLayout.jsx";
import { formatCurrency } from "../../utils/format.js";
import toast from "react-hot-toast";

/**
 * WalletsPage Component.
 *
 * Lists all group wallets in a clean card design.
 * Provides a trigger to create a new shared wallet.
 */
export default function WalletsPage() {
  const { wallets, fetchWallets, createWallet, isLoading } = useWalletStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a wallet name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWallet({ name, description });
      toast.success("Shared Wallet created successfully!");
      setIsCreateOpen(false);
      setName("");
      setDescription("");
    } catch (err) {
      toast.error(err.message || "Failed to create wallet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      {/* Title */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary">Shared Wallets</h1>
          <p className="text-sm text-fg-secondary mt-1">Pool resources together with family and track group spending.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Group Wallet</span>
        </button>
      </div>

      {/* Wallet Listings */}
      <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 min-h-[350px]">
        {isLoading && wallets.length === 0 ? (
          <p className="text-xs text-fg-secondary font-medium">Loading wallets...</p>
        ) : wallets.length === 0 ? (
          <div className="text-center py-16 text-fg-tertiary flex flex-col items-center gap-2">
            <FiBriefcase className="w-10 h-10" />
            <p className="text-xs font-semibold">You do not belong to any shared wallets yet</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              Create one now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map(({ wallet, role, joinedAt }) => (
              <div
                key={wallet._id}
                className="p-6 border border-border-light rounded-sm flex flex-col justify-between hover:border-border-medium hover:shadow-subtle transition-all bg-bg-primary"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-fg-primary tracking-tight leading-tight">{wallet.name}</h3>
                    <span className="text-[9px] font-semibold text-fg-secondary uppercase tracking-wider bg-bg-tertiary px-1.5 py-0.5 rounded-sm">
                      {role}
                    </span>
                  </div>
                  <p className="text-xs text-fg-secondary line-clamp-2 mt-1 leading-normal font-medium">
                    {wallet.description || "No description provided."}
                  </p>
                  
                  <div className="mt-4 border-t border-border-light pt-3 flex flex-col gap-1.5 text-[10px] text-fg-tertiary font-medium">
                    <p>Owner: <span className="text-fg-secondary font-semibold">{wallet.owner?.name}</span></p>
                    <p>Joined: <span className="text-fg-secondary font-semibold">{new Date(joinedAt).toLocaleDateString()}</span></p>
                  </div>
                </div>

                <div className="mt-6 border-t border-border-light pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[9px] font-semibold text-fg-tertiary uppercase tracking-wider block">Balance</span>
                    <span className="text-base font-bold text-fg-primary">{formatCurrency(wallet.balance)}</span>
                  </div>
                  <Link
                    to={`/wallets/${wallet._id}`}
                    className="p-2 bg-bg-tertiary hover:bg-border-medium text-fg-primary hover:text-accent rounded-sm transition-colors"
                    title="Open Wallet Details"
                  >
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Wallet Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary mb-6">Create Shared Wallet</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Wallet Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="e.g. Kumar Family, House Rent"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="Shared household expenditures"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-border-medium rounded-sm text-xs font-semibold hover:bg-bg-tertiary transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
