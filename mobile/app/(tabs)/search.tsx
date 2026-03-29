import { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, FlatList, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Item = { id: string; name: string; category: string; condition: string; points: number; photos: string[]; owner: string; ownerId: string; liked: boolean; status: string };

const CATEGORIES = ["All", "Apparel", "Electronics", "Books", "Cosmetics", "Furniture & Home Decor", "Stationery & Art Supplies", "Miscellaneous"];

export default function Search() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!userId) return;
    fetchItems(true);
  }, [userId]);

  async function fetchItems(showSpinner = false) {
    if (showSpinner) setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("id, name, category, condition, points, photos, status, owner_id, profiles(id, name)")
      .in("status", ["Available", "Swapped"])
      .neq("owner_id", userId!)
      .order("created_at", { ascending: false });

    const { data: likes } = await supabase
      .from("item_likes")
      .select("item_id")
      .eq("user_id", userId!);

    const likedSet = new Set((likes ?? []).map((l: any) => l.item_id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItems((data ?? []).map((i: any) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      condition: i.condition,
      points: i.points,
      photos: i.photos ?? [],
      owner: (Array.isArray(i.profiles) ? i.profiles[0]?.name : i.profiles?.name) ?? "Unknown",
      ownerId: i.owner_id,
      liked: likedSet.has(i.id),
      status: i.status ?? "Available",
    })));
    setLoading(false);
  }

  async function toggleLike(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, liked: !i.liked } : i));
    if (item.liked) {
      await supabase.from("item_likes").delete().eq("item_id", id).eq("user_id", userId!);
    } else {
      await supabase.from("item_likes").insert({ item_id: id, user_id: userId! });
    }
  }

  const filtered = items.filter((i) => {
    const matchQ = !query || i.name.toLowerCase().includes(query.toLowerCase());
    const matchC = category === "All" || i.category === category;
    return matchQ && matchC;
  });

  return (
    <SafeAreaView className="flex-1">
      {/* Search bar */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-light text-[#4A3728] mb-3">Browse</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 border border-[#EDE8DF]">
          <Ionicons name="search-outline" size={18} color="#C4B9AA" />
          <TextInput
            className="flex-1 py-3 ml-2 text-[#4A3728] text-sm"
            placeholder="Search items..."
            placeholderTextColor="#C4B9AA"
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#C4B9AA" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: "center" }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: category === c ? "#4A3728" : "#D9CFC4", backgroundColor: category === c ? "#4A3728" : "white", flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "500", color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchItems(); setRefreshing(false); }}
          contentContainerClassName="px-4 pb-8 gap-3"
          columnWrapperClassName="gap-3"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-[#8B7355] text-base">No items found</Text>
            </View>
          }
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
                  onPress={() => toggleLike(item.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 items-center justify-center"
                >
                  <Ionicons name={item.liked ? "heart" : "heart-outline"} size={16} color="#A0624A" />
                </TouchableOpacity>
              </View>
              <View className="p-2.5">
                <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-[#8B7355]">{item.condition}</Text>
                <View className="flex-row items-center justify-between mt-1.5">
                  <Text className="text-xs font-semibold text-[#4A3728]">{item.points} pts</Text>
                  {item.status === "Swapped" ? (
                    <View style={{ backgroundColor: "#DDD8C8", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#D9CFC4" }}>
                      <Text style={{ fontSize: 11, color: "#6B5040", fontWeight: "600" }}>Swapped</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: "#D8E4D0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: "#4A6640", fontWeight: "600" }}>Available</Text>
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
