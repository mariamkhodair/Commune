import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Modal } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const CATEGORIES = ["Apparel", "Electronics", "Books", "Cosmetics", "Furniture & Home Decor", "Stationery & Art Supplies", "Miscellaneous"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Any"];

type WantedItem = { id: string; name: string; category: string | null; condition: string | null; notes: string | null };

export default function StuffIWant() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchItems();
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

  function resetForm() {
    setName(""); setCategory(""); setCondition(""); setNotes("");
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("wanted_items")
      .insert({
        user_id: userId!,
        name: name.trim(),
        category: category || null,
        condition: condition || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();
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

  const canSave = name.trim() && category && condition;

  return (
    <SafeAreaView className="flex-1">
      <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text className="text-2xl font-light text-[#4A3728]">Stuff I Want</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="flex-row items-center gap-1 bg-[#4A3728] px-3 py-2 rounded-full"
        >
          <Ionicons name="add" size={16} color="#FAF7F2" />
          <Text className="text-[#FAF7F2] text-sm font-medium">Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="star-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">Nothing on your list</Text>
          <Text className="text-[#A09080] text-sm text-center mb-6">Add items you're looking for and we'll notify you when they're listed.</Text>
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-[#4A3728] px-5 py-3 rounded-full">
            <Text className="text-[#FAF7F2] font-medium">Add an Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerClassName="px-5 pb-8 gap-3"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF] flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#EDE8DF] items-center justify-center">
                <Ionicons name="star-outline" size={16} color="#8B7355" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#4A3728]">{item.name}</Text>
                {(item.category || item.condition) ? (
                  <Text className="text-xs text-[#8B7355] mt-0.5">
                    {[item.category, item.condition].filter(Boolean).join(" · ")}
                  </Text>
                ) : null}
                {item.notes ? <Text className="text-xs text-[#A09080] mt-0.5" numberOfLines={2}>{item.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} className="p-1">
                <Ionicons name="trash-outline" size={16} color="#C4B9AA" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { resetForm(); setShowForm(false); }}>
        <ScrollView style={{ flex: 1, backgroundColor: "#FAF7F2" }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#4A3728" }}>Add to Wish List</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }}>
              <Ionicons name="close" size={22} color="#8B7355" />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 6 }}>Item Name</Text>
          <TextInput
            style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", marginBottom: 16, fontSize: 14 }}
            placeholder="e.g. Vintage Denim Jacket"
            placeholderTextColor="#C4B9AA"
            value={name}
            onChangeText={setName}
          />

          {/* Category */}
          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 8 }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start",
                  borderColor: category === c ? "#4A3728" : "#D9CFC4",
                  backgroundColor: category === c ? "#4A3728" : "white",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Condition */}
          <Text style={{ fontSize: 13, color: "#6B5040", marginBottom: 8 }}>Condition</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCondition(c)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start",
                  borderColor: condition === c ? "#4A3728" : "#D9CFC4",
                  backgroundColor: condition === c ? "#4A3728" : "white",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: condition === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
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
