import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

type OwnItem = { id: string; name: string; category: string; points: number; photos: string[]; status: string };

export default function ProfilePage() {
  const router = useRouter();
  const { userId, profile } = useUser();
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<OwnItem[]>([]);

  // Edit form state
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setArea(profile.area ?? "");
    setCity(profile.city ?? "");
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  async function fetchItems() {
    if (!userId) return;
    const { data } = await supabase.from("items").select("id, name, category, points, photos, status")
      .eq("owner_id", userId).order("created_at", { ascending: false });
    setItems((data ?? []).map((i: any) => ({ ...i, photos: i.photos ?? [] })));
  }

  useEffect(() => {
    fetchItems();
  }, [userId]);

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow access to your photo library."); return; }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets[0] || !userId) return;

    setUploading(true);
    const compressed = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    const path = `${userId}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(compressed.uri, { encoding: "base64" });
    const buffer = Buffer.from(base64, "base64");
    const { error } = await supabase.storage.from("avatars").upload(path, buffer, { upsert: true, contentType: "image/jpeg" });
    if (error) { Alert.alert("Upload failed", error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setAvatarUrl(url);
    setUploading(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ name, area, city, phone }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1500);
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#4A3728" />
      </SafeAreaView>
    );
  }

  const rating = profile.rating_count > 0 ? profile.rating_sum / profile.rating_count : null;
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const initials = (profile.name ?? "?").charAt(0).toUpperCase();

  if (editing) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => setEditing(false)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "300", color: "#4A3728" }}>Edit Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 28, marginTop: 8 }}>
            <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {uploading ? <ActivityIndicator color="#4A3728" /> :
                  avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 88, height: 88 }} /> :
                  <Text style={{ fontSize: 32, fontWeight: "600", color: "#4A3728" }}>{initials}</Text>}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FAF7F2" }}>
                <Ionicons name="camera" size={12} color="#FAF7F2" />
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, fontSize: 13, color: "#8B7355" }}>{uploading ? t("profile.uploading") : t("profile.tapToChange")}</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Neighbourhood / Area" value={area} onChange={setArea} placeholder="e.g. Maadi" />
            <Field label="City" value={city} onChange={setCity} placeholder="e.g. Cairo" />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+20 100 000 0000" keyboardType="phone-pad" />
          </View>

          <TouchableOpacity
            onPress={handleSave} disabled={saving}
            style={{ marginTop: 28, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <ActivityIndicator color="#FAF7F2" size="small" /> :
              saved ? <><Ionicons name="checkmark" size={16} color="#FAF7F2" /><Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>{t("profile.saved")}</Text></> :
              <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>{t("profile.saveChanges")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchItems(); setRefreshing(false); }} tintColor="#4A3728" />}
      >
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}
          >
            <Ionicons name="pencil-outline" size={14} color="#6B5040" />
            <Text style={{ fontSize: 13, color: "#6B5040", fontWeight: "500" }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 12 }}>
            {profile.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} />
              : <Text style={{ fontSize: 32, fontWeight: "600", color: "#4A3728" }}>{initials}</Text>}
          </View>
          <Text style={{ fontSize: 20, fontWeight: "600", color: "#4A3728", marginBottom: 4 }}>{profile.name}</Text>
          {profile.area ? <Text style={{ fontSize: 13, color: "#8B7355", marginBottom: 2 }}>{profile.area}, {profile.city}</Text> : null}
          <Text style={{ fontSize: 12, color: "#A09080", marginBottom: 8 }}>Member since {joined}</Text>
          {rating !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              {[1,2,3,4,5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(rating) ? "star" : "star-outline"} size={14} color="#C4842A" />
              ))}
              <Text style={{ fontSize: 13, color: "#8B7355", marginLeft: 2 }}>{rating.toFixed(1)}</Text>
              <Text style={{ fontSize: 12, color: "#A09080" }}>({profile.rating_count} rating{profile.rating_count !== 1 ? "s" : ""})</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: "#C4B9AA", marginBottom: 4 }}>No ratings yet</Text>
          )}
        </View>

        {/* My Stuff */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728", marginBottom: 12 }}>
            My Stuff · {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>
          {items.length === 0 ? (
            <TouchableOpacity onPress={() => router.push("/new-item" as any)}>
              <Text style={{ fontSize: 13, color: "#8B7355", textDecorationLine: "underline" }}>List your first item →</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/items/${item.id}` as any)}
                  style={{ width: "47%", backgroundColor: "white", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}
                >
                  <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center" }}>
                    {item.photos[0]
                      ? <Image source={{ uri: item.photos[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      : <Ionicons name="image-outline" size={28} color="#C4B9AA" />}
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: "#8B7355", marginTop: 1 }}>{item.category}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#4A3728" }}>{item.points} pts</Text>
                      <View style={{ backgroundColor: item.status === "Available" ? "#D8E4D0" : item.status === "Swapped" ? "#DDD8C8" : "#D4E0E8", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: item.status === "Available" ? "#4A6640" : item.status === "Swapped" ? "#6B5040" : "#2A5060" }}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#6B5040", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#C4B9AA"
        keyboardType={keyboardType ?? "default"}
        style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#4A3728" }}
      />
    </View>
  );
}
