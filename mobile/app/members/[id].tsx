import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";
import ProposeSwapModal from "@/components/ProposeSwapModal";

type Profile = { id: string; name: string; area: string; city: string; rating: number | null; ratingCount: number; joined: string; avatar_url: string | null };
type Item = { id: string; name: string; category: string; points: number; photos: string[]; liked: boolean };

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);

  // Single-item propose
  const [proposingItem, setProposingItem] = useState<Item | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [proposingBundle, setProposingBundle] = useState(false);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const likedSet = new Set((likes ?? []).map((l: any) => l.item_id));

    if (p) {
      setProfile({
        id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "",
        rating: p.rating_count > 0 ? p.rating_sum / p.rating_count : null,
        ratingCount: p.rating_count ?? 0,
        joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        avatar_url: p.avatar_url ?? null,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItems((itemsData ?? []).map((i: any) => ({ ...i, photos: i.photos ?? [], liked: likedSet.has(i.id) })));
    setFollowed(!!followData);
    setLoading(false);
  }

  async function openChat() {
    if (!userId) return;
    const memberId = Array.isArray(id) ? id[0] : id;
    const { data: a } = await supabase.from("conversations").select("id").eq("member1_id", userId).eq("member2_id", memberId).maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: b } = !a ? await supabase.from("conversations").select("id").eq("member1_id", memberId).eq("member2_id", userId).maybeSingle() : { data: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let convId: string | null = (a as any)?.id ?? (b as any)?.id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase.from("conversations").insert({ member1_id: userId, member2_id: memberId }).select("id").single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convId = (newConv as any)?.id ?? null;
    }
    if (!convId) {
      const { data: retry } = await supabase.from("conversations").select("id").eq("member1_id", memberId).eq("member2_id", userId).maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  function toggleSelect(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  if (loading) return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2] items-center justify-center">
      <ActivityIndicator color="#4A3728" />
    </SafeAreaView>
  );

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const bundlePoints = selectedItems.reduce((s, i) => s + i.points, 0);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }} tintColor="#4A3728" />}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} className="flex-row items-center gap-1 px-5 pt-4 pb-2">
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
          <Text className="text-sm text-[#4A3728]">{t("common.back")}</Text>
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
            <Text className="text-xs text-[#A09080] mt-0.5">{t("members.memberSince", { date: profile.joined })}</Text>
            {profile.rating !== null ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                {[1,2,3,4,5].map((s) => (
                  <Ionicons key={s} name={s <= Math.round(profile.rating!) ? "star" : "star-outline"} size={14} color="#C4842A" />
                ))}
                <Text style={{ fontSize: 13, color: "#8B7355", marginLeft: 2 }}>{profile.rating.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: "#A09080" }}>({profile.ratingCount})</Text>
              </View>
            ) : null}
            {id !== userId && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={openChat}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: "#4A3728" }}
                >
                  <Ionicons name="chatbubble-outline" size={15} color="#FAF7F2" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#FAF7F2" }}>{t("members.message")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleFollow}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: followed ? "#4A3728" : "#D9CFC4", backgroundColor: followed ? "#4A3728" : "white" }}
                >
                  <Ionicons name={followed ? "heart" : "heart-outline"} size={15} color={followed ? "#FAF7F2" : "#A0624A"} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: followed ? "#FAF7F2" : "#6B5040" }}>
                    {followed ? t("members.following") : t("members.follow")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Items header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728" }}>
            {t("members.itemsListed", { n: items.length, s: items.length !== 1 ? "s" : "" })}
          </Text>
          {id !== userId && items.length > 0 && (
            <TouchableOpacity
              onPress={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              style={{
                borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
                borderColor: selectMode ? "#4A3728" : "#D9CFC4",
                backgroundColor: selectMode ? "#4A3728" : "white",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "500", color: selectMode ? "#FAF7F2" : "#6B5040" }}>
                {selectMode ? t("members.cancel") : t("members.selectItems")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items grid */}
        <View className="px-5 mb-8">
          {items.length === 0 ? (
            <Text className="text-sm text-[#A09080] text-center py-6">{t("members.noItemsYet")}</Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => selectMode ? toggleSelect(item.id) : router.push(`/items/${item.id}`)}
                    className="bg-white rounded-2xl overflow-hidden border border-[#EDE8DF]"
                    style={{ width: "47%", borderColor: isSelected ? "#4A3728" : "#EDE8DF", borderWidth: isSelected ? 2 : 1 }}
                  >
                    <View className="w-full aspect-square bg-[#EDE8DF] items-center justify-center">
                      {item.photos[0] ? (
                        <Image source={{ uri: item.photos[0] }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={24} color="#C4B9AA" />
                      )}
                      {/* Checkbox overlay in select mode, heart in normal mode */}
                      <View style={{ position: "absolute", top: 8, right: 8 }}>
                        {selectMode ? (
                          <View style={{
                            width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                            borderColor: isSelected ? "#4A3728" : "#D9CFC4",
                            backgroundColor: isSelected ? "#4A3728" : "rgba(255,255,255,0.9)",
                            alignItems: "center", justifyContent: "center",
                          }}>
                            {isSelected && <Ionicons name="checkmark" size={13} color="white" />}
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => toggleLike(item.id)}
                            className="w-7 h-7 rounded-full bg-white/80 items-center justify-center"
                          >
                            <Ionicons name={item.liked ? "heart" : "heart-outline"} size={15} color="#A0624A" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View className="p-2.5">
                      <Text className="text-xs font-medium text-[#4A3728]" numberOfLines={1}>{item.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <Text className="text-xs font-semibold text-[#4A3728]">{item.points} pts</Text>
                        {!selectMode && id !== userId && (
                          <TouchableOpacity
                            onPress={() => setProposingItem(item)}
                            style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}
                          >
                            <Text style={{ color: "#FAF7F2", fontSize: 10, fontWeight: "600" }}>{t("members.swap")}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bundle swap floating bar */}
      {selectMode && selectedIds.size > 0 && (
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: "#4A3728", paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <Text style={{ color: "#C4B9AA", fontSize: 13 }}>
            {t("members.bundleBar", { n: selectedIds.size, s: selectedIds.size !== 1 ? "s" : "", pts: bundlePoints })}
          </Text>
          <TouchableOpacity
            onPress={() => setProposingBundle(true)}
            style={{ backgroundColor: "#F5F0E8", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 }}
          >
            <Text style={{ color: "#4A3728", fontWeight: "700", fontSize: 13 }}>{t("members.proposeBundle")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Single-item modal */}
      {userId && proposingItem && profile && (
        <ProposeSwapModal
          visible={!!proposingItem}
          targetItems={[{ id: proposingItem.id, name: proposingItem.name, points: proposingItem.points, ownerId: id!, ownerName: profile.name }]}
          proposerId={userId}
          onClose={() => setProposingItem(null)}
        />
      )}

      {/* Bundle modal */}
      {userId && proposingBundle && profile && selectedIds.size > 0 && (
        <ProposeSwapModal
          visible={proposingBundle}
          targetItems={selectedItems.map((i) => ({ id: i.id, name: i.name, points: i.points, ownerId: id!, ownerName: profile.name }))}
          proposerId={userId}
          onClose={() => { setProposingBundle(false); exitSelectMode(); }}
        />
      )}
    </SafeAreaView>
  );
}
