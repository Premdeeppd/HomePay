import api from "./axios.js";

export async function getProfile() {
  const response = await api.get("/users/profile");
  return response.data.data;
}

export async function updateProfile(profileData) {
  const response = await api.patch("/users/profile", profileData);
  return response.data.data;
}

export async function searchUsers(query) {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data.data.users;
}

export async function getBalance() {
  const response = await api.get("/users/balance");
  return response.data.data.balance;
}

export async function addFunds({ amount, description }) {
  const response = await api.post("/users/add-funds", { amount, description });
  return response.data.data;
}
