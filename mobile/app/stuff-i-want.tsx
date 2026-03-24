import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type WantedItem = { id: string; name: string; description: string; created_at: string };

export default function StuffIWant() {
  const router = useRouter();
  const { userId } = useUser();
  const [items, setItems] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("wanted_items")
      .insert({ user_id: userId!, name: name.trim(), description: description.trim() || null })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setName(""); setDescription(""); setShowForm(false);
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
                {item.description ? <Text className="text-xs text-[#8B7355] mt-0.5" numberOfLines={2}>{item.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} className="p-1">
                <Ionicons name="trash-outline" size={16} color="#C4B9AA" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-[#FAF7F2] px-6 pt-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-semibold text-[#4A3728]">Add to Wish List</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={22} color="#8B7355" />
            </TouchableOpacity>
          </View>
          <View className="gap-3">
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="What are you looking for? *"
              placeholderTextColor="#C4B9AA"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="Any details? (optional)"
              placeholderTextColor="#C4B9AA"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top" }}
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!name.trim() || saving}
              className={`rounded-full py-4 items-center mt-2 ${name.trim() ? "bg-[#4A3728]" : "bg-[#D9CFC4]"}`}
            >
              {saving ? <ActivityIndicator color="#FAF7F2" /> : <Text className="text-[#FAF7F2] font-semibold">Add to List</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
