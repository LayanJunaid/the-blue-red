import api from "../api/client";

export const getQuotes = async () => {
  const res = await api.get("/quotes");
  return res.data;
};

export const getQuoteById = async (quoteId) => {
  const res = await api.get(`/quotes/${quoteId}`);
  return res.data;
};