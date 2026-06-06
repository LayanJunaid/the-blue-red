import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

function getTitle(action) {
  if (action === "item_added") return "Product added to quote";
  if (action === "quantity_increased") return "Quantity increased";
  if (action === "quantity_updated") return "Quantity updated";
  if (action === "item_replaced") return "Product replaced";
  if (action === "item_removed") return "Product removed";
  return "Quote updated";
}

export default function QuoteUpdateCard({ delta }) {
  if (!delta) return null;

  return (
    <View
      style={{
        backgroundColor: "#082F49",
        borderColor: "#38BDF8",
        borderWidth: 1,
        borderRadius: 22,
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: "#BAE6FD", fontSize: 13, fontWeight: "900" }}>
        Quote Update
      </Text>

      <Text style={{ color: colors.white, fontSize: 16, fontWeight: "900" }}>
        {getTitle(delta.action)}
      </Text>

      {delta.product_id ? (
        <Text style={{ color: "#BAE6FD" }}>Product: {delta.product_id}</Text>
      ) : null}

      {delta.new_quantity ? (
        <Text style={{ color: "#BAE6FD" }}>New quantity: {delta.new_quantity}</Text>
      ) : null}

      {delta.from_product_id && delta.to_product_id ? (
        <Text style={{ color: "#BAE6FD" }}>
          {delta.from_product_id} → {delta.to_product_id}
        </Text>
      ) : null}
    </View>
  );
}