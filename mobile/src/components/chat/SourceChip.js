import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function SourceChip({ sourceId }) {
  const isKnowledge = sourceId?.startsWith("KNE");

  return (
    <View
      style={{
        backgroundColor: isKnowledge ? "#1E3A8A" : "#172554",
        borderColor: "#3B82F6",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Text style={{ color: colors.primarySoft, fontSize: 12, fontWeight: "900" }}>
        {sourceId}
      </Text>
    </View>
  );
}