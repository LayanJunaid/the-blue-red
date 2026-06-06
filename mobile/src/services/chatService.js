import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:8000/api/v1";

async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("access_token");
  }

  return SecureStore.getItemAsync("access_token");
}

export async function streamChatMessage({
  message,
  quoteId,
  customerId,
  sessionId,
  onEvent,
}) {
  const token = await getToken();

  const body = {
    message,
    quote_id: quoteId,
    customer_id: customerId,
  };

  if (sessionId) {
    body.session_id = sessionId;
  }

  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("Chat stream error:", response.status, errorText);
    throw new Error(`Chat stream request failed (${response.status}).`);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this environment.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      if (buffer.trim()) {
        const parsed = parseSseEvent(buffer);
        if (parsed) {
          console.log("SSE EVENT:", parsed);
          onEvent(parsed);
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() || "";

    for (const part of parts) {
      const parsed = parseSseEvent(part);

      if (parsed) {
        console.log("SSE EVENT:", parsed);
        onEvent(parsed);
      }
    }
  }
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split(/\r?\n/);

  let event = null;
  const dataParts = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      dataParts.push(line.slice(5).trim());
    }
  }

  if (!event || dataParts.length === 0) {
    return null;
  }

  const dataText = dataParts.join("\n");

  try {
    return {
      event,
      data: JSON.parse(dataText),
    };
  } catch (error) {
    console.log("Failed to parse SSE data:", dataText);
    return null;
  }
}