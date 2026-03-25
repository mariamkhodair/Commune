import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const SECTIONS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: "My Activity",
    items: [
      { label: "My Swaps",         icon: "swap-horizontal-outline", route: "/my-swaps" },
      { label: "Scheduled Swaps",  icon: "calendar-outline",         route: "/scheduled-swaps" },
      { label: "Stuff I Want",     icon: "star-outline",             route: "/stuff-i-want" },
      { label: "Liked Stuff",      icon: "heart-outline",            route: "/liked" },
      { label: "Liked Members",    icon: "people-outline",           route: "/liked-members" },
    ],
  },
  {
    heading: "Discover",
    items: [
      { label: "Browse Members",   icon: "person-outline",           route: "/members" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Get Help",         icon: "help-circle-outline",      route: "/help" },
      { label: "About Commune",    icon: "information-circle-outline", route: "/about" },
      { label: "Community Guidelines", icon: "document-text-outline",  route: "/terms" },
    ],
  },
];

export default function More() {
  const router = useRouter();
  const { userId, profile } = useUser();
  const [proposedCount, setProposedCount] = useState(0);
  const [newScheduled, setNewScheduled] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("swaps")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "Proposed")
      .then(({ count }) => setProposedCount(count ?? 0));
  }, [userId]);

  // New scheduled swaps count
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

  // Clear scheduled badge when this screen comes into view (user sees the item)
  useFocusEffect(
    useCallback(() => {
      // Badge clears only when user taps Scheduled Swaps, handled at navigation
    }, [])
  );

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile header */}
        <TouchableOpacity onPress={() => router.push("/profile" as any)} className="px-5 pt-6 pb-6 items-center">
          <View className="w-16 h-16 rounded-full bg-[#EDE8DF] items-center justify-center mb-3 overflow-hidden">
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} />
            ) : (
              <Text className="text-[#4A3728] text-2xl font-bold">{profile?.name?.charAt(0) ?? "?"}</Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text className="text-lg font-semibold text-[#4A3728]">{profile?.name ?? "Loading..."}</Text>
            <Ionicons name="pencil-outline" size={14} color="#8B7355" />
          </View>
          {profile?.area ? (
            <Text className="text-sm text-[#8B7355]">{profile.area}, {profile.city}</Text>
          ) : null}
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map(({ heading, items }) => (
          <View key={heading} className="px-5 mb-5">
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {heading}
            </Text>
            <View style={{ gap: 6 }}>
              {items.map(({ label, icon, route }) => {
                const isMySwaps = label === "My Swaps";
                const isScheduled = label === "Scheduled Swaps";
                const badgeCount = isMySwaps ? proposedCount : isScheduled ? newScheduled : 0;
                const showBadge = badgeCount > 0;
                const badgeColor = isScheduled ? "#2D6A4F" : "#A0624A";
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={async () => {
                      if (isScheduled && newScheduled > 0) {
                        await AsyncStorage.setItem("sched_last_seen", new Date().toISOString());
                        setNewScheduled(0);
                      }
                      router.push(route as any);
                    }}
                    className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF]"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name={icon} size={18} color="#8B7355" />
                      <Text className="text-sm text-[#4A3728]">{label}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {showBadge && (
                        <View style={{ backgroundColor: badgeColor, borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" }}>
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
        <View className="px-5">
          <TouchableOpacity
            onPress={signOut}
            className="flex-row items-center justify-center gap-2 py-4 rounded-full border border-[#D9CFC4]"
          >
            <Ionicons name="log-out-outline" size={18} color="#A09080" />
            <Text className="text-sm text-[#A09080]">Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
