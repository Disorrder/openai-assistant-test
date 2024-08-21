import axios from "axios";
import { useAuthStore } from "~/store/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const tokenStore = useAuthStore.getState();
  const token = tokenStore.accessToken;

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(null, (error) => {
  const status = error.response?.status;
  console.log("🚀 ~ api.interceptors.response.use ~ error:", error);

  if (status === 401) {
    useAuthStore.getState().logout();
  }

  return error;
});
