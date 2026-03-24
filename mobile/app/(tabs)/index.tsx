import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type RecentItem = { id: string; name: string; photos: string[]; points: number; owner: string };

export default function Dashboard() {
  const router = useRouter();
  const { profile, userId } = useUser();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchRecent();
  }, [userId]);

  async function fetchRecent() {
    const { data } = await supabase
      .from("items")
      .select("id, name, photos, points, profiles(name)")
      .eq("status", "Available")
      .neq("owner_id", userId!)
      .order("created_at", { ascending: false })
      .limit(6);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRecentItems((data ?? []).map((i: any) => ({
      id: i.id,
      name: i.name,
      photos: i.photos ?? [],
      points: i.points,
      owner: (Array.isArray(i.profiles) ? i.profiles[0]?.name : i.profiles?.name) ?? "Unknown",
    })));
  }

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-2xl font-light text-[#4A3728]">Hey, {firstName} 👋</Text>
          <Text className="text-[#8B7355] text-sm mt-1">What are you looking to swap today?</Text>
        </View>

        {/* Quick actions */}
        <View className="px-5 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/search")}
              className="flex-1 bg-[#4A3728] rounded-2xl p-4 items-center gap-2"
            >
              <Ionicons name="search" size={22} color="#FAF7F2" />
              <Text className="text-[#FAF7F2] font-medium text-sm">Browse Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/new-item")}
              className="flex-1 bg-white rounded-2xl p-4 items-center gap-2 border border-[#EDE8DF]"
            >
              <Ionicons name="add-circle-outline" size={22} color="#4A3728" />
              <Text className="text-[#4A3728] font-medium text-sm">List an Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recently listed */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-base font-semibold text-[#4A3728]">Recently Listed</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <Text className="text-xs text-[#8B7355]">See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-3">
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/items/${item.id}`)}
                className="w-40 bg-white rounded-2xl overflow-hidden border border-[#EDE8DF]"
              >
                <View className="w-full h-36 bg-[#EDE8DF] items-center justify-center">
                  {item.photos[0] ? (
                    <Image source={{ uri: item.photos[0] }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={28} color="#C4B9AA" />
                  )}
                </View>
                <View className="p-2.5">
                  <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-xs text-[#8B7355]">{item.owner}</Text>
                  <Text className="text-xs font-semibold text-[#4A3728] mt-1">{item.points} pts</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shortcuts */}
        <View className="px-5 mb-8">
          <Text className="text-base font-semibold text-[#4A3728] mb-3">Quick Links</Text>
          <View className="gap-2">
            {[
              { label: "Liked Stuff", icon: "heart-outline" as const, route: "/liked" },
              { label: "Liked Members", icon: "people-outline" as const, route: "/liked-members" },
              { label: "Stuff I Want", icon: "star-outline" as const, route: "/stuff-i-want" },
              { label: "My Swaps", icon: "swap-horizontal-outline" as const, route: "/my-swaps" },
            ].map(({ label, icon, route }) => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push(route as any)}
                className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF]"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name={icon} size={18} color="#8B7355" />
                  <Text className="text-sm text-[#4A3728]">{label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C4B9AA" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
