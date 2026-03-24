import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type TargetItem = { id: string; name: string; points: number; ownerId: string; ownerName: string };
type MyItem = { id: string; name: string; category: string; points: number };

function suggestBundle(target: number, items: MyItem[]): Set<string> {
  const capped = items.slice(0, 18);
  const n = capped.length;
  let bestDiff = Infinity;
  let bestSubset: string[] = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: string[] = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) { subset.push(capped[i].id); total += capped[i].points; }
    }
    const diff = Math.abs(total - target);
    if (diff < bestDiff) { bestDiff = diff; bestSubset = subset; }
  }
  return new Set(bestSubset);
}

export default function ProposeSwapModal({
  visible,
  targetItems,
  proposerId,
  onClose,
}: {
  visible: boolean;
  targetItems: TargetItem[];
  proposerId: string;
  onClose: () => void;
}) {
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [theirWanted, setTheirWanted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const receiverId = targetItems[0]?.ownerId;
  const ownerName = targetItems[0]?.ownerName ?? "";
  const theirTotal = targetItems.reduce((s, i) => s + i.points, 0);

  useEffect(() => {
    if (!visible || !receiverId) return;
    setSubmitted(false);
    setLoading(true);
    setMyItems([]);
    setSelected(new Set());

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id;
      if (!myId) { setLoading(false); return; }

      const [{ data: itemsData }, { data: wantedData }] = await Promise.all([
        supabase.from("items").select("id, name, category, points")
          .eq("owner_id", myId).neq("status", "Swapped"),
        supabase.from("wanted_items").select("name").eq("user_id", receiverId),
      ]);
      const fetched = (itemsData ?? []) as MyItem[];
      const wanted = ((wantedData ?? []) as { name: string }[]).map((w) => w.name.toLowerCase());
      setMyItems(fetched);
      setTheirWanted(wanted);
      setSelected(suggestBundle(theirTotal, fetched));
      setLoading(false);
    }
    fetchData();
  }, [visible, receiverId, theirTotal]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!receiverId || selected.size === 0) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const myId = user?.id ?? proposerId;

    const selectedItems = myItems.filter((i) => selected.has(i.id));
    const myTotal = selectedItems.reduce((s, i) => s + i.points, 0);

    const { data: swapData, error } = await supabase
      .from("swaps")
      .insert({
        proposer_id: myId,
        receiver_id: receiverId,
        status: "Proposed",
      })
      .select("id")
      .single();

    if (error || !swapData) {
      setSubmitting(false);
      Alert.alert("Error", error?.message ?? "Could not send proposal. Please try again.");
      return;
    }

    const swapItems = [
      ...selectedItems.map((i) => ({ swap_id: swapData.id, item_id: i.id })),
      ...targetItems.map((i) => ({ swap_id: swapData.id, item_id: i.id })),
    ];
    await supabase.from("swap_items").insert(swapItems);
    setSubmitting(false);
    setSubmitted(true);
  }

  if (!visible) return null;

  const selectedItems = myItems.filter((i) => selected.has(i.id));
  const myTotal = selectedItems.reduce((s, i) => s + i.points, 0);
  const diff = myTotal - theirTotal;
  const balanced = Math.abs(diff) <= 50;
  const satisfiesTheirWant =
    theirWanted.length === 0 ||
    selectedItems.some((i) =>
      theirWanted.some((w) => i.name.toLowerCase().includes(w) || w.includes(i.name.toLowerCase()))
    );

  return (
    // Absolute overlay — more reliable than Modal in Expo Go
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(74,55,40,0.4)" }}
      />

      {/* Sheet */}
      <View style={{ backgroundColor: "#FAF7F2", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: SCREEN_HEIGHT * 0.88, paddingBottom: 34 }}>

        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D9CFC4" }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#4A3728" }}>Propose a Swap</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={14} color="#8B7355" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>

          {submitted ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🤝🏽</Text>
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#4A3728", marginBottom: 6 }}>Proposal sent!</Text>
              <Text style={{ fontSize: 13, color: "#6B5040", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
                {ownerName} will be notified and can accept or decline your offer.
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32 }}
              >
                <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* What you want */}
              <View style={{ backgroundColor: "#EDE8DF", borderRadius: 14, padding: 14 }}>
                <Text style={{ fontSize: 11, color: "#A09080", marginBottom: 8 }}>You want</Text>
                {targetItems.map((item) => (
                  <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#D9CFC4" }}>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728", flex: 1 }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#4A3728" }}>{item.points} pts</Text>
                  </View>
                ))}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#C4B9AA" }}>
                  <Text style={{ fontSize: 11, color: "#8B7355" }}>Listed by {ownerName}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#4A3728" }}>{theirTotal} pts total</Text>
                </View>
              </View>

              {loading ? (
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <ActivityIndicator color="#4A3728" />
                  <Text style={{ fontSize: 12, color: "#8B7355", marginTop: 8 }}>Loading your items…</Text>
                </View>
              ) : myItems.length === 0 ? (
                <View style={{ backgroundColor: "#ECD8D4", borderRadius: 14, padding: 16, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#8B3A2A", marginBottom: 4 }}>You have no listed items</Text>
                  <Text style={{ fontSize: 12, color: "#8B3A2A", textAlign: "center" }}>List some items first before proposing a swap.</Text>
                </View>
              ) : (
                <>
                  {/* AI suggestion */}
                  <View style={{ backgroundColor: "#D8E4D0", borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                    <Ionicons name="bulb-outline" size={14} color="#4A6640" style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#4A6640", marginBottom: 2 }}>AI suggested bundle</Text>
                      <Text style={{ fontSize: 11, color: "#4A6640", lineHeight: 16 }}>We've pre-selected your items closest in value to theirs.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelected(suggestBundle(theirTotal, myItems))}>
                      <Text style={{ fontSize: 11, color: "#4A6640", fontWeight: "600", textDecorationLine: "underline" }}>Reset</Text>
                    </TouchableOpacity>
                  </View>

                  {theirWanted.length > 0 && (
                    <View style={{ backgroundColor: "#F5F0E8", borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 12, color: "#6B5040", lineHeight: 18 }}>
                        <Text style={{ fontWeight: "600" }}>{ownerName}</Text>{" is looking for: "}
                        <Text style={{ fontWeight: "600", color: "#4A3728" }}>{theirWanted.join(", ")}</Text>
                        {". Items marked 🤝🏽 match."}
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 14, fontWeight: "500", color: "#4A3728" }}>Offer from your listings</Text>
                  <View style={{ gap: 8 }}>
                    {myItems.map((item) => {
                      const isSelected = selected.has(item.id);
                      const wantedByThem = theirWanted.some(
                        (w) => item.name.toLowerCase().includes(w) || w.includes(item.name.toLowerCase())
                      );
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => toggle(item.id)}
                          style={{
                            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                            padding: 12, borderRadius: 12, borderWidth: 1.5,
                            borderColor: isSelected ? "#4A3728" : wantedByThem ? "#7A9E6E" : "#D9CFC4",
                            backgroundColor: isSelected ? "rgba(74,55,40,0.05)" : wantedByThem ? "rgba(216,228,208,0.4)" : "white",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728" }}>{item.name}</Text>
                              {wantedByThem && <Text>🤝🏽</Text>}
                            </View>
                            <Text style={{ fontSize: 11, color: "#8B7355" }}>{item.category}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#4A3728" }}>{item.points} pts</Text>
                            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: isSelected ? "#4A3728" : "#D9CFC4", backgroundColor: isSelected ? "#4A3728" : "transparent", alignItems: "center", justifyContent: "center" }}>
                              {isSelected && <Ionicons name="checkmark" size={11} color="white" />}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selected.size > 0 && (
                    <View style={{ gap: 8 }}>
                      <View style={{ backgroundColor: balanced ? "#D8E4D0" : "#ECD8D4", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: balanced ? "#4A6640" : "#8B3A2A" }}>
                            {balanced ? "Points balanced" : diff > 0 ? `Offering ${diff} pts more` : `${Math.abs(diff)} pts short`}
                          </Text>
                          <Text style={{ fontSize: 11, color: balanced ? "#4A6640" : "#8B3A2A" }}>
                            Your offer: {myTotal} pts · Their items: {theirTotal} pts
                          </Text>
                        </View>
                        <Text>{balanced ? "✓" : "⚠️"}</Text>
                      </View>
                      {theirWanted.length > 0 && (
                        <View style={{ backgroundColor: satisfiesTheirWant ? "#D8E4D0" : "#E4E0D0", borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: satisfiesTheirWant ? "#4A6640" : "#6B5040" }}>
                            {satisfiesTheirWant
                              ? `Your offer includes something ${ownerName} is looking for ✓`
                              : `None of your items match ${ownerName}'s want list ⚠️`}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={selected.size === 0 || submitting || loading || myItems.length === 0}
                style={{
                  backgroundColor: (selected.size === 0 || submitting || loading || myItems.length === 0) ? "#D9CFC4" : "#4A3728",
                  borderRadius: 999, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
                }}
              >
                {submitting
                  ? <ActivityIndicator color="#FAF7F2" size="small" />
                  : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>Send Proposal</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
