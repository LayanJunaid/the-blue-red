import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function ToolCallCard({ item }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 4,
      }}
    >
      <Text style={{ color: colors.primarySoft, fontSize: 12, fontWeight: "900" }}>
        Tool #{item.sequence}
      </Text>

      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "900" }}>
        {item.tool}
      </Text>

      <Text style={{ color: item.success === false ? "#FCA5A5" : colors.muted, fontSize: 12 }}>
        {item.status}
      </Text>
    </View>
  );
}