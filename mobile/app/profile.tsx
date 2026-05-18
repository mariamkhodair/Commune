import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, RefreshControl, Share } from "react-native";
import { useRouter } from "expo-router";
import { LoaderFullScreen } from "@/components/Loader";
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
  const [redeeming, setRedeeming] = useState<string | null>(null);

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

  async function handleRedeem(type: "bosta" | "subscription_discount") {
    const cost = type === "bosta" ? 100 : 2500;
    const label = type === "bosta" ? "free Bosta delivery" : "10% subscription discount";
    Alert.alert(`Redeem ${cost} credits`, `Use ${cost} credits for ${label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem", onPress: async () => {
          setRedeeming(type);
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          const res = await fetch(`https://commune-eg.com/api/credits/redeem`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ type }),
          });
          setRedeeming(null);
          if (res.ok) {
            Alert.alert("Redeemed!", `Your ${label} has been applied.`);
          } else {
            const body = await res.json().catch(() => ({}));
            Alert.alert("Failed", body.error ?? "Could not redeem credits.");
          }
        },
      },
    ]);
  }

  if (!profile) {
    return <LoaderFullScreen />;
  }

  const rating = profile.rating_count > 0 ? profile.rating_sum / profile.rating_count : null;
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const initials = (profile.name ?? "?").charAt(0).toUpperCase();

  if (editing) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => setEditing(false)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#111111" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "300", color: "#111111" }}>Edit Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 28, marginTop: 8 }}>
            <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#E4E4E4", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {uploading ? <ActivityIndicator color="#111111" /> :
                  avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 88, height: 88 }} /> :
                  <Text style={{ fontSize: 32, fontWeight: "400", color: "#111111" }}>{initials}</Text>}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#111111", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#F8F8F6" }}>
                <Ionicons name="camera" size={12} color="#F8F8F6" />
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, fontSize: 13, color: "#6B6B6B" }}>{uploading ? t("profile.uploading") : t("profile.tapToChange")}</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Neighbourhood / Area" value={area} onChange={setArea} placeholder="e.g. Maadi" />
            <Field label="City" value={city} onChange={setCity} placeholder="e.g. Cairo" />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+20 100 000 0000" keyboardType="phone-pad" />
          </View>

          <TouchableOpacity
            onPress={handleSave} disabled={saving}
            style={{ marginTop: 28, backgroundColor: "#111111", borderRadius: 6, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <ActivityIndicator color="#F8F8F6" size="small" /> :
              saved ? <><Ionicons name="checkmark" size={16} color="#F8F8F6" /><Text style={{ color: "#F8F8F6", fontWeight: "400", fontSize: 15 }}>{t("profile.saved")}</Text></> :
              <Text style={{ color: "#F8F8F6", fontWeight: "400", fontSize: 15 }}>{t("profile.saveChanges")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchItems(); setRefreshing(false); }} tintColor="#111111" />}
      >
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#E4E4E4", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 }}
          >
            <Ionicons name="pencil-outline" size={14} color="#6B6B6B" />
            <Text style={{ fontSize: 13, color: "#6B6B6B", fontWeight: "400" }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#E4E4E4", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 12 }}>
            {profile.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} />
              : <Text style={{ fontSize: 32, fontWeight: "400", color: "#111111" }}>{initials}</Text>}
          </View>
          <Text style={{ fontSize: 20, fontWeight: "400", color: "#111111", marginBottom: 4 }}>{profile.name}</Text>
          {profile.area ? <Text style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 2 }}>{profile.area}, {profile.city}</Text> : null}
          <Text style={{ fontSize: 12, color: "#A8A8A8", marginBottom: 8 }}>Member since {joined}</Text>
          {rating !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              {[1,2,3,4,5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(rating) ? "star" : "star-outline"} size={14} color="#C4842A" />
              ))}
              <Text style={{ fontSize: 13, color: "#6B6B6B", marginLeft: 2 }}>{rating.toFixed(1)}</Text>
              <Text style={{ fontSize: 12, color: "#A8A8A8" }}>({profile.rating_count} rating{profile.rating_count !== 1 ? "s" : ""})</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: "#C7C7CC", marginBottom: 4 }}>No ratings yet</Text>
          )}
        </View>

        {/* Credits */}
        <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#E4E4E4", padding: 18, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "400", color: "#111111" }}>Credits</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0F4FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="star" size={14} color="#0047AB" />
              <Text style={{ fontSize: 16, fontWeight: "400", color: "#0047AB" }}>{profile.credits ?? 50}</Text>
            </View>
          </View>

          {profile.referral_code ? (
            <View>
              <Text style={{ fontSize: 11, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Your Referral Code</Text>
              <TouchableOpacity
                onPress={() => Share.share({ message: `Join Commune with my referral code: ${profile.referral_code}` })}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8F8F6", borderRadius: 10, borderWidth: 1, borderColor: "#E4E4E4", paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "400", color: "#111111", letterSpacing: 2 }}>{profile.referral_code}</Text>
                <Ionicons name="share-outline" size={16} color="#6B6B6B" />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: "#A8A8A8", marginTop: 6 }}>Earn 50 credits for every 5 friends who join with your code</Text>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8 }}>Redeem Credits</Text>
            <TouchableOpacity
              onPress={() => handleRedeem("bosta")}
              disabled={!!redeeming || (profile.credits ?? 0) < 100}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#E4E4E4", borderRadius: 12, padding: 14, opacity: (profile.credits ?? 0) < 100 ? 0.45 : 1 }}
            >
              {redeeming === "bosta" ? <ActivityIndicator size="small" color="#111111" /> : <Text style={{ fontSize: 20 }}>🛵</Text>}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "400", color: "#111111" }}>Free Bosta Delivery</Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 1 }}>Waive one delivery fee</Text>
              </View>
              <View style={{ backgroundColor: "#F0F4FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "400", color: "#0047AB" }}>100 credits</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRedeem("subscription_discount")}
              disabled={!!redeeming || (profile.credits ?? 0) < 2500}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#E4E4E4", borderRadius: 12, padding: 14, opacity: (profile.credits ?? 0) < 2500 ? 0.45 : 1 }}
            >
              {redeeming === "subscription_discount" ? <ActivityIndicator size="small" color="#111111" /> : <Text style={{ fontSize: 20 }}>🏷️</Text>}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "400", color: "#111111" }}>10% Subscription Discount</Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 1 }}>On your next annual plan</Text>
              </View>
              <View style={{ backgroundColor: "#F0F4FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "400", color: "#0047AB" }}>2,500 credits</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Stuff */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 15, fontWeight: "400", color: "#111111", marginBottom: 12 }}>
            My Stuff · {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>
          {items.length === 0 ? (
            <TouchableOpacity onPress={() => router.push("/new-item" as any)}>
              <Text style={{ fontSize: 13, color: "#6B6B6B", textDecorationLine: "underline" }}>List your first item →</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/items/${item.id}` as any)}
                  style={{ width: "47%", backgroundColor: "white", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#E4E4E4" }}
                >
                  <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#E4E4E4", alignItems: "center", justifyContent: "center" }}>
                    {item.photos[0]
                      ? <Image source={{ uri: item.photos[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      : <Ionicons name="image-outline" size={28} color="#C7C7CC" />}
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "400", color: "#111111" }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: "#6B6B6B", marginTop: 1 }}>{item.category}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "400", color: "#111111" }}>{item.points} pts</Text>
                      <View style={{ backgroundColor: item.status === "Available" ? "#D8E4D0" : item.status === "Swapped" ? "#DDD8C8" : "#D4E0E8", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "400", color: item.status === "Available" ? "#4A6640" : item.status === "Swapped" ? "#6B6B6B" : "#2A5060" }}>{item.status}</Text>
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
      <Text style={{ fontSize: 11, fontWeight: "400", color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType ?? "default"}
        style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#E4E4E4", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#111111" }}
      />
    </View>
  );
}
