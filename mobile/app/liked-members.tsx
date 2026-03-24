import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Member = { id: string; name: string; area: string; city: string; itemCount: number; joined: string };

export default function LikedMembers() {
  const router = useRouter();
  const { userId } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchFollowed();
  }, [userId]);

  async function fetchFollowed() {
    setLoading(true);
    const { data } = await supabase
      .from("member_follows")
      .select("following_id, profiles(id, name, area, city, created_at)")
      .eq("follower_id", userId!)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (row: any) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (!p) return null;
        const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", p.id).eq("status", "Available");
        return { id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "", itemCount: count ?? 0, joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) };
      })
    );
    setMembers(enriched.filter(Boolean) as Member[]);
    setLoading(false);
  }

  async function unfollow(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    await supabase.from("member_follows").delete().eq("follower_id", userId!).eq("following_id", memberId);
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <Text className="text-2xl font-light text-[#4A3728]">Liked Members</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : members.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">No liked members yet</Text>
          <Text className="text-[#A09080] text-sm text-center">Browse members and heart the ones you want to keep track of.</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerClassName="px-5 pb-8 gap-3"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/members/${item.id}`)}
              className="bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF] flex-row items-center gap-3"
            >
              <View className="w-11 h-11 rounded-full bg-[#EDE8DF] items-center justify-center">
                <Text className="text-base font-semibold text-[#4A3728]">{item.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#4A3728]">{item.name}</Text>
                {item.area ? <Text className="text-xs text-[#8B7355]">{item.area}, {item.city}</Text> : null}
                <Text className="text-xs text-[#A09080]">{item.itemCount} item{item.itemCount !== 1 ? "s" : ""} · Joined {item.joined}</Text>
              </View>
              <TouchableOpacity onPress={() => unfollow(item.id)} className="p-1">
                <Ionicons name="heart" size={20} color="#A0624A" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
