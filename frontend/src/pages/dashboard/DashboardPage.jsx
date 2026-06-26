import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiArrowUpRight, FiUsers, FiBriefcase, FiArrowRight, FiInfo } from "react-icons/fi";
import useAuthStore from "../../stores/useAuthStore.js";
import useTransactionStore from "../../stores/useTransactionStore.js";
import useWalletStore from "../../stores/useWalletStore.js";
import useFriendStore from "../../stores/useFriendStore.js";
import PageLayout from "../../components/layout/PageLayout.jsx";
import { formatCurrency, formatDate } from "../../utils/format.js";
import * as userApi from "../../api/user.api.js";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, fetchProfile } = useAuthStore();
  const { transactions, fetchHistory, sendMoney } = useTransactionStore();
  const { wallets, fetchWallets, createWallet } = useWalletStore();
  const { friends, fetchFriends } = useFriendStore();

  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");

  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [sendReceiverId, setSendReceiverId] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendDescription, setSendDescription] = useState("");

  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletDesc, setWalletDesc] = useState("");

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch all dashboard data concurrently
    fetchHistory({ page: 1, limit: 5 });
    fetchWallets();
    fetchFriends();
  }, [fetchHistory, fetchWallets, fetchFriends]);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(addAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.addFunds({ amount: parsedAmount, description: addDescription || "Simulated Deposit" });
      await fetchProfile();
      await fetchHistory({ page: 1, limit: 5 });
      toast.success(`Deposited ${formatCurrency(parsedAmount)} successfully!`);
      setIsAddFundsOpen(false);
      setAddAmount("");
      setAddDescription("");
    } catch (err) {
      toast.error(err.message || "Failed to add funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(sendAmount);
    if (!sendReceiverId) {
      toast.error("Please select a friend");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendMoney({ receiverId: sendReceiverId, amount: parsedAmount, description: sendDescription });
      await fetchHistory({ page: 1, limit: 5 });
      toast.success("Transfer completed successfully!");
      setIsSendMoneyOpen(false);
      setSendReceiverId("");
      setSendAmount("");
      setSendDescription("");
    } catch (err) {
      toast.error(err.message || "Failed to transfer money");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) {
      toast.error("Please enter a wallet name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWallet({ name: walletName, description: walletDesc });
      toast.success("Shared Wallet created successfully!");
      setIsCreateWalletOpen(false);
      setWalletName("");
      setWalletDesc("");
    } catch (err) {
      toast.error(err.message || "Failed to create shared wallet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      {/* Welcome Banner */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary">Welcome back, {user?.name}</h1>
          <p className="text-sm text-fg-secondary mt-1">Here is your financial status overview.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSendMoneyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer"
          >
            <FiArrowUpRight className="w-4 h-4" />
            <span>Send Money</span>
          </button>
          <button
            onClick={() => setIsCreateWalletOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-primary hover:bg-bg-tertiary text-fg-primary border border-border-medium text-xs font-semibold rounded-sm transition-colors cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Wallet</span>
          </button>
        </div>
      </div>

      {/* Grid: Balance Card & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Balance Card */}
        <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 flex flex-col justify-between min-h-[180px]">
          <div>
            <span className="text-[10px] font-semibold text-fg-secondary uppercase tracking-wider">Personal Balance</span>
            <h2 className="text-3xl font-bold tracking-tight text-fg-primary mt-2">
              {formatCurrency(user?.balance)}
            </h2>
          </div>
          <button
            onClick={() => setIsAddFundsOpen(true)}
            className="mt-6 w-full py-2 bg-bg-tertiary hover:bg-border-medium text-fg-primary text-xs font-semibold rounded-sm transition-colors cursor-pointer text-center"
          >
            Simulate Add Funds
          </button>
        </div>

        {/* Wallets Quick Stat */}
        <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 flex flex-col justify-between min-h-[180px]">
          <div>
            <span className="text-[10px] font-semibold text-fg-secondary uppercase tracking-wider">Shared Wallets</span>
            <h2 className="text-3xl font-bold tracking-tight text-fg-primary mt-2">
              {wallets.length}
            </h2>
          </div>
          <Link
            to="/wallets"
            className="mt-6 text-xs font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            <span>Manage group wallets</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Friends Quick Stat */}
        <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 flex flex-col justify-between min-h-[180px]">
          <div>
            <span className="text-[10px] font-semibold text-fg-secondary uppercase tracking-wider">Connected Friends</span>
            <h2 className="text-3xl font-bold tracking-tight text-fg-primary mt-2">
              {friends.length}
            </h2>
          </div>
          <Link
            to="/friends"
            className="mt-6 text-xs font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            <span>Add or manage friends</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Layout Grid: Recent Transactions vs Shared Wallets List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Transactions */}
        <div className="lg:col-span-2 bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-fg-primary">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
              View All
            </Link>
          </div>

          <div className="divide-y divide-border-light">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-fg-tertiary font-medium">No transactions found.</p>
            ) : (
              transactions.map((txn) => {
                const isDebit = txn.sender?._id === user?._id;
                const isAddFunds = txn.type === "add_funds";
                return (
                  <div
                    key={txn._id}
                    onClick={() => setSelectedTxn(txn)}
                    className="py-4 flex justify-between items-center hover:bg-bg-secondary px-3 -mx-3 cursor-pointer transition-colors rounded-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        isAddFunds
                          ? "bg-emerald-50 text-emerald-700"
                          : isDebit
                            ? "bg-accent-subtle text-accent"
                            : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isAddFunds ? "F" : isDebit ? "S" : "R"}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-fg-primary">
                          {isAddFunds
                            ? "Simulated Deposit"
                            : isDebit
                              ? `Paid to ${txn.receiver?.name || (txn.wallet ? txn.wallet.name : "Merchant")}`
                              : `Received from ${txn.sender?.name}`}
                        </p>
                        <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{txn.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${
                        isAddFunds || !isDebit ? "text-emerald-700" : "text-accent"
                      }`}>
                        {isAddFunds || !isDebit ? "+" : "-"}{formatCurrency(txn.amount)}
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
        </div>

        {/* Right Column: Shared Wallets Preview */}
        <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-fg-primary">Group Wallets</h3>
            <Link to="/wallets" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
              Manage
            </Link>
          </div>

          <div className="space-y-4">
            {wallets.length === 0 ? (
              <div className="text-center py-8 text-xs text-fg-tertiary border border-dashed border-border-medium rounded-sm p-4">
                <p className="font-medium">No shared wallets yet</p>
                <button
                  onClick={() => setIsCreateWalletOpen(true)}
                  className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              wallets.map(({ wallet, role }) => (
                <Link
                  key={wallet._id}
                  to={`/wallets/${wallet._id}`}
                  className="block p-4 border border-border-light hover:border-border-medium hover:bg-bg-secondary rounded-sm transition-all"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-fg-primary tracking-tight">{wallet.name}</h4>
                    <span className="text-[9px] font-semibold text-fg-secondary uppercase tracking-wider bg-bg-tertiary px-1.5 py-0.5 rounded-sm">
                      {role}
                    </span>
                  </div>
                  <p className="text-[10px] text-fg-secondary mt-1 line-clamp-1 font-medium">{wallet.description}</p>
                  <p className="text-sm font-bold text-fg-primary mt-3">{formatCurrency(wallet.balance)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Add Funds */}
      {isAddFundsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans">
            <h3 className="text-base font-bold text-fg-primary mb-6">Add Funds (Simulation)</h3>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="500.00"
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
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="ATM Cash Deposit"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddFundsOpen(false)}
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

      {/* Modal 2: Send Money */}
      {isSendMoneyOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans">
            <h3 className="text-base font-bold text-fg-primary mb-6">Send Money to Friend</h3>
            <form onSubmit={handleSendMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Select Friend
                </label>
                <select
                  value={sendReceiverId}
                  onChange={(e) => setSendReceiverId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Choose Friend --</option>
                  {friends.map(({ friendshipId, friend }) => (
                    <option key={friendshipId} value={friend._id}>
                      {friend.name} ({friend.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="250.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Memo / Note
                </label>
                <input
                  type="text"
                  value={sendDescription}
                  onChange={(e) => setSendDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="Dinner share"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSendMoneyOpen(false)}
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
                  {isSubmitting ? "Sending..." : "Send Money"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Wallet */}
      {isCreateWalletOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans">
            <h3 className="text-base font-bold text-fg-primary mb-6">Create Shared Wallet</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  Wallet Name
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
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
                  value={walletDesc}
                  onChange={(e) => setWalletDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                  placeholder="Shared household expenditures"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateWalletOpen(false)}
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

      {/* Modal 4: Transaction Detail */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[420px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary border-b border-border-light pb-4 mb-4">
              Transaction Receipt
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
                <span className="text-fg-secondary font-medium">Sender</span>
                <span className="font-medium text-fg-primary">{selectedTxn.sender?.name}</span>
              </div>
              {selectedTxn.receiver && (
                <div className="flex justify-between py-1">
                  <span className="text-fg-secondary font-medium">Receiver</span>
                  <span className="font-medium text-fg-primary">{selectedTxn.receiver?.name}</span>
                </div>
              )}
              {selectedTxn.wallet && (
                <div className="flex justify-between py-1">
                  <span className="text-fg-secondary font-medium">Group Wallet</span>
                  <span className="font-medium text-fg-primary">{selectedTxn.wallet?.name}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <FiInfo className="w-3.5 h-3.5" />
                  <span>Success</span>
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-fg-secondary font-medium">Timestamp</span>
                <span className="font-medium text-fg-primary">{formatDate(selectedTxn.createdAt)}</span>
              </div>
              <div className="pt-2 border-t border-border-light">
                <p className="text-xs font-semibold text-fg-secondary mb-1">Description / Notes</p>
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
                        <span>Sender Bal:</span>
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
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
