import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, ActivityIndicator, ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = ["All", "Apparel", "Electronics", "Books", "Cosmetics", "Furniture & Home Decor", "Stationery & Art Supplies", "Miscellaneous"];

type BrowseItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  photos: string[];
  owner: string;
};

export default function Landing() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("items")
        .select("id, name, category, condition, points, photos, profiles(name)")
        .eq("status", "Available")
        .order("created_at", { ascending: false });

      if (data) {
        setItems(data.map((item) => {
          const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            name: item.name,
            category: item.category,
            condition: item.condition,
            points: item.points,
            photos: item.photos ?? [],
            owner: (p as any)?.name ?? "Unknown",
          };
        }));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "All" && item.category !== category) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ fontSize: 32, fontWeight: "300", color: "#4A3728", letterSpacing: -0.5 }}>commune</Text>
          <Text style={{ fontSize: 13, color: "#8B7355", marginTop: 2 }}>swap what you don't need</Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}>
            <Ionicons name="search-outline" size={18} color="#A09080" />
            <TextInput
              placeholder="Search for anything..."
              placeholderTextColor="#C4B9AA"
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, fontSize: 15, color: "#4A3728" }}
            />
          </View>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999,
                backgroundColor: category === c ? "#4A3728" : "#fff",
                borderWidth: 1, borderColor: category === c ? "#4A3728" : "#D9CFC4",
              }}
            >
              <Text style={{ fontSize: 13, color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grid */}
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color="#4A3728" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#A09080", fontSize: 15 }}>No items found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}
            columnWrapperStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                style={{ width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}
                activeOpacity={0.85}
              >
                <View style={{ width: CARD_WIDTH, height: CARD_WIDTH, backgroundColor: "#EDE8DF" }}>
                  {item.photos[0] ? (
                    <Image source={{ uri: item.photos[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="image-outline" size={28} color="#C4B9AA" />
                    </View>
                  )}
                </View>
                <View style={{ padding: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: "#8B7355", marginTop: 2 }} numberOfLines={1}>{item.owner} · {item.condition}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#4A3728", marginTop: 4 }}>{item.points} pts</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

      </SafeAreaView>

      {/* Sticky bottom bar */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#FAF7F2", borderTopWidth: 1, borderTopColor: "#EDE8DF" }}>
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 999, borderWidth: 1.5, borderColor: "#4A3728", alignItems: "center" }}
          >
            <Text style={{ color: "#4A3728", fontWeight: "600", fontSize: 15 }}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 999, backgroundColor: "#4A3728", alignItems: "center" }}
          >
            <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
