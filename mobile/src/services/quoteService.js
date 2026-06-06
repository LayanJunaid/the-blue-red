import client from "../api/client";

export async function getQuotes(customerId) {
  const response = await client.get("/quotes", {
    params: {
      customer_id: customerId,
    },
  });

  return response.data;
}

export async function getQuote(quoteId, customerId) {
  const response = await client.get(`/quotes/${quoteId}`, {
    params: {
      customer_id: customerId,
    },
  });

  return response.data;
}