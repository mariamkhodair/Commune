import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Item = { id: string; name: string; category: string; points: number; photos: string[]; status: string; likeCount: number };

const statusColors: Record<string, string> = {
  Available: "#4A6640",
  "In a Swap": "#2A5060",
  Swapped: "#6B5040",
};
const statusBg: Record<string, string> = {
  Available: "#D8E4D0",
  "In a Swap": "#D4E0E8",
  Swapped: "#DDD8C8",
};

export default function MyStuff() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchItems();

    const channel = supabase
      .channel("mobile-my-stuff-items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `owner_id=eq.${userId}` },
        () => fetchItems()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_likes" },
        () => fetchItems()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("id, name, category, points, photos, status")
      .eq("owner_id", userId!)
      .order("created_at", { ascending: false });

    const withLikes = await Promise.all(
      (data ?? []).map(async (item: any) => {
        const { count } = await supabase
          .from("item_likes")
          .select("id", { count: "exact", head: true })
          .eq("item_id", item.id);
        return { ...item, photos: item.photos ?? [], likeCount: count ?? 0 };
      })
    );
    setItems(withLikes);
    setLoading(false);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert("Delete item?", `"${name}" will be permanently removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) { Alert.alert("Error", "Not logged in."); return; }

          const res = await fetch("https://commune-neon.vercel.app/api/delete-item", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ itemId: id }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            Alert.alert("Error", `Failed to delete: ${body.error ?? res.status}`);
            return;
          }

          setItems((prev) => prev.filter((i) => i.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4">
        <View>
          <Text className="text-2xl font-light text-[#4A3728]">My Stuff</Text>
          <Text className="text-[#8B7355] text-sm">{items.length} item{items.length !== 1 ? "s" : ""} listed</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/new-item")}
          className="flex-row items-center gap-1.5 bg-[#4A3728] px-4 py-2.5 rounded-full"
        >
          <Ionicons name="add" size={16} color="#FAF7F2" />
          <Text className="text-[#FAF7F2] font-medium text-sm">List Item</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#8B7355] text-lg mb-2">Nothing here yet</Text>
          <Text className="text-[#A09080] text-sm text-center mb-6">List your first item and start swapping.</Text>
          <TouchableOpacity onPress={() => router.push("/new-item")} className="bg-[#4A3728] px-6 py-3 rounded-full">
            <Text className="text-[#FAF7F2] font-medium">List an Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          refreshing={false}
          onRefresh={fetchItems}
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
                  onPress={() => confirmDelete(item.id, item.name)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={14} color="#A0624A" />
                </TouchableOpacity>
              </View>
              <View className="p-2.5">
                <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-[#8B7355]">{item.category}</Text>
                <View className="flex-row items-center justify-between mt-1.5">
                  <Text className="text-xs font-semibold text-[#4A3728]">{item.points} pts</Text>
                  <View style={{ backgroundColor: statusBg[item.status] ?? "#EDE8DF" }} className="px-2 py-0.5 rounded-full">
                    <Text style={{ color: statusColors[item.status] ?? "#4A3728" }} className="text-xs font-medium">{item.status}</Text>
                  </View>
                </View>
                {item.likeCount > 0 && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="heart" size={11} color="#A0624A" />
                    <Text className="text-xs text-[#A09080]">{item.likeCount} like{item.likeCount !== 1 ? "s" : ""}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
