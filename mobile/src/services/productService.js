import client from "../api/client";

export async function getProducts() {
  const response = await client.get("/products");
  return response.data;
}