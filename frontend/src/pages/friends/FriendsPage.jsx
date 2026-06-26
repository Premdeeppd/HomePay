import React, { useEffect, useState } from "react";
import { FiSearch, FiUserPlus, FiUserCheck, FiUserMinus, FiClock, FiCheck, FiX, FiSend, FiInbox } from "react-icons/fi";
import useFriendStore from "../../stores/useFriendStore.js";
import PageLayout from "../../components/layout/PageLayout.jsx";
import useTransactionStore from "../../stores/useTransactionStore.js";
import toast from "react-hot-toast";

/**
 * FriendsPage Component.
 *
 * Implements a calm, professional Tab layout:
 *   Tab 1: My Friends (List with Send Money / Unfriend actions)
 *   Tab 2: Requests (Incoming Accept/Reject & Outgoing Sent indicators)
 *   Tab 3: Add Friend (Debounced text search queries)
 */
export default function FriendsPage() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    isLoading,
    fetchFriends,
    fetchRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsers,
    clearSearch,
  } = useFriendStore();

  const { sendMoney } = useTransactionStore();

  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendDescription, setSendDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        clearSearch();
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchUsers, clearSearch]);

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId, "Would like to connect to send money.");
      toast.success("Friend request sent!");
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success("Friend request accepted!");
    } catch (err) {
      toast.error(err.message || "Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      toast.success("Request rejected");
    } catch (err) {
      toast.error(err.message || "Failed to reject request");
    }
  };

  const handleCancel = async (requestId) => {
    try {
      await cancelFriendRequest(requestId);
      toast.success("Request canceled");
    } catch (err) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  const handleUnfriend = async (friendshipId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await removeFriend(friendshipId);
      toast.success("Friend removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove friend");
    }
  };

  const handleOpenSendMoney = (friend) => {
    setSelectedFriend(friend);
    setIsSendMoneyOpen(true);
  };

  const handleSendMoneySubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendMoney({
        receiverId: selectedFriend._id,
        amount,
        description: sendDescription,
      });
      toast.success(`Sent ${amount} to ${selectedFriend.name}!`);
      setIsSendMoneyOpen(false);
      setSelectedFriend(null);
      setSendAmount("");
      setSendDescription("");
    } catch (err) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine request status in search listings
  const getFriendshipStatus = (userId) => {
    const isFriend = friends.some((f) => f.friend._id === userId);
    if (isFriend) return "friends";

    const isIncoming = incomingRequests.some((r) => r.sender._id === userId);
    if (isIncoming) return "incoming";

    const isOutgoing = outgoingRequests.some((r) => r.receiver._id === userId);
    if (isOutgoing) return "outgoing";

    return "none";
  };

  return (
    <PageLayout>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-fg-primary">Friends</h1>
        <p className="text-sm text-fg-secondary mt-1">Send requests to prevent fraud and manage your transfer ledger.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light mb-8">
        {[
          { id: "friends", label: `My Friends (${friends.length})` },
          { id: "requests", label: `Requests (${incomingRequests.length + outgoingRequests.length})` },
          { id: "search", label: "Add Friend" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              clearSearch();
              setSearchQuery("");
            }}
            className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 -mb-[2px] cursor-pointer ${
              activeTab === tab.id
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-fg-secondary hover:text-fg-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle p-8 min-h-[350px]">
        {/* Tab 1: My Friends */}
        {activeTab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16 text-fg-tertiary flex flex-col items-center gap-2">
                <FiInbox className="w-10 h-10" />
                <p className="text-xs font-semibold">You haven't added any friends yet</p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
                >
                  Find friends
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {friends.map(({ friendshipId, friend, createdAt }) => (
                  <div
                    key={friendshipId}
                    className="p-4 border border-border-light rounded-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${friend.name}`}
                        alt="Avatar"
                        className="w-10 h-10 rounded-sm bg-bg-tertiary object-cover border border-border-light"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-fg-primary leading-tight">{friend.name}</p>
                        <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{friend.email}</p>
                        <span className="text-[9px] text-fg-tertiary block mt-1.5 font-semibold uppercase tracking-wider">
                          Since {new Date(createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenSendMoney(friend)}
                        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-[10px] font-bold rounded-sm transition-colors cursor-pointer"
                      >
                        Send Money
                      </button>
                      <button
                        onClick={() => handleUnfriend(friendshipId)}
                        className="p-2 border border-border-medium hover:bg-accent-subtle hover:text-accent text-fg-secondary rounded-sm transition-colors cursor-pointer"
                        title="Remove Friend"
                      >
                        <FiUserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Requests Inbox/Sent */}
        {activeTab === "requests" && (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-4">
                Incoming Invites ({incomingRequests.length})
              </h3>
              {incomingRequests.length === 0 ? (
                <p className="text-xs text-fg-tertiary py-4 font-medium italic">No incoming requests.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 border border-border-light rounded-sm flex items-center justify-between max-w-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.sender?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${req.sender?.name}`}
                          alt="Avatar"
                          className="w-8 h-8 rounded-sm bg-bg-tertiary object-cover border border-border-light"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-fg-primary leading-tight">{req.sender?.name}</p>
                          <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{req.sender?.email}</p>
                          {req.message && <p className="text-[10px] text-fg-secondary italic mt-1 font-medium bg-bg-tertiary px-2 py-0.5 rounded-sm">"{req.message}"</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req._id)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-sm transition-colors cursor-pointer"
                          title="Accept Request"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="p-2 border border-border-medium hover:bg-accent-subtle hover:text-accent text-fg-secondary rounded-sm transition-colors cursor-pointer"
                          title="Reject Request"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="pt-6 border-t border-border-light">
              <h3 className="text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-4">
                Outgoing Pending Invites ({outgoingRequests.length})
              </h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-fg-tertiary py-4 font-medium italic">No outgoing requests.</p>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 border border-border-light rounded-sm flex items-center justify-between max-w-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.receiver?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${req.receiver?.name}`}
                          alt="Avatar"
                          className="w-8 h-8 rounded-sm bg-bg-tertiary object-cover border border-border-light"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-fg-primary leading-tight">{req.receiver?.name}</p>
                          <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{req.receiver?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(req._id)}
                        className="px-3 py-1.5 border border-border-medium hover:bg-accent-subtle hover:text-accent text-fg-secondary text-[10px] font-semibold rounded-sm transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Search & Add */}
        {activeTab === "search" && (
          <div>
            <div className="max-w-md relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-light rounded-sm text-sm focus:outline-none focus:border-accent text-fg-primary font-medium"
                placeholder="Search users by name or email..."
              />
              <FiSearch className="absolute left-3.5 top-3 text-fg-secondary w-4 h-4" />
            </div>

            {/* Results */}
            <div>
              {isLoading && (
                <p className="text-xs text-fg-secondary font-medium">Searching for matches...</p>
              )}
              {!isLoading && searchQuery.trim() && searchResults.length === 0 && (
                <p className="text-xs text-fg-tertiary font-medium">No users found matching "{searchQuery}"</p>
              )}
              {!isLoading && searchResults.length > 0 && (
                <div className="divide-y divide-border-light max-w-xl">
                  {searchResults.map((user) => {
                    const status = getFriendshipStatus(user._id);
                    return (
                      <div key={user._id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`}
                            alt="Avatar"
                            className="w-8 h-8 rounded-sm bg-bg-tertiary object-cover border border-border-light"
                          />
                          <div className="text-left">
                            <p className="text-xs font-bold text-fg-primary leading-tight">{user.name}</p>
                            <p className="text-[10px] text-fg-secondary mt-0.5 font-medium">{user.email}</p>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="text-xs font-semibold">
                          {status === "friends" && (
                            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100 text-[10px]">
                              <FiUserCheck className="w-3.5 h-3.5" />
                              <span>Friends</span>
                            </span>
                          )}
                          {status === "outgoing" && (
                            <span className="flex items-center gap-1.5 text-fg-secondary bg-bg-tertiary px-2 py-1 rounded-sm border border-border-light text-[10px]">
                              <FiClock className="w-3.5 h-3.5" />
                              <span>Request Sent</span>
                            </span>
                          )}
                          {status === "incoming" && (
                            <button
                              onClick={() => {
                                const req = incomingRequests.find((r) => r.sender._id === user._id);
                                if (req) handleAccept(req._id);
                              }}
                              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Accept Invite
                            </button>
                          )}
                          {status === "none" && (
                            <button
                              onClick={() => handleSendRequest(user._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-medium hover:bg-bg-tertiary text-fg-primary rounded-sm text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              <FiUserPlus className="w-3.5 h-3.5" />
                              <span>Add Friend</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Send Money Modal */}
      {isSendMoneyOpen && selectedFriend && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-medium rounded-sm shadow-subtle max-w-[400px] w-full p-8 text-left font-sans text-sm">
            <h3 className="text-base font-bold text-fg-primary mb-6">Send Money to {selectedFriend.name}</h3>
            <form onSubmit={handleSendMoneySubmit} className="space-y-4">
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
                  onClick={() => {
                    setIsSendMoneyOpen(false);
                    setSelectedFriend(null);
                  }}
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
    </PageLayout>
  );
}
