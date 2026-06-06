import { TextInput, View, Text } from "react-native";
import { colors } from "../../theme/colors";

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 15,
        }}
      />
    </View>
  );
}