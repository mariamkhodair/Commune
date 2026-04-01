import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const CATEGORIES = ["Apparel", "Electronics", "Books", "Cosmetics", "Furniture & Home Decor", "Stationery & Art Supplies", "Miscellaneous"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];
const BRANDS: Record<string, string[]> = {
  "Apparel": ["Adidas", "Bershka", "Calvin Klein", "H&M", "Levi's", "Mango", "Nike", "Pull&Bear", "Puma", "Ralph Lauren", "Tommy Hilfiger", "Zara", "Other"],
  "Electronics": ["Apple", "Asus", "Bose", "Canon", "Dell", "HP", "Huawei", "JBL", "Lenovo", "LG", "Nikon", "Samsung", "Sony", "Xiaomi", "Other"],
  "Books": ["AUC Press", "Dar El Shorouk", "HarperCollins", "Penguin", "Random House", "Oxford University Press", "Other"],
  "Cosmetics": ["Benefit", "Charlotte Tilbury", "Chanel", "Clinique", "Dior", "Fenty Beauty", "Huda Beauty", "L'Oréal", "MAC", "Maybelline", "NARS", "NYX", "Other"],
  "Furniture & Home Decor": ["IKEA", "H&M Home", "Pottery Barn", "West Elm", "Zara Home", "Other"],
  "Stationery & Art Supplies": ["Copic", "Faber-Castell", "Moleskine", "Muji", "Pilot", "Prismacolor", "Staedtler", "Other"],
  "Miscellaneous": ["Other"],
};

const API_BASE = "https://commune-neon.vercel.app";

export default function NewItem() {
  const router = useRouter();
  const { userId } = useUser();
  const [photos, setPhotos] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [points, setPoints] = useState("");
  const [pointsMode, setPointsMode] = useState<"ai" | "manual">("ai");
  const [analyzing, setAnalyzing] = useState(false);
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
        type: a.mimeType ?? "image/jpeg",
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access needed", "Please allow camera access in your device settings.");
      return;
    }
    await takePhotoLoop();
  }

  async function takePhotoLoop() {
    // Keep a local ref to current count so we can check the cap without stale closure
    let currentCount = 0;
    setPhotos((prev) => { currentCount = prev.length; return prev; });
    if (currentCount >= 6) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    const a = result.assets[0];
    const newPhoto = { uri: a.uri, type: a.mimeType ?? "image/jpeg", name: a.fileName ?? `photo_${Date.now()}.jpg` };
    let updatedCount = 0;
    setPhotos((prev) => {
      const next = [...prev, newPhoto].slice(0, 6);
      updatedCount = next.length;
      return next;
    });

    if (updatedCount < 6) {
      Alert.alert("Photo added!", `${updatedCount} photo${updatedCount !== 1 ? "s" : ""} so far.`, [
        { text: "Add More Photos", onPress: () => takePhotoLoop() },
        { text: "Done", style: "cancel" },
      ]);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function analyzeWithAI() {
    if (!name || !category || !condition) {
      Alert.alert("Missing info", "Fill in name, category and condition first."); return;
    }
    setAnalyzing(true);
    try {
      const effectiveBrand = brand === "Other" ? customBrand : brand;
      const res = await fetch(`${API_BASE}/api/analyze-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand: effectiveBrand, category, condition, description }),
      });
      const data = await res.json();
      if (data.points) {
        setPoints(String(data.points));
        Alert.alert("AI Suggestion", `Suggested points value: ${data.points} pts\n\nYou can adjust this before listing.`);
      } else {
        Alert.alert("Error", "Couldn't get a suggestion. Enter points manually.");
      }
    } catch {
      Alert.alert("Error", "AI analysis failed. Enter points manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function uploadPhoto(photo: { uri: string }, index: number): Promise<string | null> {
    try {
      // Convert to JPEG so it displays correctly on all platforms (handles HEIC etc.)
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const path = `${userId}/${Date.now()}_${index}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(compressed.uri, { encoding: "base64" });
      const buffer = Buffer.from(base64, "base64");
      const { error } = await supabase.storage.from("item-photos").upload(path, buffer, { upsert: true, contentType: "image/jpeg" });
      if (error) return null;
      const { data } = supabase.storage.from("item-photos").getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  }

  async function handleSubmit() {
    if (!name.trim() || !category || !condition || !points) {
      Alert.alert("Missing fields", "Please fill in all required fields."); return;
    }
    setSaving(true);
    const uploadedUrls = await Promise.all(photos.map((p, i) => uploadPhoto(p, i)));
    const validUrls = uploadedUrls.filter(Boolean) as string[];
    const effectiveBrand = brand === "Other" ? customBrand : brand;

    const { error } = await supabase.from("items").insert({
      owner_id: userId!,
      name: name.trim(),
      description: description.trim() || null,
      category,
      brand: effectiveBrand || null,
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
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text className="text-2xl font-light text-[#4A3728]">List an Item</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>

          {/* Photos */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {photos.map((p, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <Image source={{ uri: p.uri }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => removePhoto(i)}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="close" size={10} color="#FAF7F2" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 6 && (
                <View style={{ gap: 8, flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={takePhoto}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#EDE8DF", borderWidth: 1, borderStyle: "dashed", borderColor: "#C4B9AA", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="camera" size={22} color="#8B7355" />
                    <Text className="text-xs text-[#8B7355] mt-1">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickPhotos}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#EDE8DF", borderWidth: 1, borderStyle: "dashed", borderColor: "#C4B9AA", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="images-outline" size={22} color="#8B7355" />
                    <Text className="text-xs text-[#8B7355] mt-1">Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            <Text className="text-xs text-[#A09080] mt-1">Take photos with camera or select from gallery · up to 6</Text>
          </View>

          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Item Name *</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="e.g. Canon EOS 200D Camera"
              placeholderTextColor="#C4B9AA"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setCategory(c); setBrand(""); setCustomBrand(""); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start", borderColor: category === c ? "#4A3728" : "#D9CFC4", backgroundColor: category === c ? "#4A3728" : "white" }}
                >
                  <Text style={{ fontSize: 12, color: category === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Brand */}
          {category ? (
            <View>
              <Text className="text-sm font-medium text-[#4A3728] mb-2">Brand <Text className="text-[#A09080] font-normal">(optional)</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
                {(BRANDS[category] ?? ["Other"]).map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setBrand(b)}
                    style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start", borderColor: brand === b ? "#4A3728" : "#D9CFC4", backgroundColor: brand === b ? "#4A3728" : "white" }}
                  >
                    <Text style={{ fontSize: 12, color: brand === b ? "#FAF7F2" : "#6B5040" }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {brand === "Other" && (
                <TextInput
                  className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF] mt-2"
                  placeholder="Enter brand name"
                  placeholderTextColor="#C4B9AA"
                  value={customBrand}
                  onChangeText={setCustomBrand}
                />
              )}
            </View>
          ) : null}

          {/* Condition */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Condition *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCondition(c)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: condition === c ? "#4A3728" : "#D9CFC4", backgroundColor: condition === c ? "#4A3728" : "white" }}
                >
                  <Text style={{ fontSize: 12, color: condition === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Description</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="Model, size, age, any wear or damage..."
              placeholderTextColor="#C4B9AA"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>

          {/* Points */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2">Points Value *</Text>

            {/* Mode toggle */}
            <View style={{ flexDirection: "row", borderRadius: 12, borderWidth: 1, borderColor: "#D9CFC4", overflow: "hidden", marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setPointsMode("ai")}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: pointsMode === "ai" ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: pointsMode === "ai" ? "#FAF7F2" : "#6B5040" }}>AI Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPointsMode("manual")}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: pointsMode === "manual" ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: pointsMode === "manual" ? "#FAF7F2" : "#6B5040" }}>Set My Own</Text>
              </TouchableOpacity>
            </View>

            {pointsMode === "ai" ? (
              <TouchableOpacity
                onPress={analyzeWithAI}
                disabled={analyzing || !name || !category || !condition}
                style={{ backgroundColor: (!name || !category || !condition) ? "#D9CFC4" : "#4A3728", borderRadius: 999, paddingVertical: 14, alignItems: "center" }}
              >
                {analyzing
                  ? <ActivityIndicator color="#FAF7F2" />
                  : <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>{points ? `${points} pts — Re-analyse` : "Analyse & Get Points Value"}</Text>
                }
              </TouchableOpacity>
            ) : (
              <TextInput
                className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
                placeholder="e.g. 350"
                placeholderTextColor="#C4B9AA"
                value={points}
                onChangeText={(v) => setPoints(v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
              />
            )}
            {points ? <Text className="text-xs text-[#4A6640] mt-1">✓ {points} pts set</Text> : null}
            <Text className="text-xs text-[#A09080] mt-1">Based on the item's approximate market value in EGP.</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
            style={{ backgroundColor: (canSubmit && !saving) ? "#4A3728" : "#D9CFC4", borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
          >
            {saving ? <ActivityIndicator color="#FAF7F2" /> : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 16 }}>List This Item</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
