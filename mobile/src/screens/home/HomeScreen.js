import { Animated, Pressable, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

function FloatingBubble({ size, top, left, right, bottom, delay = 0 }) {
  const move = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(move, {
          toValue: -18,
          duration: 2200,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(move, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        top,
        left,
        right,
        bottom,
        transform: [{ translateY: move }],
        backgroundColor: "rgba(167,139,250,0.75)",
        shadowColor: "#22D3EE",
        shadowOpacity: 0.5,
        shadowRadius: 28,
      }}
    />
  );
}

function MenuCard({ title, subtitle, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "rgba(255,255,255,0.78)",
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.9)",
        shadowColor: "#6D5DF6",
        shadowOpacity: 0.18,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
      }}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: "#111827", fontSize: 22, fontWeight: "900", marginTop: 12 }}>
        {title}
      </Text>
      <Text style={{ color: "#64748B", fontSize: 15, marginTop: 8, lineHeight: 22 }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { customer, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#EEF3FF",
        padding: 22,
        paddingTop: 58,
        overflow: "hidden",
      }}
    >
      <FloatingBubble size={210} top={-70} right={-70} />
      <FloatingBubble size={120} top={170} right={24} delay={400} />
      <FloatingBubble size={180} bottom={90} left={-70} delay={700} />
      <FloatingBubble size={72} bottom={210} right={42} delay={1200} />

      <View
        style={{
          backgroundColor: "#25115E",
          borderRadius: 36,
          padding: 28,
          minHeight: 290,
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <FloatingBubble size={160} top={-40} right={-40} />
        <FloatingBubble size={220} bottom={-90} left={-60} delay={500} />
        <FloatingBubble size={58} top={70} left={40} delay={800} />

        <Text style={{ color: "white", fontSize: 38, fontWeight: "900" }}>
          The Blue Red
        </Text>

        <Text style={{ color: "#D8B4FE", fontSize: 29, fontWeight: "800", marginTop: 8 }}>
          AI Sales Assistant
        </Text>

        <Text style={{ color: "#E0E7FF", fontSize: 16, lineHeight: 24, marginTop: 18 }}>
          Ask about products, policies, stock, prices and quotations instantly.
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ color: "#64748B", fontSize: 15, fontWeight: "800" }}>
          Welcome
        </Text>

        <Text style={{ color: "#111827", fontSize: 26, fontWeight: "900", marginTop: 4 }}>
          {customer?.name || "Customer"}
        </Text>

        <Text style={{ color: "#64748B", marginTop: 4 }}>
          {customer?.customer_id}
        </Text>
      </View>

      <View style={{ gap: 16, marginTop: 22 }}>
        <MenuCard
          icon="✦"
          title="Chat Assistant"
          subtitle="Ask product and policy questions with AI streaming answers."
          onPress={() => navigation.navigate("Chat")}
        />

        <MenuCard
          icon="▤"
          title="My Quote"
          subtitle="View your personal quotation linked to your account."
          onPress={() => navigation.navigate("Quotes")}
        />

        <MenuCard
          icon="▣"
          title="Product Catalog"
          subtitle="Browse products, stock availability and prices."
          onPress={() => navigation.navigate("Products")}
        />
      </View>

      <Pressable onPress={logout} style={{ marginTop: 24 }}>
        <Text style={{ color: "#6D5DF6", fontSize: 16, fontWeight: "900" }}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}