import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";

const TOKEN_KEY = "access_token";
const CUSTOMER_ID_KEY = "customer_id";
const CUSTOMER_NAME_KEY = "customer_name";

async function setItem(key, value) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function loginCustomer(customerId, password) {
  const response = await client.post("/auth/login", {
    customer_id: customerId,
    password,
  });

  const data = response.data;

  await setItem(TOKEN_KEY, data.access_token);
  await setItem(CUSTOMER_ID_KEY, data.customer_id);
  await setItem(CUSTOMER_NAME_KEY, data.customer_name);

  return data;
}

export async function getStoredCustomer() {
  const token = await getItem(TOKEN_KEY);
  const customerId = await getItem(CUSTOMER_ID_KEY);
  const customerName = await getItem(CUSTOMER_NAME_KEY);

  if (!token || !customerId) return null;

  return {
    token,
    customer_id: customerId,
    customer_name: customerName,
  };
}

export async function logoutCustomer() {
  await deleteItem(TOKEN_KEY);
  await deleteItem(CUSTOMER_ID_KEY);
  await deleteItem(CUSTOMER_NAME_KEY);
}