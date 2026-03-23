import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Profile = { id: string; name: string; area: string; city: string; rating: number | null; joined: string };
type Item = { id: string; name: string; category: string; points: number; photos: string[]; liked: boolean };

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (!id || !userId) return;
    fetchAll();
  }, [id, userId]);

  async function fetchAll() {
    const [{ data: p }, { data: itemsData }, { data: followData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("items").select("id, name, category, points, photos").eq("owner_id", id).eq("status", "Available"),
      supabase.from("member_follows").select("id").eq("follower_id", userId!).eq("following_id", id).maybeSingle(),
    ]);

    const { data: likes } = await supabase.from("item_likes").select("item_id").eq("user_id", userId!);
    const likedSet = new Set((likes ?? []).map((l: any) => l.item_id));

    if (p) {
      setProfile({
        id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "",
        rating: p.rating_count > 0 ? p.rating_sum / p.rating_count : null,
        joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }
    setItems((itemsData ?? []).map((i: any) => ({ ...i, photos: i.photos ?? [], liked: likedSet.has(i.id) })));
    setFollowed(!!followData);
    setLoading(false);
  }

  async function toggleFollow() {
    setFollowed((f) => !f);
    if (followed) {
      await supabase.from("member_follows").delete().eq("follower_id", userId!).eq("following_id", id);
    } else {
      await supabase.from("member_follows").insert({ follower_id: userId!, following_id: id });
    }
  }

  async function toggleLike(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, liked: !i.liked } : i));
    if (item.liked) {
      await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId!);
    } else {
      await supabase.from("item_likes").insert({ item_id: itemId, user_id: userId! });
    }
  }

  if (loading) return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2] items-center justify-center">
      <ActivityIndicator color="#4A3728" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1 px-5 pt-4 pb-2">
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
          <Text className="text-sm text-[#4A3728]">Back</Text>
        </TouchableOpacity>

        {/* Profile card */}
        {profile && (
          <View className="px-5 py-4 items-center">
            <View className="w-20 h-20 rounded-full bg-[#EDE8DF] items-center justify-center mb-3">
              <Text className="text-3xl font-semibold text-[#4A3728]">{profile.name.charAt(0)}</Text>
            </View>
            <Text className="text-xl font-semibold text-[#4A3728]">{profile.name}</Text>
            {profile.area ? <Text className="text-sm text-[#8B7355]">{profile.area}, {profile.city}</Text> : null}
            <Text className="text-xs text-[#A09080] mt-0.5">Member since {profile.joined}</Text>
            {profile.rating !== null && (
              <View className="flex-row items-center gap-1 mt-2">
                <Ionicons name="star" size={14} color="#C4842A" />
                <Text className="text-sm text-[#6B5040] font-medium">{profile.rating.toFixed(1)}</Text>
              </View>
            )}
            {id !== userId && (
              <TouchableOpacity
                onPress={toggleFollow}
                className={`flex-row items-center gap-2 mt-4 px-5 py-2.5 rounded-full border ${
                  followed ? "bg-[#4A3728] border-[#4A3728]" : "bg-white border-[#D9CFC4]"
                }`}
              >
                <Ionicons name={followed ? "heart" : "heart-outline"} size={16} color={followed ? "#FAF7F2" : "#A0624A"} />
                <Text className={`text-sm font-medium ${followed ? "text-[#FAF7F2]" : "text-[#6B5040]"}`}>
                  {followed ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Items */}
        <View className="px-5 mb-8">
          <Text className="text-base font-semibold text-[#4A3728] mb-3">
            {items.length} item{items.length !== 1 ? "s" : ""} listed
          </Text>
          {items.length === 0 ? (
            <Text className="text-sm text-[#A09080] text-center py-6">No items listed yet.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/items/${item.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-[#EDE8DF]"
                  style={{ width: "47%" }}
                >
                  <View className="w-full aspect-square bg-[#EDE8DF] items-center justify-center">
                    {item.photos[0] ? (
                      <Image source={{ uri: item.photos[0] }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={24} color="#C4B9AA" />
                    )}
                    <TouchableOpacity
                      onPress={() => toggleLike(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 items-center justify-center"
                    >
                      <Ionicons name={item.liked ? "heart" : "heart-outline"} size={15} color="#A0624A" />
                    </TouchableOpacity>
                  </View>
                  <View className="p-2.5">
                    <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs font-semibold text-[#4A3728] mt-0.5">{item.points} pts</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
