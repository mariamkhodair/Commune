import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function ProfilePage() {
  const router = useRouter();
  const { userId, profile } = useUser();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0] || !userId) return;

    setUploading(true);
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    const path = `${userId}.${ext}`;

    // Read file as blob
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      Alert.alert("Upload failed", uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setAvatarUrl(publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ name, area, city, phone }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "300", color: "#4A3728" }}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 32, marginTop: 8 }}>
          <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {uploading ? (
                <ActivityIndicator color="#4A3728" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 88, height: 88 }} />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: "600", color: "#4A3728" }}>{initials}</Text>
              )}
            </View>
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FAF7F2" }}>
              <Ionicons name="camera" size={12} color="#FAF7F2" />
            </View>
          </TouchableOpacity>
          <Text style={{ marginTop: 10, fontSize: 13, color: "#8B7355" }}>
            {uploading ? "Uploading…" : "Tap to change photo"}
          </Text>
        </View>

        {/* Fields */}
        <View style={{ gap: 16 }}>
          <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
          <Field label="Neighbourhood / Area" value={area} onChange={setArea} placeholder="e.g. Maadi" />
          <Field label="City" value={city} onChange={setCity} placeholder="e.g. Cairo" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+20 100 000 0000" keyboardType="phone-pad" />
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            marginTop: 28,
            backgroundColor: "#4A3728",
            borderRadius: 999,
            paddingVertical: 15,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FAF7F2" size="small" />
          ) : saved ? (
            <>
              <Ionicons name="checkmark" size={16} color="#FAF7F2" />
              <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>Saved</Text>
            </>
          ) : (
            <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>Save Changes</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#6B5040", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#C4B9AA"
        keyboardType={keyboardType ?? "default"}
        style={{
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#D9CFC4",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 13,
          fontSize: 14,
          color: "#4A3728",
        }}
      />
    </View>
  );
}
