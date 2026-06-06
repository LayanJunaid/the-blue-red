import { Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { formatTRY } from "../../utils/currency";

export default function ProductCard({ product }) {
  const stock = Number(product.stock_qty || 0);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 24,
        padding: 18,
        gap: 10,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>
        {product.name_tr}
      </Text>

      <Text style={{ color: colors.muted, fontSize: 12 }}>
        {product.product_id} · {product.sku}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.primarySoft, fontWeight: "900" }}>
          {formatTRY(product.price_try)}
        </Text>

        <Text
          style={{
            color: stock > 0 ? "#86EFAC" : "#FCA5A5",
            fontWeight: "900",
          }}
        >
          Stock: {stock}
        </Text>
      </View>
    </View>
  );
}