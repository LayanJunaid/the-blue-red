import api from "../api/client";

export const getKnowledgeEntries = async () => {
  const res = await api.get("/knowledge");
  return res.data;
};

export const createKnowledgeEntry = async (payload) => {
  const res = await api.post("/knowledge", payload);
  return res.data;
};