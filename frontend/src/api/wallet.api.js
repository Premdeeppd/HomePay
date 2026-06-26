import api from "./axios.js";

export async function createWallet({ name, description }) {
  const response = await api.post("/wallets", { name, description });
  return response.data.data.wallet;
}

export async function listWallets() {
  const response = await api.get("/wallets");
  return response.data.data.wallets;
}

export async function getWalletDetails(walletId) {
  const response = await api.get(`/wallets/${walletId}`);
  return response.data.data;
}

export async function addWalletMember(walletId, userId) {
  const response = await api.post(`/wallets/${walletId}/members`, { userId });
  return response.data.data.member;
}

export async function removeWalletMember(walletId, userId) {
  const response = await api.delete(`/wallets/${walletId}/members/${userId}`);
  return response.data.data;
}

export async function depositToWallet(walletId, amount) {
  const response = await api.post(`/wallets/${walletId}/deposit`, { amount });
  return response.data.data.transaction;
}

export async function spendFromWallet(walletId, { amount, receiverId, description }) {
  const response = await api.post(`/wallets/${walletId}/spend`, { amount, receiverId, description });
  return response.data.data.transaction;
}

export async function getWalletTransactions(walletId, { page = 1, limit = 10 } = {}) {
  const response = await api.get(`/wallets/${walletId}/transactions?page=${page}&limit=${limit}`);
  return response.data.data;
}
