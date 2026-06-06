import { Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { formatTRY } from "../../utils/currency";

export default function QuoteCard({ quote }) {
  const items = (quote.items || []).filter((item) => item.status === "active");
  const discountValue = Number(quote.subtotal_try || 0) - Number(quote.total_try || 0);

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 30,
        padding: 22,
        gap: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.9)",
        shadowColor: "#6D5DF6",
        shadowOpacity: 0.22,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#111827", fontSize: 24, fontWeight: "900" }}>
            Product Quotation
          </Text>
          <Text style={{ color: "#64748B", marginTop: 6 }}>
            Customer: {quote.customer_id}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#64748B", fontWeight: "800" }}>Quote ID</Text>
          <Text style={{ color: "#6D5DF6", fontWeight: "900" }}>
            {quote.quote_id}
          </Text>
        </View>
      </View>

      <View
        style={{
          borderRadius: 22,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#DDD6FE",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#EDE9FE",
            paddingVertical: 12,
          }}
        >
          <Header label="Product ID" />
          <Header label="Qty" />
          <Header label="Price" />
          <Header label="Cost" />
        </View>

        {items.map((item, index) => {
          const cost = Number(item.unit_price_try) * Number(item.quantity);

          return (
            <View
              key={item.quote_item_id}
              style={{
                flexDirection: "row",
                backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                paddingVertical: 12,
              }}
            >
              <Cell label={item.product_id} />
              <Cell label={item.quantity} />
              <Cell label={formatTRY(item.unit_price_try)} />
              <Cell label={formatTRY(cost)} />
            </View>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        <Summary label="Total Estimated Cost" value={formatTRY(quote.subtotal_try)} />
        <Summary
          label={`Total Discount (${quote.discount_percent}%)`}
          value={`-${formatTRY(discountValue)}`}
        />
        <Summary label="Net Cost" value={formatTRY(quote.total_try)} strong />
      </View>

      {quote.notes ? (
        <View
          style={{
            backgroundColor: "#EEF2FF",
            borderRadius: 18,
            padding: 14,
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "900" }}>Note</Text>
          <Text style={{ color: "#475569", marginTop: 4 }}>{quote.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Header({ label }) {
  return (
    <Text
      style={{
        flex: 1,
        color: "#6D5DF6",
        fontWeight: "900",
        textAlign: "center",
        fontSize: 12,
      }}
    >
      {label}
    </Text>
  );
}

function Cell({ label }) {
  return (
    <Text
      style={{
        flex: 1,
        color: "#111827",
        textAlign: "center",
        fontSize: 12,
        fontWeight: "700",
      }}
    >
      {label}
    </Text>
  );
}

function Summary({ label, value, strong }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: "#475569", fontWeight: strong ? "900" : "700" }}>
        {label}
      </Text>
      <Text style={{ color: strong ? "#6D5DF6" : "#111827", fontWeight: "900" }}>
        {value}
      </Text>
    </View>
  );
}