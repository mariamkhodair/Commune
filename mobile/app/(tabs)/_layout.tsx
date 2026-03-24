import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUnread } from "@/lib/unreadContext";

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? "#4A3728" : "#C4B9AA"}
    />
  );
}

export default function TabLayout() {
  const { unreadMessages } = useUnread();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FAF7F2",
          borderTopColor: "#EDE8DF",
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: "#4A3728",
        tabBarInactiveTintColor: "#C4B9AA",
        tabBarLabelStyle: { fontSize: 10, marginTop: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-stuff"
        options={{
          title: "My Stuff",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "chatbubble" : "chatbubble-outline"} focused={focused} />,
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: { backgroundColor: "#A0624A", fontSize: 10, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "menu" : "menu-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
