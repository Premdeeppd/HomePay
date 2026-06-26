import api from "./axios.js";

export async function sendMoney({ receiverId, amount, description }) {
  const response = await api.post("/transactions/send", { receiverId, amount, description });
  return response.data.data;
}

export async function getHistory({ page = 1, limit = 10, type = "", startDate = "", endDate = "" } = {}) {
  let url = `/transactions/history?page=${page}&limit=${limit}`;
  if (type) url += `&type=${type}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  
  const response = await api.get(url);
  return response.data.data;
}

export async function getHistoryWithUser(userId, { page = 1, limit = 10 } = {}) {
  const response = await api.get(`/transactions/history/user/${userId}?page=${page}&limit=${limit}`);
  return response.data.data;
}

export async function getTransactionDetail(transactionId) {
  const response = await api.get(`/transactions/${transactionId}`);
  return response.data.data.transaction;
}
