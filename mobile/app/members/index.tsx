import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

type Member = { id: string; name: string; area: string; city: string; itemCount: number; joined: string; followed: boolean; avatar_url: string | null };
type LikedMember = { id: string; name: string; area: string; city: string; itemCount: number; joined: string; avatar_url: string | null };

export default function Members() {
  const router = useRouter();
  const { userId } = useUser();
  const { t } = useLang();
  const [tab, setTab] = useState<"all" | "liked">("all");

  // All members state
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  // Liked members state
  const [likedMembers, setLikedMembers] = useState<LikedMember[]>([]);
  const [likedLoading, setLikedLoading] = useState(true);
  const [likedRefreshing, setLikedRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchMembers();
    fetchLiked();
  }, [userId]);

  async function fetchMembers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, area, city, created_at, avatar_url")
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
          avatar_url: p.avatar_url ?? null,
        };
      })
    );
    setMembers(enriched);
    setLoading(false);
  }

  async function fetchLiked() {
    setLikedLoading(true);
    const { data: follows } = await supabase
      .from("member_follows")
      .select("following_id")
      .eq("follower_id", userId!);

    const ids = (follows ?? []).map((r: any) => r.following_id).filter(Boolean);
    if (ids.length === 0) { setLikedMembers([]); setLikedLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, area, city, created_at, avatar_url")
      .in("id", ids);

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profiles ?? []).map(async (p: any) => {
        const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", p.id).eq("status", "Available");
        return { id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "", itemCount: count ?? 0, joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }), avatar_url: p.avatar_url ?? null };
      })
    );
    setLikedMembers(enriched.filter(Boolean) as LikedMember[]);
    setLikedLoading(false);
  }

  async function toggleFollow(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const nowFollowed = !member.followed;
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, followed: nowFollowed } : m));
    if (nowFollowed) {
      await supabase.from("member_follows").insert({ follower_id: userId!, following_id: id });
      const full = members.find((m) => m.id === id);
      if (full) setLikedMembers((prev) => [{ id: full.id, name: full.name, area: full.area, city: full.city, itemCount: full.itemCount, joined: full.joined, avatar_url: full.avatar_url }, ...prev]);
    } else {
      await supabase.from("member_follows").delete().eq("follower_id", userId!).eq("following_id", id);
      setLikedMembers((prev) => prev.filter((m) => m.id !== id));
    }
  }

  async function unfollow(id: string) {
    setLikedMembers((prev) => prev.filter((m) => m.id !== id));
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, followed: false } : m));
    await supabase.from("member_follows").delete().eq("follower_id", userId!).eq("following_id", id);
  }

  const filtered = members.filter((m) =>
    !query || m.name.toLowerCase().includes(query.toLowerCase())
  );

  const followedCount = members.filter((m) => m.followed).length;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>{t("members.header")}</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: "center" }}>
          {(["all", "liked"] as const).map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              onPress={() => setTab(tabKey)}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
                borderColor: tab === tabKey ? "#4A3728" : "#D9CFC4",
                backgroundColor: tab === tabKey ? "#4A3728" : "white",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: tab === tabKey ? "#FAF7F2" : "#6B5040" }}>
                {tabKey === "all" ? t("members.allMembers") : `${t("members.likedMembers")}${followedCount > 0 ? ` (${followedCount})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* All Members tab */}
      {tab === "all" && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, marginHorizontal: 20, borderWidth: 1, borderColor: "#EDE8DF" }}>
            <Ionicons name="search-outline" size={18} color="#C4B9AA" />
            <TextInput
              style={{ flex: 1, paddingVertical: 12, marginLeft: 8, color: "#4A3728", fontSize: 14 }}
              placeholder={t("members.searchPlaceholder")}
              placeholderTextColor="#C4B9AA"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          {loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#4A3728" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 12 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await fetchMembers(); setRefreshing(false); }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/members/${item.id}`)}
                  style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#EDE8DF", flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {item.avatar_url
                      ? <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44 }} />
                      : <Text style={{ fontSize: 16, fontWeight: "600", color: "#4A3728" }}>{item.name.charAt(0)}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{item.name}</Text>
                    {item.area ? <Text style={{ fontSize: 11, color: "#8B7355" }}>{item.area}, {item.city}</Text> : null}
                    <Text style={{ fontSize: 11, color: "#A09080" }}>{item.itemCount} item{item.itemCount !== 1 ? "s" : ""} · Joined {item.joined}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFollow(item.id)} style={{ padding: 4 }}>
                    <Ionicons name={item.followed ? "heart" : "heart-outline"} size={20} color="#A0624A" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Liked Members tab */}
      {tab === "liked" && (
        <View style={{ flex: 1 }}>
          {likedLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#4A3728" />
            </View>
          ) : likedMembers.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <Ionicons name="people-outline" size={40} color="#C4B9AA" />
              <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 4 }}>No liked members yet</Text>
              <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Browse members and heart the ones you want to keep track of.</Text>
              <TouchableOpacity onPress={() => setTab("all")} style={{ backgroundColor: "#4A3728", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 }}>
                <Text style={{ color: "#FAF7F2", fontWeight: "500" }}>Browse Members</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={likedMembers}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 12 }}
              showsVerticalScrollIndicator={false}
              refreshing={likedRefreshing}
              onRefresh={async () => { setLikedRefreshing(true); await fetchLiked(); setLikedRefreshing(false); }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/members/${item.id}`)}
                  style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#EDE8DF", flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {item.avatar_url
                      ? <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44 }} />
                      : <Text style={{ fontSize: 16, fontWeight: "600", color: "#4A3728" }}>{item.name.charAt(0)}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{item.name}</Text>
                    {item.area ? <Text style={{ fontSize: 11, color: "#8B7355" }}>{item.area}, {item.city}</Text> : null}
                    <Text style={{ fontSize: 11, color: "#A09080" }}>{item.itemCount} item{item.itemCount !== 1 ? "s" : ""} · Joined {item.joined}</Text>
                  </View>
                  <TouchableOpacity onPress={() => unfollow(item.id)} style={{ padding: 4 }}>
                    <Ionicons name="heart" size={20} color="#A0624A" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
