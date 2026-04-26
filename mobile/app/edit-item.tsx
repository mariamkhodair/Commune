import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

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

export default function EditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUser();
  const { t, isRTL } = useLang();

  const [fetching, setFetching] = useState(true);

  // Existing photo URLs to keep
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  // New photos to upload
  const [newPhotos, setNewPhotos] = useState<{ uri: string }[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [points, setPoints] = useState("");
  const [pointsMode, setPointsMode] = useState<"ai" | "manual">("manual");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadItem() {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        Alert.alert("Error", "Item not found.");
        router.back();
        return;
      }

      setExistingPhotos(data.photos ?? []);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setCategory(data.category ?? "");
      setCondition(data.condition ?? "");
      setPoints(String(data.points ?? ""));

      // Determine if brand is in the known list
      const knownBrands = BRANDS[data.category] ?? [];
      if (data.brand && knownBrands.includes(data.brand)) {
        setBrand(data.brand);
      } else if (data.brand) {
        setBrand("Other");
        setCustomBrand(data.brand);
      }

      setFetching(false);
    }
    loadItem();
  }, [id]);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });
    if (!result.canceled) {
      const added = result.assets.map((a) => ({ uri: a.uri }));
      setNewPhotos((prev) => [...prev, ...added].slice(0, 6));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access needed", "Please allow camera access in your device settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      setNewPhotos((prev) => [...prev, { uri: result.assets[0].uri }].slice(0, 6));
    }
  }

  async function analyzeWithAI() {
    if (!name || !category || !condition) {
      Alert.alert(t("newItem.missingInfo"), t("newItem.missingInfoHint")); return;
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
        Alert.alert(t("newItem.aiAnalysis"), `Suggested points value: ${data.points} pts`);
      } else {
        Alert.alert("Error", "Couldn't get a suggestion. Enter points manually.");
      }
    } catch {
      Alert.alert("Error", "AI analysis failed. Enter points manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function uploadNewPhoto(photo: { uri: string }, index: number): Promise<string | null> {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const path = `${userId}/${Date.now()}_edit_${index}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(compressed.uri, { encoding: "base64" });
      const buffer = Buffer.from(base64, "base64");
      const { error } = await supabase.storage.from("item-photos").upload(path, buffer, { upsert: true, contentType: "image/jpeg" });
      if (error) return null;
      const { data } = supabase.storage.from("item-photos").getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  }

  async function handleSave() {
    if (!name.trim() || !category || !condition || !points) {
      Alert.alert(t("newItem.missingFields"), t("newItem.missingFieldsHint")); return;
    }
    setSaving(true);

    const uploadedUrls = await Promise.all(newPhotos.map((p, i) => uploadNewPhoto(p, i)));
    const validNewUrls = uploadedUrls.filter(Boolean) as string[];
    const finalPhotos = [...existingPhotos, ...validNewUrls];

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { Alert.alert("Error", "Not logged in."); setSaving(false); return; }

    const effectiveBrand = brand === "Other" ? customBrand : brand;

    const res = await fetch(`${API_BASE}/api/edit-item`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        itemId: id,
        name: name.trim(),
        category,
        brand: effectiveBrand || null,
        condition,
        description: description.trim() || null,
        points: parseInt(points),
        photos: finalPhotos,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      Alert.alert("Error", body.error ?? "Failed to save changes.");
      return;
    }

    router.replace("/(tabs)/my-stuff");
  }

  const canSave = name.trim() && category && condition && points;

  if (fetching) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator color="#4A3728" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text className="text-2xl font-light text-[#4A3728]">{t("newItem.editHeader")}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>

          {/* Photos */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.photos")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {existingPhotos.map((uri, i) => (
                <View key={`existing-${i}`} style={{ position: "relative" }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setExistingPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="close" size={10} color="#FAF7F2" />
                  </TouchableOpacity>
                </View>
              ))}
              {newPhotos.map((p, i) => (
                <View key={`new-${i}`} style={{ position: "relative" }}>
                  <Image source={{ uri: p.uri }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="cover" />
                  <View style={{ position: "absolute", bottom: 2, left: 2, backgroundColor: "#7A9E6E", borderRadius: 4, paddingHorizontal: 4 }}>
                    <Text style={{ color: "white", fontSize: 8 }}>New</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="close" size={10} color="#FAF7F2" />
                  </TouchableOpacity>
                </View>
              ))}
              {(existingPhotos.length + newPhotos.length) < 6 && (
                <View style={{ gap: 8, flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={takePhoto}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#EDE8DF", borderWidth: 1, borderStyle: "dashed", borderColor: "#C4B9AA", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="camera" size={22} color="#8B7355" />
                    <Text className="text-xs text-[#8B7355] mt-1">{t("newItem.camera")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickPhotos}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#EDE8DF", borderWidth: 1, borderStyle: "dashed", borderColor: "#C4B9AA", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="images-outline" size={22} color="#8B7355" />
                    <Text className="text-xs text-[#8B7355] mt-1">{t("newItem.gallery")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.name")} *</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="e.g. Canon EOS 200D Camera"
              placeholderTextColor="#C4B9AA"
              value={name}
              onChangeText={setName}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.category")} *</Text>
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
              <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.brandOptional")}</Text>
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
                  placeholder={t("newItem.brandNamePlaceholder")}
                  placeholderTextColor="#C4B9AA"
                  value={customBrand}
                  onChangeText={setCustomBrand}
                  textAlign={isRTL ? "right" : "left"}
                />
              )}
            </View>
          ) : null}

          {/* Condition */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.condition")} *</Text>
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
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.description")}</Text>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
              placeholder="Model, size, age, any wear or damage..."
              placeholderTextColor="#C4B9AA"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlign={isRTL ? "right" : "left"}
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>

          {/* Points */}
          <View>
            <Text className="text-sm font-medium text-[#4A3728] mb-2" style={{ textAlign: isRTL ? "right" : "left" }}>{t("newItem.pointsValue")} *</Text>

            <View style={{ flexDirection: "row", borderRadius: 12, borderWidth: 1, borderColor: "#D9CFC4", overflow: "hidden", marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setPointsMode("ai")}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: pointsMode === "ai" ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: pointsMode === "ai" ? "#FAF7F2" : "#6B5040" }}>{t("newItem.aiAnalysis")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPointsMode("manual")}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: pointsMode === "manual" ? "#4A3728" : "white" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: pointsMode === "manual" ? "#FAF7F2" : "#6B5040" }}>{t("newItem.setMyOwn")}</Text>
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
                  : <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>{points ? t("newItem.reanalyse", { pts: points }) : t("newItem.analyseBtn")}</Text>
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
          </View>

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || saving}
            style={{ backgroundColor: (canSave && !saving) ? "#4A3728" : "#D9CFC4", borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
          >
            {saving ? <ActivityIndicator color="#FAF7F2" /> : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 16 }}>{t("newItem.saveChanges")}</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
