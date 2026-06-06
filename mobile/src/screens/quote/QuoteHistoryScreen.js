import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import QuoteCard from "../../components/cards/QuoteCard";
import { useAuth } from "../../context/AuthContext";
import { getQuotes } from "../../services/quoteService";
import { colors } from "../../theme/colors";

export default function QuoteHistoryScreen() {
  const { customer } = useAuth();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const data = await getQuotes(customer.customer_id);
        setQuotes(data);
      } catch (error) {
        console.log("Failed to load quotes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (customer?.customer_id) {
      loadQuotes();
    }
  }, [customer?.customer_id]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
        paddingTop: 58,
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "#A78BFA",
          opacity: 0.35,
          top: -60,
          right: -80,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: "#22D3EE",
          opacity: 0.24,
          bottom: 80,
          left: -70,
        }}
      />

      <Text style={{ color: colors.text, fontSize: 34, fontWeight: "900" }}>
        My Quotes
      </Text>

      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Your personal quotations, synced with chat and dashboard.
      </Text>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.quote_id}
        contentContainerStyle={{ gap: 24, paddingTop: 26, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>
            {loading ? "Loading quotes..." : "No quotes found."}
          </Text>
        }
        renderItem={({ item }) => <QuoteCard quote={item} />}
      />
    </View>
  );
}