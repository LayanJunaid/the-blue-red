import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  Pressable,
} from "react-native";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

export default function LoginScreen() {
  const { login } = useAuth();

  const [customerId, setCustomerId] = useState("CUST-IST-001");
  const [password, setPassword] = useState("Market2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!customerId.trim() || !password.trim()) {
      setError("Customer ID and password are required.");
      return;
    }

    try {
      setLoading(true);
      await login(customerId.trim(), password);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "#1D4ED8",
          opacity: 0.25,
          top: -70,
          right: -80,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "#2563EB",
          opacity: 0.16,
          bottom: 80,
          left: -60,
        }}
      />

      <View
        style={{
          backgroundColor: "rgba(15, 27, 45, 0.92)",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 32,
          padding: 24,
          gap: 20,
        }}
      >
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 34,
              fontWeight: "900",
              letterSpacing: -1,
            }}
          >
            The Blue Red
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            AI destekli teklif asistanına müşteri hesabınızla giriş yapın.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <AppInput
            label="Customer ID"
            value={customerId}
            onChangeText={setCustomerId}
            placeholder="CUST-IST-001"
          />

          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />

          {error ? (
            <Text
              style={{
                color: colors.danger,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {error}
            </Text>
          ) : null}

          <AppButton
            title={loading ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.surfaceLight,
            borderRadius: 18,
            padding: 14,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            Demo account: CUST-IST-001 / Market2026!
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}