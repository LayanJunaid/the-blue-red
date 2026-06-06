import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ChatScreen from "../screens/chat/ChatScreen";
import ProductCatalogScreen from "../screens/catalog/ProductCatalogScreen";
import QuoteHistoryScreen from "../screens/quote/QuoteHistoryScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

function TabLabel({ focused, label }) {
  return (
    <Text
      style={{
        color: focused ? colors.primarySoft : colors.muted,
        fontSize: 11,
        fontWeight: "800",
      }}
    >
      {label}
    </Text>
  );
}

function TabIcon({ focused, icon }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.primary : colors.surfaceLight,
      }}
    >
      <Text style={{ color: colors.white, fontSize: 15 }}>{icon}</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, booting } = useAuth();

  if (booting) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 76,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◼" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Home" />,
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✦" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Chat" />,
        }}
      />

      <Tab.Screen
        name="Quotes"
        component={QuoteHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="▤" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Quote" />,
        }}
      />

      <Tab.Screen
        name="Products"
        component={ProductCatalogScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="▣" />,
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="Products" />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⚙" />,
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="Settings" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}