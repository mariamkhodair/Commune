import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Member = { id: string; name: string; area: string; city: string; itemCount: number; joined: string; followed: boolean };

export default function Members() {
  const router = useRouter();
  const { userId } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetchMembers();
  }, [userId]);

  async function fetchMembers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, area, city, created_at")
      .neq("id", userId!);

    const { data: follows } = await supabase
      .from("member_follows")
      .select("following_id")
      .eq("follower_id", userId!);

    const followedSet = new Set((follows ?? []).map((f: any) => f.following_id));

    const enriched = await Promise.all(
      (profiles ?? []).map(async (p: any) => {
        const { count } = await supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", p.id)
          .eq("status", "Available");
        return {
          id: p.id, name: p.name,
          area: p.area ?? "", city: p.city ?? "",
          itemCount: count ?? 0,
          joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          followed: followedSet.has(p.id),
        };
      })
    );
    setMembers(enriched);
    setLoading(false);
  }

  async function toggleFollow(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, followed: !m.followed } : m));
    if (member.followed) {
      await supabase.from("member_follows").delete().eq("follower_id", userId!).eq("following_id", id);
    } else {
      await supabase.from("member_follows").insert({ follower_id: userId!, following_id: id });
    }
  }

  const filtered = members.filter((m) =>
    !query || m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <View className="px-5 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1 mb-3">
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
          <Text className="text-sm text-[#4A3728]">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-light text-[#4A3728] mb-3">Members</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 border border-[#EDE8DF]">
          <Ionicons name="search-outline" size={18} color="#C4B9AA" />
          <TextInput
            className="flex-1 py-3 ml-2 text-[#4A3728] text-sm"
            placeholder="Search members..."
            placeholderTextColor="#C4B9AA"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
              <TouchableOpacity onPress={() => toggleFollow(item.id)} className="p-1">
                <Ionicons name={item.followed ? "heart" : "heart-outline"} size={20} color="#A0624A" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
