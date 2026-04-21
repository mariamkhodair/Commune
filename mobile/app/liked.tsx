import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

type LikedItem = { id: string; name: string; condition: string; points: number; photos: string[]; owner: string; ownerId: string; status: string };

export default function LikedStuff() {
  const router = useRouter();
  const { userId } = useUser();
  const { t } = useLang();
  const [items, setItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchLiked();
  }, [userId]);

  async function fetchLiked() {
    setLoading(true);
    const { data } = await supabase
      .from("item_likes")
      .select("item_id, items(id, name, condition, points, photos, status, owner_id, profiles(id, name))")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItems((data ?? []).map((row: any) => {
      const item = row.items;
      const profile = Array.isArray(item?.profiles) ? item.profiles[0] : item?.profiles;
      return { id: item?.id, name: item?.name, condition: item?.condition, points: item?.points, photos: item?.photos ?? [], owner: profile?.name ?? "Unknown", ownerId: item?.owner_id, status: item?.status ?? "Available" };
    }).filter((i: any) => i.id));
    setLoading(false);
  }

  async function unlike(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId!);
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <Text className="text-2xl font-light text-[#4A3728]">{t("liked.header")}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">{t("liked.emptyTitle")}</Text>
          <Text className="text-[#A09080] text-sm text-center">{t("liked.emptyHint")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerClassName="px-4 pb-8 gap-3"
          columnWrapperClassName="gap-3"
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchLiked(); setRefreshing(false); }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/items/${item.id}`)}
              className="flex-1 bg-white rounded-2xl overflow-hidden border border-[#EDE8DF]"
            >
              <View className="w-full aspect-square bg-[#EDE8DF] items-center justify-center">
                {item.photos[0] ? (
                  <Image source={{ uri: item.photos[0] }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Ionicons name="image-outline" size={28} color="#C4B9AA" />
                )}
                <TouchableOpacity
                  onPress={() => unlike(item.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 items-center justify-center"
                >
                  <Ionicons name="heart" size={16} color="#A0624A" />
                </TouchableOpacity>
              </View>
              <View className="p-2.5">
                <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-[#8B7355]">{item.condition}</Text>
                <View className="flex-row items-center justify-between mt-1.5">
                  <Text className="text-xs font-semibold text-[#4A3728]">{item.points} pts</Text>
                  {item.status === "Swapped" ? (
                    <View style={{ backgroundColor: "#DDD8C8", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#D9CFC4" }}>
                      <Text style={{ fontSize: 11, color: "#6B5040", fontWeight: "600" }}>{t("common.swapped")}</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: "#D8E4D0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: "#4A6640", fontWeight: "600" }}>{t("common.available")}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
