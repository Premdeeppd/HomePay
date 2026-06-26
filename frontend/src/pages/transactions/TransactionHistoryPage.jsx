import React, { useEffect, useState } from "react";
import { FiFilter, FiInfo, FiClock, FiInbox } from "react-icons/fi";
import useTransactionStore from "../../stores/useTransactionStore.js";
import useAuthStore from "../../stores/useAuthStore.js";
import PageLayout from "../../components/layout/PageLayout.jsx";
import { formatCurrency, formatDate } from "../../utils/format.js";

/**
 * TransactionHistoryPage Component.
 *
 * Provides a clean audit log of all account transactions:
 *   - Type filters (P2P, Deposits, Spends, Funding)
 *   - Date range boundaries
 *   - Paginated ledger details
 *   - Details modal showing audit trail balance snapshots
 */
export default function TransactionHistoryPage() {
  const { user } = useAuthStore();
  const { transactions, fetchHistory, pagination, isLoading } = useTransactionStore();

  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    fetchHistory({
      page,
      limit: 10,
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [fetchHistory, page, type, startDate, endDate]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterReset = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <PageLayout>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-fg-primary">Transaction History</h1>
        <p className="text-sm text-fg-secondary mt-1">Audit trail of all money movements in your accounts.</p>
      </div>

      {/* Filter panel */}
      <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-6 mb-8 text-sm">
        <div className="flex items-center gap-2 mb-4 font-bold text-fg-primary">
          <FiFilter className="w-4 h-4 text-fg-secondary" />
          <span>Filter Logs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-xs focus:outline-none focus:border-accent text-fg-primary font-medium"
            >
              <option value="">All Transactions</option>
              <option value="p2p_transfer">P2P Transfers</option>
              <option value="wallet_deposit">Wallet Deposits</option>
              <option value="wallet_spend">Wallet Expenditures</option>
              <option value="add_funds">Added Funds</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-xs focus:outline-none focus:border-accent text-fg-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-fg-secondary uppercase tracking-wider mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-bg-primary border border-border-light rounded-sm text-xs focus:outline-none focus:border-accent text-fg-primary font-medium"
            />
          </div>
        </div>

        {(type || startDate || endDate) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleFilterReset}
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Listing */}
      <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 min-h-[350px]">
        {isLoading && transactions.length === 0 ? (
          <p className="text-xs text-fg-secondary font-medium">Loading ledger...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-fg-tertiary flex flex-col items-center gap-2">
            <FiInbox className="w-10 h-10" />
            <p className="text-xs font-semibold">No transactions matched your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {transactions.map((txn) => {
              const isDebit = txn.sender?._id === user?._id;
              const isAddFunds = txn.type === "add_funds";
              return (
                <div
                  key={txn._id}
                  onClick={() => setSelectedTxn(txn)}
                  className="py-4 flex justify-between items-center hover:bg-bg-secondary px-3 -mx-3 cursor-pointer transition-colors rounded-sm"
                >
                  <div className="flex items-center gap-4">
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
                      <p className="text-xs font-bold text-fg-primary leading-tight">
                        {isAddFunds
                          ? "Simulated Deposit"
                          : isDebit
                            ? `Paid to ${txn.receiver?.name || (txn.wallet ? txn.wallet.name : "Merchant")}`
                            : `Received from ${txn.sender?.name}`}
                      </p>
                      <p className="text-[10px] text-fg-secondary mt-1 font-medium">{txn.description}</p>
                      <span className="text-[9px] font-semibold text-fg-tertiary uppercase tracking-wider bg-bg-tertiary px-1.5 py-0.5 rounded-sm mt-2 inline-block">
                        {txn.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-bold ${
                      isAddFunds || !isDebit ? "text-emerald-700" : "text-accent"
                    }`}>
                      {isAddFunds || !isDebit ? "+" : "-"}{formatCurrency(txn.amount)}
                    </p>
                    <span className="text-[9px] text-fg-tertiary mt-1 block font-medium">
                      {formatDate(txn.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center pt-6 border-t border-border-light mt-6 text-xs font-semibold">
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 border border-border-medium hover:bg-bg-tertiary rounded-sm disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-fg-secondary font-medium">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 border border-border-medium hover:bg-bg-tertiary rounded-sm disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[420px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary border-b border-border-light pb-4 mb-4">
              Transaction Details
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
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
