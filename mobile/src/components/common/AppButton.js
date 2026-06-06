import { Pressable, Text } from "react-native";
import { colors } from "../../theme/colors";

export default function AppButton({ title, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#334155" : colors.primary,
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: colors.white,
          fontSize: 16,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}