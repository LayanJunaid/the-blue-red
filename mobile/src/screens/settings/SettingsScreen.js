import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

export default function SettingsScreen() {
  const { customer, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
        paddingTop: 58,
        gap: 18,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
        Settings
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 24,
          padding: 18,
          gap: 8,
        }}
      >
        <Text style={{ color: colors.muted, fontWeight: "800" }}>
          Signed in as
        </Text>

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
          {customer?.customer_name}
        </Text>

        <Text style={{ color: colors.muted }}>{customer?.customer_id}</Text>
      </View>

      <Pressable
        onPress={logout}
        style={{
          backgroundColor: colors.primary,
          padding: 16,
          borderRadius: 18,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.white, fontWeight: "900" }}>Logout</Text>
      </Pressable>
    </View>
  );
}