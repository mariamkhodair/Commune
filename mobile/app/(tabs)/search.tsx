import { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Item = { id: string; name: string; category: string; condition: string; points: number; photos: string[]; owner: string; ownerId: string; liked: boolean };

const CATEGORIES = ["All", "Clothes", "Books", "Electronics", "Home", "Toys", "Sports", "Other"];

export default function Search() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!userId) return;
    fetchItems();
  }, [userId]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("id, name, category, condition, points, photos, owner_id, profiles(id, name)")
      .eq("status", "Available")
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
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, alignItems: "center" }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
              alignSelf: "flex-start",
              borderColor: category === c ? "#4A3728" : "#D9CFC4",
              backgroundColor: category === c ? "#4A3728" : "white",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "500", color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
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
                <Text className="text-xs font-semibold text-[#4A3728] mt-1">{item.points} pts</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
