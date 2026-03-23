import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type LikedItem = { id: string; name: string; condition: string; points: number; photos: string[]; owner: string; ownerId: string };

export default function LikedStuff() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchLiked();
  }, [userId]);

  async function fetchLiked() {
    setLoading(true);
    const { data } = await supabase
      .from("item_likes")
      .select("item_id, items(id, name, condition, points, photos, owner_id, profiles(id, name))")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItems((data ?? []).map((row: any) => {
      const item = row.items;
      const profile = Array.isArray(item?.profiles) ? item.profiles[0] : item?.profiles;
      return { id: item?.id, name: item?.name, condition: item?.condition, points: item?.points, photos: item?.photos ?? [], owner: profile?.name ?? "Unknown", ownerId: item?.owner_id };
    }).filter((i: any) => i.id));
    setLoading(false);
  }

  async function unlike(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId!);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <Text className="text-2xl font-light text-[#4A3728]">Liked Stuff</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">Nothing liked yet</Text>
          <Text className="text-[#A09080] text-sm text-center">Browse items and heart the ones you want.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerClassName="px-4 pb-8 gap-3"
          columnWrapperClassName="gap-3"
          showsVerticalScrollIndicator={false}
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
                <Text className="text-xs font-semibold text-[#4A3728] mt-1">{item.points} pts</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
