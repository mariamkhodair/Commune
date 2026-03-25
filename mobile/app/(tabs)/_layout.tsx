import { useState, useRef, useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  Animated, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  ScrollView, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUnread } from "@/lib/unreadContext";
import { useNotifications } from "@/lib/notificationContext";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.78;

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const SECTIONS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: "My Activity",
    items: [
      { label: "Notifications",      icon: "notifications-outline",       route: "/notifications" },
      { label: "My Swaps",           icon: "swap-horizontal-outline",    route: "/my-swaps" },
      { label: "Scheduled Swaps",    icon: "calendar-outline",            route: "/scheduled-swaps" },
      { label: "Stuff I Want",       icon: "star-outline",                route: "/stuff-i-want" },
      { label: "Liked Stuff",        icon: "heart-outline",               route: "/liked" },
      { label: "Liked Members",      icon: "people-outline",              route: "/liked-members" },
    ],
  },
  {
    heading: "Discover",
    items: [
      { label: "Browse Members",     icon: "person-outline",              route: "/members" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Get Help",           icon: "help-circle-outline",         route: "/help" },
      { label: "About Commune",      icon: "information-circle-outline",  route: "/about" },
      { label: "Community Guidelines", icon: "document-text-outline",       route: "/terms" },
    ],
  },
];

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? "#4A3728" : "#C4B9AA"} />;
}

export default function TabLayout() {
  const router = useRouter();
  const { unreadMessages } = useUnread();
  const { unreadCount: unreadNotifications, markAllRead } = useNotifications();
  const { userId, profile } = useUser();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [proposedCount, setProposedCount] = useState(0);
  const [newScheduled, setNewScheduled] = useState(0);

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("swaps")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "Proposed")
      .then(({ count }) => setProposedCount(count ?? 0));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const lastSeen = (await AsyncStorage.getItem("sched_last_seen")) ?? new Date(0).toISOString();
      const { data: mySwaps } = await supabase
        .from("swaps")
        .select("id")
        .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`);
      if (!mySwaps?.length) return;
      const ids = mySwaps.map((s) => s.id);
      const { count } = await supabase
        .from("scheduled_swaps")
        .select("id", { count: "exact", head: true })
        .in("swap_id", ids)
        .gt("created_at", lastSeen);
      setNewScheduled(count ?? 0);
    })();
  }, [userId]);

  function openDrawer() {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeDrawer(onClosed?: () => void) {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDrawerOpen(false);
      onClosed?.();
    });
  }

  async function signOut() {
    closeDrawer(async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    });
  }

  const totalMoreBadge = proposedCount + newScheduled + unreadNotifications;

  return (
    <View style={{ flex: 1 }}>
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
            tabBarIcon: ({ focused }) => <TabIcon name={drawerOpen ? "menu" : "menu-outline"} focused={drawerOpen} />,
            tabBarBadge: totalMoreBadge > 0 ? totalMoreBadge : undefined,
            tabBarBadgeStyle: { backgroundColor: "#A0624A", fontSize: 10, minWidth: 18, height: 18 },
            tabBarButton: (props) => (
              <TouchableOpacity
                style={props.style}
                onPress={drawerOpen ? () => closeDrawer() : openDrawer}
                accessibilityLabel="More"
              >
                {props.children}
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      {/* Sidebar drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => closeDrawer()}>
            <Animated.View
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(74,55,40,0.45)",
                opacity: backdropAnim,
              }}
            />
          </TouchableWithoutFeedback>

          {/* Sidebar panel */}
          <Animated.View
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              width: DRAWER_WIDTH,
              backgroundColor: "#FAF7F2",
              transform: [{ translateX: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "bottom"]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Profile header */}
                <TouchableOpacity
                  onPress={() => closeDrawer(() => router.push("/profile" as any))}
                  style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}
                >
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" }}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} />
                    ) : (
                      <Text style={{ color: "#4A3728", fontSize: 24, fontWeight: "bold" }}>{profile?.name?.charAt(0) ?? "?"}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#4A3728" }}>{profile?.name ?? "Loading..."}</Text>
                    <Ionicons name="pencil-outline" size={14} color="#8B7355" />
                  </View>
                  {profile?.area ? (
                    <Text style={{ fontSize: 13, color: "#8B7355" }}>{profile.area}, {profile.city}</Text>
                  ) : null}
                </TouchableOpacity>

                {/* Sections */}
                {SECTIONS.map(({ heading, items }) => (
                  <View key={heading} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      {heading}
                    </Text>
                    <View style={{ gap: 6 }}>
                      {items.map(({ label, icon, route }) => {
                        const isMySwaps = label === "My Swaps";
                        const isScheduled = label === "Scheduled Swaps";
                        const isNotifications = label === "Notifications";
                        const badgeCount = isMySwaps ? proposedCount : isScheduled ? newScheduled : isNotifications ? unreadNotifications : 0;
                        return (
                          <TouchableOpacity
                            key={label}
                            onPress={async () => {
                              if (isScheduled && newScheduled > 0) {
                                await AsyncStorage.setItem("sched_last_seen", new Date().toISOString());
                                setNewScheduled(0);
                              }
                              if (isNotifications) {
                                markAllRead();
                              }
                              closeDrawer(() => router.push(route as any));
                            }}
                            style={{
                              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                              backgroundColor: "white", borderRadius: 16,
                              paddingHorizontal: 16, paddingVertical: 14,
                              borderWidth: 1, borderColor: "#EDE8DF",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <Ionicons name={icon} size={18} color="#8B7355" />
                              <Text style={{ fontSize: 14, color: "#4A3728" }}>{label}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {badgeCount > 0 && (
                                <View style={{ backgroundColor: isScheduled ? "#2D6A4F" : "#A0624A", borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" }}>
                                  <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{badgeCount}</Text>
                                </View>
                              )}
                              <Ionicons name="chevron-forward" size={16} color="#C4B9AA" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Sign out */}
                <View style={{ paddingHorizontal: 20 }}>
                  <TouchableOpacity
                    onPress={signOut}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999, borderWidth: 1, borderColor: "#D9CFC4" }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#A09080" />
                    <Text style={{ fontSize: 14, color: "#A09080" }}>Sign Out</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </>
      )}
    </View>
  );
}
