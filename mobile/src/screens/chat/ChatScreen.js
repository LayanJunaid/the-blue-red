import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import MessageBubble from "../../components/chat/MessageBubble";
import QuoteUpdateCard from "../../components/chat/QuoteUpdateCard";
import SourceChip from "../../components/chat/SourceChip";
import { useAuth } from "../../context/AuthContext";
import { getQuotes } from "../../services/quoteService";
import { streamChatMessage } from "../../services/chatService";
import { colors } from "../../theme/colors";

function getToolLabel(tool) {
  if (tool === "search_products") return "Searching products";
  if (tool === "get_knowledge_entries") return "Reading knowledge sources";
  if (tool === "get_quote") return "Reading quote state";
  if (tool === "add_to_quote") return "Adding product to quote";
  if (tool === "update_quote_item") return "Updating quote item";
  if (tool === "replace_with_alternative") return "Replacing with alternative";
  return tool;
}

function ActivityCard({ item }) {
  const done = item.status === "Completed";
  const failed = item.status === "Failed";

  return (
    <View
      style={{
        alignSelf: "flex-start",
        maxWidth: "92%",
        backgroundColor: "rgba(255,255,255,0.82)",
        borderRadius: 22,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.95)",
        shadowColor: "#6D5DF6",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "900" }}>
        Tool Call #{item.sequence}
      </Text>

      <Text style={{ color: "#111827", fontSize: 15, fontWeight: "900", marginTop: 4 }}>
        {done ? "✓" : failed ? "✕" : "…" } {getToolLabel(item.tool)}
      </Text>

      <Text
        style={{
          color: failed ? "#FB7185" : done ? "#10B981" : "#6D5DF6",
          fontSize: 12,
          fontWeight: "800",
          marginTop: 3,
        }}
      >
        {item.status}
      </Text>
    </View>
  );
}

function SourcesBlock({ sourceIds }) {
  if (!sourceIds?.length) return null;

  return (
    <View style={{ alignSelf: "flex-start", maxWidth: "94%", gap: 8 }}>
      <Text style={{ color: "#64748B", fontWeight: "900", fontSize: 12 }}>
        Sources
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {sourceIds.map((sourceId) => (
            <SourceChip key={sourceId} sourceId={sourceId} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function QuoteSelector({ quotes, quoteId, onSelect }) {
  if (!quotes.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 10, paddingTop: 10 }}>
        {quotes.map((quote) => {
          const active = quote.quote_id === quoteId;

          return (
            <Pressable
              key={quote.quote_id}
              onPress={() => onSelect(quote.quote_id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? "#6D5DF6" : "rgba(255,255,255,0.8)",
                borderWidth: 1,
                borderColor: active ? "#6D5DF6" : "rgba(255,255,255,0.9)",
              }}
            >
              <Text
                style={{
                  color: active ? "#FFFFFF" : "#334155",
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                {quote.quote_id} · {Number(quote.total_try || 0).toLocaleString("tr-TR")} TRY
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function ChatScreen() {
  const { customer } = useAuth();

  const [sessionId, setSessionId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [quoteId, setQuoteId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "message",
      role: "assistant",
      text: "Merhaba! Ürün, politika veya teklif hakkında soru sorabilirsiniz.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const assistantMessageIdRef = useRef(null);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const data = await getQuotes(customer.customer_id);
        setQuotes(data);

        if (data.length > 0) {
          setQuoteId(data[0].quote_id);
        }
      } catch (error) {
        console.log("Failed to load quotes in chat:", error);
      }
    }

    if (customer?.customer_id) {
      loadQuotes();
    }
  }, [customer?.customer_id]);

  function appendAssistantChunk(text) {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== assistantMessageIdRef.current) return message;

        return {
          ...message,
          text: `${message.text}${text}`,
        };
      })
    );
  }

  function addActivity(data) {
    setMessages((prev) => [
      ...prev,
      {
        id: `tool-${data.sequence}-${Date.now()}`,
        type: "activity",
        sequence: data.sequence,
        tool: data.tool,
        status: "Running...",
      },
    ]);
  }

  function updateActivity(data) {
    setMessages((prev) =>
      prev.map((item) => {
        if (item.type !== "activity") return item;
        if (item.sequence !== data.sequence) return item;

        return {
          ...item,
          status: data.success ? "Completed" : "Failed",
        };
      })
    );
  }

  function addSources(sourceIds) {
    if (!sourceIds?.length) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `sources-${Date.now()}`,
        type: "sources",
        sourceIds,
      },
    ]);
  }

  function addQuoteUpdate(delta) {
    if (!delta) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `quote-delta-${Date.now()}`,
        type: "quote_update",
        delta,
      },
    ]);
  }

  function handleStreamEvent(payload) {
    const { event, data } = payload;

    if (event === "message_start") {
      setSessionId(data.session_id);
      return;
    }

    if (event === "tool_start") {
      addActivity(data);
      return;
    }

    if (event === "tool_result") {
      updateActivity(data);

      if (data.quote_delta) {
        addQuoteUpdate(data.quote_delta);
      }

      return;
    }

    if (event === "sources") {
      addSources(data.source_ids || []);
      return;
    }

    if (event === "text_chunk") {
      appendAssistantChunk(data.text || "");
      return;
    }

    if (event === "error") {
      appendAssistantChunk(`\nError: ${data.message}`);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || !quoteId) return;

    const userText = input.trim();

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "message",
      role: "user",
      text: userText,
    };

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      type: "message",
      role: "assistant",
      text: "",
    };

    assistantMessageIdRef.current = assistantMessage.id;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    try {
      await streamChatMessage({
        message: userText,
        quoteId,
        customerId: customer.customer_id,
        sessionId,
        onEvent: handleStreamEvent,
      });
    } catch (error) {
      appendAssistantChunk(
        error?.message || "Bağlantı hatası. Backend çalışıyor mu kontrol edin."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }) {
    if (item.type === "activity") {
      return <ActivityCard item={item} />;
    }

    if (item.type === "sources") {
      return <SourcesBlock sourceIds={item.sourceIds} />;
    }

    if (item.type === "quote_update") {
      return <QuoteUpdateCard delta={item.delta} />;
    }

    return <MessageBubble role={item.role} text={item.text || " "} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: "#EEF3FF",
      }}
    >
      <View
        style={{
          padding: 20,
          paddingTop: 54,
          backgroundColor: "#EEF3FF",
        }}
      >
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>
          AI Assistant
        </Text>

        <Text style={{ color: "#64748B", marginTop: 4 }}>
          Customer: {customer?.customer_id}
        </Text>

        <QuoteSelector quotes={quotes} quoteId={quoteId} onSelect={setQuoteId} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          gap: 14,
          paddingHorizontal: 18,
          paddingBottom: 18,
        }}
        renderItem={renderItem}
      />

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          padding: 14,
          borderTopColor: "rgba(148,163,184,0.25)",
          borderTopWidth: 1,
          backgroundColor: "rgba(255,255,255,0.82)",
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          editable={!loading && !!quoteId}
          placeholder={quoteId ? "Ask anything..." : "Loading quotes..."}
          placeholderTextColor="#94A3B8"
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(148,163,184,0.25)",
            borderWidth: 1,
            color: "#111827",
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 13,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={loading || !quoteId}
          style={{
            backgroundColor: loading ? "#A78BFA" : "#6D5DF6",
            borderRadius: 22,
            width: 56,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#6D5DF6",
            shadowOpacity: 0.35,
            shadowRadius: 14,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 18 }}>
            {loading ? "…" : "➤"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}