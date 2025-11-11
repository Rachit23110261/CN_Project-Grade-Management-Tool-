import axios from "axios";

const api = axios.create({
  baseURL: "http://10.7.45.10:5000/api",
  headers: { "Content-Type": "application/json" }, // only content-type here
});

// Add JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
