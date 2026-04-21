import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

type RecentItem = { id: string; name: string; photos: string[]; points: number; owner: string };

export default function Dashboard() {
  const router = useRouter();
  const { profile, userId } = useUser();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchRecent();

    const channel = supabase
      .channel("home-items-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => fetchRecent())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await fetchRecent();
    setRefreshing(false);
  }

  const { t, isRTL } = useLang();
  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A3728" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-2xl font-light text-[#4A3728]">{t("home.greeting", { name: firstName })}</Text>
          <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-[#8B7355] text-sm mt-1">{t("home.tagline")}</Text>
        </View>

        {/* Quick actions */}
        <View className="px-5 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/search")}
              className="flex-1 bg-[#4A3728] rounded-2xl p-4 items-center gap-2"
            >
              <Ionicons name="search" size={22} color="#FAF7F2" />
              <Text className="text-[#FAF7F2] font-medium text-sm">{t("home.browse")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/new-item")}
              className="flex-1 bg-white rounded-2xl p-4 items-center gap-2 border border-[#EDE8DF]"
            >
              <Ionicons name="add-circle-outline" size={22} color="#4A3728" />
              <Text className="text-[#4A3728] font-medium text-sm">{t("home.listItem")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recently listed */}
        <View className="mb-6">
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }} className="items-center justify-between px-5 mb-3">
            <Text className="text-base font-semibold text-[#4A3728]">{t("home.recentlyListed")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <Text className="text-xs text-[#8B7355]">{t("home.seeAll")}</Text>
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
                  <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                  <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-xs text-[#8B7355]">{item.owner}</Text>
                  <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-xs font-semibold text-[#4A3728] mt-1">{item.points} {t("common.pts")}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shortcuts */}
        <View className="px-5 mb-8">
          <Text style={{ textAlign: isRTL ? "right" : "left" }} className="text-base font-semibold text-[#4A3728] mb-3">{t("home.quickLinks")}</Text>
          <View className="gap-2">
            {[
              { labelKey: "home.likedStuff" as const, icon: "heart-outline" as const, route: "/liked" },
              { labelKey: "home.likedMembers" as const, icon: "people-outline" as const, route: "/liked-members" },
              { labelKey: "home.stuffIWant" as const, icon: "star-outline" as const, route: "/stuff-i-want" },
              { labelKey: "home.mySwaps" as const, icon: "swap-horizontal-outline" as const, route: "/my-swaps" },
            ].map(({ labelKey, icon, route }) => (
              <TouchableOpacity
                key={labelKey}
                onPress={() => router.push(route as any)}
                style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
                className="items-center justify-between bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF]"
              >
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }} className="items-center gap-3">
                  <Ionicons name={icon} size={18} color="#8B7355" />
                  <Text className="text-sm text-[#4A3728]">{t(labelKey)}</Text>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="#C4B9AA" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
