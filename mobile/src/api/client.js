import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:8000/api/v1";

async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("access_token");
  }

  return await SecureStore.getItemAsync("access_token");
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default client;