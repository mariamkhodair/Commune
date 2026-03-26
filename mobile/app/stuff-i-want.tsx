import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Modal, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { notifyUser } from "@/lib/notifySwap";

const CATEGORIES = ["Apparel", "Electronics", "Books", "Cosmetics", "Furniture & Home Decor", "Stationery & Art Supplies", "Miscellaneous"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Any"];

type WantedItem = { id: string; name: string; category: string | null; condition: string | null; notes: string | null };
type LikedItem = { id: string; name: string; condition: string; points: number; photos: string[]; owner: string; ownerId: string; status: string };

type Match = {
  itemId: string;
  member: string;
  memberId: string;
  theirItem: { name: string; category: string; points: number };
  matchedWant: string;
  yourItem: { id: string; name: string; points: number } | null;
  pointsDiff: number;
};

export default function StuffIWant() {
  const router = useRouter();
  const { userId } = useUser();
  const [tab, setTab] = useState<"want" | "liked">("want");

  // Want list state
  const [items, setItems] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [realMatches, setRealMatches] = useState<Match[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  // Liked stuff state
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [likedLoading, setLikedLoading] = useState(true);
  const [likedRefreshing, setLikedRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchItems();
    fetchLiked();
  }, [userId]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from("wanted_items")
      .select("*")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  async function fetchLiked() {
    setLikedLoading(true);
    const { data } = await supabase
      .from("item_likes")
      .select("item_id, items(id, name, condition, points, photos, status, owner_id, profiles(id, name))")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLikedItems((data ?? []).map((row: any) => {
      const item = row.items;
      const profile = Array.isArray(item?.profiles) ? item.profiles[0] : item?.profiles;
      return { id: item?.id, name: item?.name, condition: item?.condition, points: item?.points, photos: item?.photos ?? [], owner: profile?.name ?? "Unknown", ownerId: item?.owner_id, status: item?.status ?? "Available" };
    }).filter((i: any) => i.id));
    setLikedLoading(false);
  }

  async function unlike(itemId: string) {
    setLikedItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId!);
  }

  async function runMatch() {
    if (!items.length) { Alert.alert("Add items first", "Add some items to your wish list before matching."); return; }
    setMatching(true);

    const { data: myItems } = await supabase
      .from("items").select("id, name, points")
      .eq("owner_id", userId!).eq("status", "Available");

    const results: Match[] = [];
    const seenIds = new Set<string>();

    for (const want of items) {
      const filters: string[] = [];
      if (want.category) filters.push(`category.eq.${want.category}`);
      const keywords = want.name.split(/\s+/).filter((w) => w.length > 3).slice(0, 2);
      for (const kw of keywords) {
        const safe = kw.replace(/[^a-zA-Z0-9]/g, "");
        if (safe) filters.push(`name.ilike.%${safe}%`);
      }
      if (!filters.length) continue;

      const { data: matched } = await supabase
        .from("items").select("id, name, category, points, owner_id")
        .neq("owner_id", userId!).eq("status", "Available")
        .or(filters.join(",")).limit(5);

      for (const item of matched ?? []) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);

        const { data: p } = await supabase.from("profiles").select("name").eq("id", item.owner_id).single();
        const bestOffer = [...(myItems ?? [])]
          .sort((a, b) => Math.abs(a.points - item.points) - Math.abs(b.points - item.points))[0] ?? null;

        results.push({
          itemId: item.id,
          member: p?.name ?? "Unknown",
          memberId: item.owner_id,
          theirItem: { name: item.name, category: item.category ?? "", points: item.points },
          matchedWant: want.name,
          yourItem: bestOffer ?? null,
          pointsDiff: bestOffer ? Math.abs(bestOffer.points - item.points) : 0,
        });
      }
    }

    setRealMatches(results);
    setMatching(false);
    setShowMatchResults(true);
  }

  async function sendProposals() {
    for (const itemId of selectedMatches) {
      const match = realMatches.find((m) => m.itemId === itemId);
      if (!match?.yourItem) continue;

      const { data: swap } = await supabase
        .from("swaps").insert({ proposer_id: userId, receiver_id: match.memberId, status: "Proposed" })
        .select("id").single();

      if (swap) {
        await supabase.from("swap_items").insert([
          { swap_id: swap.id, item_id: match.yourItem.id, side: "proposer" },
          { swap_id: swap.id, item_id: match.itemId, side: "receiver" },
        ]);
        const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
        notifyUser({
          userId: match.memberId,
          type: "proposal",
          title: "New swap proposal",
          body: `${myProfile?.name ?? "Someone"} proposed a swap with you.`,
          swapId: swap.id,
        });
      }
    }
    setShowMatchResults(false);
    setSelectedMatches(new Set());
    router.push("/my-swaps" as any);
  }

  function resetForm() {
    setName(""); setCategory(""); setCondition(""); setNotes("");
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("wanted_items")
      .insert({ user_id: userId!, name: name.trim(), category: category || null, notes: notes.trim() || null })
      .select().single();
    setSaving(false);
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      resetForm();
      setShowForm(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert("Remove item?", "This will be removed from your wish list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          setItems((prev) => prev.filter((i) => i.id !== id));
          await supabase.from("wanted_items").delete().eq("id", id).eq("user_id", userId!);
        },
      },
    ]);
  }

  const canSave = name.trim() && category;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
              <Ionicons name="arrow-back" size={18} color="#4A3728" />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>Stuff I Want</Text>
          </View>
          {tab === "want" && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={runMatch}
                disabled={matching}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#4A3728", opacity: matching ? 0.6 : 1 }}
              >
                {matching
                  ? <ActivityIndicator size="small" color="#4A3728" />
                  : <Text style={{ fontSize: 13, color: "#4A3728", fontWeight: "500" }}>🤝🏽 Match Me</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#4A3728", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
              >
                <Ionicons name="add" size={16} color="#FAF7F2" />
                <Text style={{ color: "#FAF7F2", fontSize: 13, fontWeight: "500" }}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: "center" }}>
          {(["want", "liked"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
                borderColor: tab === t ? "#4A3728" : "#D9CFC4",
                backgroundColor: tab === t ? "#4A3728" : "white",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: tab === t ? "#FAF7F2" : "#6B5040" }}>
                {t === "want" ? "My Want List" : `Liked Stuff${likedItems.length > 0 ? ` (${likedItems.length})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Want List content */}
      {tab === "want" && (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#4A3728" /></View>
          ) : items.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <Ionicons name="star-outline" size={40} color="#C4B9AA" />
              <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 4 }}>Nothing on your list</Text>
              <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Add items you're looking for and we'll notify you when they're listed.</Text>
              <TouchableOpacity onPress={() => setShowForm(true)} style={{ backgroundColor: "#4A3728", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 }}>
                <Text style={{ color: "#FAF7F2", fontWeight: "500" }}>Add an Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await fetchItems(); setRefreshing(false); }}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#EDE8DF", flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="star-outline" size={16} color="#8B7355" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{item.name}</Text>
                    {(item.category || item.condition) ? (
                      <Text style={{ fontSize: 11, color: "#8B7355", marginTop: 2 }}>
                        {[item.category, item.condition].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                    {item.notes ? <Text style={{ fontSize: 11, color: "#A09080", marginTop: 2 }} numberOfLines={2}>{item.notes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color="#C4B9AA" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Liked Stuff content */}
      {tab === "liked" && (
        <View style={{ flex: 1 }}>
          {likedLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#4A3728" /></View>
          ) : likedItems.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <Ionicons name="heart-outline" size={40} color="#C4B9AA" />
              <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 4 }}>Nothing liked yet</Text>
              <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center" }}>Browse items and heart the ones you want.</Text>
            </View>
          ) : (
            <FlatList
              data={likedItems}
              keyExtractor={(i) => i.id}
              numColumns={2}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
              columnWrapperStyle={{ gap: 12 }}
              showsVerticalScrollIndicator={false}
              refreshing={likedRefreshing}
              onRefresh={async () => { setLikedRefreshing(true); await fetchLiked(); setLikedRefreshing(false); }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/items/${item.id}` as any)}
                  style={{ flex: 1, backgroundColor: "white", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}
                >
                  <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center" }}>
                    {item.photos[0] ? (
                      <Image source={{ uri: item.photos[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={28} color="#C4B9AA" />
                    )}
                    <TouchableOpacity
                      onPress={() => unlike(item.id)}
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" }}
                    >
                      <Ionicons name="heart" size={16} color="#A0624A" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: "#8B7355" }}>{item.condition}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#4A3728" }}>{item.points} pts</Text>
                      <View style={{ backgroundColor: item.status === "Swapped" ? "#DDD8C8" : "#D8E4D0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: item.status === "Swapped" ? "#6B5040" : "#4A6640" }}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Match Results Modal */}
      <Modal visible={showMatchResults} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMatchResults(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: "#FAF7F2" }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🤝🏽</Text>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#4A3728" }}>Matches Found</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMatchResults(false)}>
              <Ionicons name="close" size={22} color="#8B7355" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: "#8B7355", marginBottom: 20 }}>
            {realMatches.length
              ? `${realMatches.length} potential match${realMatches.length > 1 ? "es" : ""} based on your want list. Select ones to propose.`
              : "No matches found yet — check back as more members list items."}
          </Text>

          <View style={{ gap: 12, marginBottom: 20 }}>
            {realMatches.map((match) => {
              const isSelected = selectedMatches.has(match.itemId);
              return (
                <TouchableOpacity
                  key={match.itemId}
                  onPress={() => setSelectedMatches((prev) => {
                    const next = new Set(prev);
                    next.has(match.itemId) ? next.delete(match.itemId) : next.add(match.itemId);
                    return next;
                  })}
                  style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 2, borderColor: isSelected ? "#4A3728" : "#EDE8DF", overflow: "hidden" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EDE8DF" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#FAF7F2", fontSize: 12, fontWeight: "600" }}>{match.member[0]}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{match.member}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ backgroundColor: match.pointsDiff <= 50 ? "#D8E4D0" : "#EDE8DF", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: match.pointsDiff <= 50 ? "#4A6640" : "#6B5040" }}>
                          {match.pointsDiff === 0 ? "Exact" : `±${match.pointsDiff} pts`}
                        </Text>
                      </View>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: isSelected ? "#4A3728" : "#D9CFC4", backgroundColor: isSelected ? "#4A3728" : "white", alignItems: "center", justifyContent: "center" }}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", paddingHorizontal: 14, paddingVertical: 12, gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: "#A09080", marginBottom: 4 }}>They offer</Text>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728" }}>{match.theirItem.name}</Text>
                      <Text style={{ fontSize: 11, color: "#8B7355" }}>{match.theirItem.category}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#4A3728", marginTop: 2 }}>{match.theirItem.points} pts</Text>
                    </View>
                    <Ionicons name="swap-horizontal" size={18} color="#C4B9AA" style={{ marginTop: 16 }} />
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 10, color: "#A09080", marginBottom: 4 }}>You offer</Text>
                      {match.yourItem ? (
                        <>
                          <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728", textAlign: "right" }}>{match.yourItem.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#4A3728", marginTop: 2 }}>{match.yourItem.points} pts</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 11, color: "#A09080", textAlign: "right" }}>List items first</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 10, color: "#A09080" }}>Matches your want: <Text style={{ fontStyle: "italic" }}>{match.matchedWant}</Text></Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={sendProposals}
            disabled={selectedMatches.size === 0}
            style={{ borderRadius: 999, paddingVertical: 16, alignItems: "center", backgroundColor: selectedMatches.size === 0 ? "#D9CFC4" : "#4A3728", marginBottom: 10 }}
          >
            <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>
              {selectedMatches.size === 0
                ? "Select a match to propose"
                : selectedMatches.size === realMatches.length
                ? "Send All Proposals"
                : `Send ${selectedMatches.size} Proposal${selectedMatches.size > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMatchResults(false)}
            style={{ borderRadius: 999, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#D9CFC4" }}
          >
            <Text style={{ color: "#6B5040", fontSize: 14 }}>Review Later</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Add Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { resetForm(); setShowForm(false); }}>
        <ScrollView style={{ flex: 1, backgroundColor: "#FAF7F2" }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#4A3728" }}>Add to Wish List</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }}>
              <Ionicons name="close" size={22} color="#8B7355" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 6 }}>Item Name</Text>
          <TextInput
            style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", marginBottom: 16, fontSize: 14 }}
            placeholder="e.g. Vintage Denim Jacket"
            placeholderTextColor="#C4B9AA"
            value={name}
            onChangeText={setName}
          />

          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 8 }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start", borderColor: category === c ? "#4A3728" : "#D9CFC4", backgroundColor: category === c ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 8 }}>Condition</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCondition(c)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start", borderColor: condition === c ? "#4A3728" : "#D9CFC4", backgroundColor: condition === c ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: condition === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 6 }}>
            Notes <Text style={{ color: "#A09080" }}>(optional)</Text>
          </Text>
          <TextInput
            style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", marginBottom: 24, fontSize: 14, textAlignVertical: "top" }}
            placeholder="Any specifics — size, colour, brand, model..."
            placeholderTextColor="#C4B9AA"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            onPress={handleAdd}
            disabled={!canSave || saving}
            style={{ borderRadius: 999, paddingVertical: 16, alignItems: "center", backgroundColor: canSave ? "#4A3728" : "#D9CFC4" }}
          >
            {saving ? <ActivityIndicator color="#FAF7F2" /> : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>Add to List</Text>}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}
