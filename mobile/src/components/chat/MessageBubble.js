import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "82%",
        backgroundColor: isUser ? colors.primary : colors.surface,
        borderColor: colors.border,
        borderWidth: isUser ? 0 : 1,
        borderRadius: 22,
        padding: 14,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: "600",
        }}
      >
        {text}
      </Text>
    </View>
  );
}