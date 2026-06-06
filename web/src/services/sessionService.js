import api from "../api/client";

export const getSessions = async () => {
  const res = await api.get("/sessions");
  return res.data;
};

export const getSessionLogs = async (sessionId) => {
  const res = await api.get(`/sessions/${sessionId}/logs`);
  return res.data;
};