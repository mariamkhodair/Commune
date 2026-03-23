import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const CATEGORIES = ["Clothes", "Books", "Electronics", "Home", "Toys", "Sports", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function NewItem() {
  const router = useRouter();
  const { userId } = useUser();
  const [photos, setPhotos] = useState<{ uri: string; file?: { uri: string; type: string; name: string } }[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [points, setPoints] = useState("");
  const [saving, setSaving] = useState(false);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map((a) => ({
        uri: a.uri,
        file: { uri: a.uri, type: a.mimeType ?? "image/jpeg", name: a.fileName ?? `photo_${Date.now()}.jpg` },
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhoto(photo: { uri: string; file?: { uri: string; type: string; name: string } }, index: number): Promise<string | null> {
    if (!photo.file) return null;
    try {
      const ext = photo.file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}_${index}.${ext}`;
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from("item-photos").upload(path, blob, { contentType: photo.file.type });
      if (error) return null;
      const { data } = supabase.storage.from("item-photos").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !category || !condition || !points) {
      Alert.alert("Missing fields", "Please fill in all required fields."); return;
    }
    setSaving(true);
    const uploadedUrls = await Promise.all(photos.map((p, i) => uploadPhoto(p, i)));
    const validUrls = uploadedUrls.filter(Boolean) as string[];

    const { error } = await supabase.from("items").insert({
      owner_id: userId!,
      name: name.trim(),
      description: description.trim() || null,
      category,
      condition,
      points: parseInt(points),
      photos: validUrls,
      status: "Available",
    });
    setSaving(false);

    if (error) { Alert.alert("Error", "Failed to list item. Please try again."); return; }
    router.replace("/(tabs)/my-stuff");
  }

  const canSubmit = name.trim() && category && condition && points;

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text className="text-2xl font-light text-[#4A3728]">List an Item</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10 gap-4">
          {/* Photos */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {photos.map((p, i) => (
                <View key={i} className="relative">
                  <Image source={{ uri: p.uri }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4A3728] items-center justify-center"
                  >
                    <Ionicons name="close" size={10} color="#FAF7F2" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 6 && (
                <TouchableOpacity
                  onPress={pickPhotos}
                  className="w-20 h-20 rounded-xl bg-[#EDE8DF] border border-dashed border-[#C4B9AA] items-center justify-center"
                >
                  <Ionicons name="camera-outline" size={22} color="#8B7355" />
                  <Text className="text-xs text-[#8B7355] mt-1">Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text className="text-xs text-[#A09080] mt-1">Select multiple photos at once · up to 6</Text>
          </View>

          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Item Name *</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="e.g. Blue denim jacket"
              placeholderTextColor="#C4B9AA"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Description</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="Any details worth mentioning..."
              placeholderTextColor="#C4B9AA"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full border ${category === c ? "bg-[#4A3728] border-[#4A3728]" : "bg-white border-[#D9CFC4]"}`}
                >
                  <Text className={`text-sm ${category === c ? "text-[#FAF7F2]" : "text-[#6B5040]"}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Condition */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Condition *</Text>
            <View className="flex-row gap-2">
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCondition(c)}
                  className={`flex-1 py-2 rounded-full border items-center ${condition === c ? "bg-[#4A3728] border-[#4A3728]" : "bg-white border-[#D9CFC4]"}`}
                >
                  <Text className={`text-xs ${condition === c ? "text-[#FAF7F2]" : "text-[#6B5040]"}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Points */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Points Value *</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="e.g. 150"
              placeholderTextColor="#C4B9AA"
              value={points}
              onChangeText={(v) => setPoints(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
            />
            <Text className="text-xs text-[#A09080] mt-1">Based on the item's approximate market value in EGP.</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
            className={`rounded-full py-4 items-center mt-2 ${canSubmit && !saving ? "bg-[#4A3728]" : "bg-[#D9CFC4]"}`}
          >
            {saving ? <ActivityIndicator color="#FAF7F2" /> : <Text className="text-[#FAF7F2] font-semibold text-base">List This Item</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
