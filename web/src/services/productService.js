import api from "../api/client";

export const getProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};

export const createProduct = async (payload) => {
  const res = await api.post("/products", payload);
  return res.data;
};

export const deleteProduct = async (productId) => {
  await api.delete(`/products/${productId}`);
};