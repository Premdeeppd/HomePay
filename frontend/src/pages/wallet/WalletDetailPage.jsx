import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowDownLeft, FiArrowUpRight, FiUserPlus, FiUserMinus, FiInfo, FiClock, FiInbox } from "react-icons/fi";
import useWalletStore from "../../stores/useWalletStore.js";
import useFriendStore from "../../stores/useFriendStore.js";
import useAuthStore from "../../stores/useAuthStore.js";
import PageLayout from "../../components/layout/PageLayout.jsx";
import { formatCurrency, formatDate } from "../../utils/format.js";
import toast from "react-hot-toast";

/**
 * WalletDetailPage Component.
 *
 * Detailed view of a shared wallet:
 *   - Shared group balance
 *   - Members list (Owner can add/remove members)
 *   - Spend & Deposit buttons (Transactional)
 *   - Detailed transaction log list specific to this wallet
 */
export default function WalletDetailPage() {
  const { walletId } = useParams();
  const { user, fetchProfile } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();
  const {
    currentWallet,
    myRole,
    walletMembers,
    walletTransactions,
    fetchWalletDetails,
    fetchWalletTransactions,
    addMember,
    removeMember,
    deposit,
    spend,
    isLoading,
    pagination,
  } = useWalletStore();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendReceiverId, setSpendReceiverId] = useState("");
  const [spendDesc, setSpendDesc] = useState("");

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletDetails(walletId);
    fetchWalletTransactions(walletId, 1);
    fetchFriends();
  }, [walletId, fetchWalletDetails, fetchWalletTransactions, fetchFriends]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (user.balance < amount) {
      toast.error("Insufficient personal balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await deposit(walletId, amount);
      toast.success(`Deposited ${formatCurrency(amount)} into shared balance`);
      setIsDepositOpen(false);
      setDepositAmount("");
    } catch (err) {
      toast.error(err.message || "Deposit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpend = async (e) => {
    e.preventDefault();
    const amount = parseFloat(spendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!spendDesc.trim()) {
      toast.error("Please enter a spending description");
      return;
    }
    if (currentWallet.balance < amount) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await spend(walletId, {
        amount,
        receiverId: spendReceiverId || null,
        description: spendDesc,
      });
      toast.success(`Spent ${formatCurrency(amount)} from shared balance`);
      setIsSpendOpen(false);
      setSpendAmount("");
      setSpendReceiverId("");
      setSpendDesc("");
    } catch (err) {
      toast.error(err.message || "Spending failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!inviteUserId) {
      toast.error("Please select a friend");
      return;
    }

    setIsSubmitting(true);
    try {
      await addMember(walletId, inviteUserId);
      toast.success("Member added to shared wallet");
      setIsAddMemberOpen(false);
      setInviteUserId("");
    } catch (err) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from this wallet?`)) return;

    try {
      await removeMember(walletId, targetUserId);
      toast.success(`${targetName} removed from wallet`);
    } catch (err) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  const handlePageChange = (newPage) => {
    fetchWalletTransactions(walletId, newPage);
  };

  // Filter friends list to only show friends who are NOT already in the wallet
  const currentMemberIds = walletMembers.map((m) => m.user?._id);
  const inviteableFriends = friends.filter((f) => !currentMemberIds.includes(f.friend?._id));

  const isOwner = myRole === "owner";

  if (!currentWallet) {
    return (
      <PageLayout>
        <p className="text-center text-xs text-fg-secondary py-16 font-medium">Loading wallet details...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Back link */}
      <Link to="/wallets" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors mb-6 inline-block">
        ← Back to shared wallets
      </Link>

      {/* Hero Header */}
      <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary">{currentWallet.name}</h1>
          <p className="text-sm text-fg-secondary mt-1">{currentWallet.description}</p>
          <p className="text-[10px] text-fg-tertiary font-semibold mt-3 uppercase tracking-wider">
            Owner: <span className="text-fg-secondary">{currentWallet.owner?.name}</span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 bg-bg-secondary p-4 rounded-sm border border-border-light min-w-[200px]">
          <span className="text-[9px] font-semibold text-fg-tertiary uppercase tracking-wider block">Wallet Balance</span>
          <span className="text-2xl font-bold text-fg-primary">{formatCurrency(currentWallet.balance)}</span>
          <div className="flex gap-2 w-full mt-4">
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent hover:bg-accent-hover text-white text-[10px] font-bold rounded-sm transition-colors cursor-pointer"
            >
              <FiArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setIsSpendOpen(true)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-bg-primary hover:bg-bg-tertiary text-fg-primary border border-border-medium text-[10px] font-bold rounded-sm transition-colors cursor-pointer"
            >
              <FiArrowUpRight className="w-3.5 h-3.5" />
              <span>Spend</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Wallet Transactions */}
        <div className="lg:col-span-2 bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
          <h3 className="text-base font-bold text-fg-primary mb-6">Shared Expenditures Log</h3>

          <div className="divide-y divide-border-light">
            {walletTransactions.length === 0 ? (
              <div className="text-center py-16 text-fg-tertiary flex flex-col items-center gap-2">
                <FiInbox className="w-10 h-10" />
                <p className="text-xs font-semibold">No expenditures logged for this wallet.</p>
              </div>
            ) : (
              walletTransactions.map((txn) => {
                const isSpend = txn.type === "wallet_spend";
                return (
                  <div
                    key={txn._id}
                    onClick={() => setSelectedTxn(txn)}
                    className="py-4 flex justify-between items-center hover:bg-bg-secondary px-3 -mx-3 cursor-pointer transition-colors rounded-sm animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        isSpend ? "bg-accent-subtle text-accent" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isSpend ? "S" : "D"}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-fg-primary">
                          {isSpend
                            ? `Expenditure by ${txn.sender?.name}`
                            : `Deposit by ${txn.sender?.name}`}
                        </p>
                        <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{txn.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${isSpend ? "text-accent" : "text-emerald-700"}`}>
                        {isSpend ? "-" : "+"}{formatCurrency(txn.amount)}
                      </p>
                      <span className="text-[9px] text-fg-tertiary mt-0.5 block font-medium">
                        {formatDate(txn.createdAt, false)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-6 border-t border-border-light mt-6 text-xs font-semibold">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1.5 border border-border-medium hover:bg-bg-tertiary rounded-sm disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-fg-secondary font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1.5 border border-border-medium hover:bg-bg-tertiary rounded-sm disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Members List */}
        <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-fg-primary">Wallet Members</h3>
            {isOwner && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="p-1 text-accent hover:text-accent-hover hover:bg-accent-subtle rounded-sm transition-colors"
                title="Add Member"
              >
                <FiUserPlus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {walletMembers.map((m) => (
              <div key={m._id} className="flex justify-between items-center p-3 border border-border-light rounded-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={m.user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${m.user?.name}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-sm bg-bg-tertiary object-cover border border-border-light"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-fg-primary leading-tight">{m.user?.name}</p>
                    <span className="text-[9px] font-semibold text-fg-secondary uppercase tracking-wider bg-bg-tertiary px-1 py-0.5 rounded-sm mt-1 inline-block">
                      {m.role}
                    </span>
                  </div>
                </div>

                {isOwner && m.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(m.user?._id, m.user?.name)}
                    className="p-1 text-fg-secondary hover:text-accent hover:bg-accent-subtle rounded-sm transition-colors cursor-pointer"
                    title="Remove Member"
                  >
                    <FiUserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Deposit */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary mb-6">Deposit to Shared Wallet</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <p className="text-xs text-fg-secondary font-medium mb-3">
                  Your Personal Balance: <span className="font-semibold text-fg-primary">{formatCurrency(user.balance)}</span>
                </p>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="250.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDepositOpen(false)}
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
                  {isSubmitting ? "Depositing..." : "Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Spend */}
      {isSpendOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary mb-6">Spend from Shared Wallet</h3>
            <form onSubmit={handleSpend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="100.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Pay Friend (Optional)
                </label>
                <select
                  value={spendReceiverId}
                  onChange={(e) => setSpendReceiverId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  disabled={isSubmitting}
                >
                  <option value="">-- External Merchant / Store --</option>
                  {friends.map(({ friendshipId, friend }) => (
                    <option key={friendshipId} value={friend._id}>
                      {friend.name} ({friend.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Description / Note *
                </label>
                <input
                  type="text"
                  value={spendDesc}
                  onChange={(e) => setSpendDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="e.g. Electricity Bill, Groceries at DMart"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSpendOpen(false)}
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
                  {isSubmitting ? "Processing..." : "Complete Spend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Member */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary mb-6">Add Wallet Member</h3>
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Select Friend
                </label>
                {inviteableFriends.length === 0 ? (
                  <p className="text-xs text-fg-secondary font-medium py-2">
                    All of your friends are already members of this wallet.
                  </p>
                ) : (
                  <select
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">-- Choose Friend --</option>
                    {inviteableFriends.map(({ friendshipId, friend }) => (
                      <option key={friendshipId} value={friend._id}>
                        {friend.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 border border-border-medium rounded-sm text-xs font-semibold hover:bg-bg-tertiary transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                {inviteableFriends.length > 0 && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold transition-colors cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Inviting..." : "Invite Member"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Transaction Detail */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[420px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary border-b border-border-light pb-4 mb-4">
              Wallet Transaction Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Type</span>
                <span className="font-semibold text-fg-primary uppercase text-xs tracking-wider bg-bg-tertiary px-2 py-0.5 rounded-sm">
                  {selectedTxn.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Amount</span>
                <span className="font-bold text-fg-primary">{formatCurrency(selectedTxn.amount)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Initiator</span>
                <span className="font-medium text-fg-primary">{selectedTxn.sender?.name}</span>
              </div>
              {selectedTxn.receiver && (
                <div className="flex justify-between py-1">
                  <span className="text-fg-secondary font-medium">Paid To Friend</span>
                  <span className="font-medium text-fg-primary">{selectedTxn.receiver?.name}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Timestamp</span>
                <span className="font-medium text-fg-primary">{formatDate(selectedTxn.createdAt)}</span>
              </div>
              <div className="pt-2 border-t border-border-light">
                <p className="text-xs font-semibold text-fg-secondary mb-1">Description / Memo</p>
                <p className="text-fg-primary font-medium text-xs bg-bg-tertiary p-2 rounded-sm italic border border-border-light">
                  {selectedTxn.description || "No description provided."}
                </p>
              </div>

              {/* Balance Snapshots Audit */}
              {selectedTxn.balanceSnapshot && (
                <div className="pt-2 border-t border-border-light">
                  <p className="text-xs font-semibold text-fg-secondary mb-2">Audit Ledger Snaps (Before ➔ After)</p>
                  <div className="space-y-1.5 font-mono text-[10px] text-fg-secondary bg-bg-tertiary p-3 rounded-sm border border-border-light">
                    {selectedTxn.balanceSnapshot.senderBefore !== null && (
                      <div className="flex justify-between">
                        <span>User Bal:</span>
                        <span className="font-semibold text-fg-primary">
                          {formatCurrency(selectedTxn.balanceSnapshot.senderBefore)} ➔ {formatCurrency(selectedTxn.balanceSnapshot.senderAfter)}
                        </span>
                      </div>
                    )}
                    {selectedTxn.balanceSnapshot.receiverBefore !== null && (
                      <div className="flex justify-between">
                        <span>Receiver Bal:</span>
                        <span className="font-semibold text-fg-primary">
                          {formatCurrency(selectedTxn.balanceSnapshot.receiverBefore)} ➔ {formatCurrency(selectedTxn.balanceSnapshot.receiverAfter)}
                        </span>
                      </div>
                    )}
                    {selectedTxn.balanceSnapshot.walletBefore !== null && (
                      <div className="flex justify-between">
                        <span>Wallet Bal:</span>
                        <span className="font-semibold text-fg-primary">
                          {formatCurrency(selectedTxn.balanceSnapshot.walletBefore)} ➔ {formatCurrency(selectedTxn.balanceSnapshot.walletAfter)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-full py-2 bg-bg-tertiary hover:bg-border-medium text-fg-primary text-xs font-semibold rounded-sm transition-colors cursor-pointer text-center"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
