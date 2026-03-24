import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import ProposeSwapModal from "@/components/ProposeSwapModal";

type Profile = { id: string; name: string; area: string; city: string; rating: number | null; joined: string; avatar_url: string | null };
type Item = { id: string; name: string; category: string; points: number; photos: string[]; liked: boolean };

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [proposingItem, setProposingItem] = useState<Item | null>(null);

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
        avatar_url: p.avatar_url ?? null,
      });
    }
    setItems((itemsData ?? []).map((i: any) => ({ ...i, photos: i.photos ?? [], liked: likedSet.has(i.id) })));
    setFollowed(!!followData);
    setLoading(false);
  }

  async function openChat() {
    if (!userId) return;
    const memberId = Array.isArray(id) ? id[0] : id;

    const { data: a } = await supabase
      .from("conversations").select("id")
      .eq("member1_id", userId).eq("member2_id", memberId).maybeSingle();
    const { data: b } = !a ? await supabase
      .from("conversations").select("id")
      .eq("member1_id", memberId).eq("member2_id", userId).maybeSingle()
      : { data: null };

    let convId: string | null = (a as any)?.id ?? (b as any)?.id ?? null;

    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ member1_id: userId, member2_id: memberId })
        .select("id")
        .single();
      convId = (newConv as any)?.id ?? null;
    }

    // Retry find in case of race condition / unique constraint
    if (!convId) {
      const { data: retry } = await supabase
        .from("conversations").select("id")
        .eq("member1_id", memberId).eq("member2_id", userId).maybeSingle();
      convId = (retry as any)?.id ?? null;
    }

    if (convId) router.push(`/messages/${convId}` as any);
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
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} className="flex-row items-center gap-1 px-5 pt-4 pb-2">
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
          <Text className="text-sm text-[#4A3728]">Back</Text>
        </TouchableOpacity>

        {/* Profile card */}
        {profile && (
          <View className="px-5 py-4 items-center">
            <View className="w-20 h-20 rounded-full bg-[#EDE8DF] items-center justify-center mb-3 overflow-hidden">
              {profile.avatar_url
                ? <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} />
                : <Text className="text-3xl font-semibold text-[#4A3728]">{profile.name.charAt(0)}</Text>}
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
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={openChat}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: "#4A3728" }}
                >
                  <Ionicons name="chatbubble-outline" size={15} color="#FAF7F2" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#FAF7F2" }}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleFollow}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: followed ? "#4A3728" : "#D9CFC4", backgroundColor: followed ? "#4A3728" : "white" }}
                >
                  <Ionicons name={followed ? "heart" : "heart-outline"} size={15} color={followed ? "#FAF7F2" : "#A0624A"} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: followed ? "#FAF7F2" : "#6B5040" }}>
                    {followed ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
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
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <Text className="text-xs font-semibold text-[#4A3728]">{item.points} pts</Text>
                      {id !== userId && (
                        <TouchableOpacity
                          onPress={() => setProposingItem(item)}
                          style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}
                        >
                          <Text style={{ color: "#FAF7F2", fontSize: 10, fontWeight: "600" }}>Swap</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {userId && proposingItem && profile && (
        <ProposeSwapModal
          visible={!!proposingItem}
          targetItems={[{ id: proposingItem.id, name: proposingItem.name, points: proposingItem.points, ownerId: id!, ownerName: profile.name }]}
          proposerId={userId}
          onClose={() => setProposingItem(null)}
        />
      )}
    </SafeAreaView>
  );
}
