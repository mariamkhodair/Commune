import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

const CAIRO_AREAS = ["Maadi","Zamalek","Heliopolis","New Cairo","6th of October","Mohandessin","Dokki","Nasr City","Rehab","Sheikh Zayed"];
const CITIES = ["Cairo", "Giza", "Alexandria", "Other"];
const DRAFT_KEY = "signup_draft";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", area: "", city: "Cairo" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((saved) => {
      if (!saved) return;
      try {
        const { form: savedForm, agreedToGuidelines: savedAgreed, hasReadGuidelines: savedRead } = JSON.parse(saved);
        if (savedForm) setForm(savedForm);
        if (savedAgreed) setAgreedToGuidelines(savedAgreed);
        if (savedRead) setHasReadGuidelines(savedRead);
      } catch {}
    });
  }, []);

  // Save draft on every change
  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form, agreedToGuidelines, hasReadGuidelines }));
  }, [form, agreedToGuidelines, hasReadGuidelines]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("Please fill in all required fields."); return;
    }
    if (!agreedToGuidelines) {
      setError("Please read and agree to the Community Guidelines."); return;
    }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, phone: `+20${form.phone}`, area: form.area, city: form.city } },
    });
    setLoading(false);
    if (err) setError(err.message);
    else { AsyncStorage.removeItem(DRAFT_KEY); router.replace("/tutorial"); }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 48 }}>
        <View className="items-center mb-8">
          <View className="w-12 h-12 rounded-full bg-[#4A3728] items-center justify-center mb-3">
            <Text className="text-[#FAF7F2] text-xl font-bold">C</Text>
          </View>
          <Text className="text-2xl font-light text-[#4A3728]">Create Account</Text>
        </View>

        <View className="gap-3">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Full name *"
            placeholderTextColor="#C4B9AA"
            value={form.name}
            onChangeText={(v) => set("name", v)}
          />
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Email *"
            placeholderTextColor="#C4B9AA"
            value={form.email}
            onChangeText={(v) => set("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Password *"
            placeholderTextColor="#C4B9AA"
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
          />
          <View className="flex-row items-center bg-white rounded-2xl border border-[#EDE8DF] px-4">
            <Text className="text-[#8B7355] mr-1">+20</Text>
            <TextInput
              className="flex-1 py-4 text-[#4A3728]"
              placeholder="Phone number *"
              placeholderTextColor="#C4B9AA"
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Area picker */}
          <Text className="text-xs text-[#8B7355] px-1 -mb-1">Area (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            <View className="flex-row gap-2 px-1 pb-1">
              {CAIRO_AREAS.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => set("area", a)}
                  className={`px-3 py-2 rounded-full border text-sm ${
                    form.area === a
                      ? "bg-[#4A3728] border-[#4A3728]"
                      : "bg-white border-[#D9CFC4]"
                  }`}
                >
                  <Text className={form.area === a ? "text-[#FAF7F2] text-xs" : "text-[#6B5040] text-xs"}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* City picker */}
          <View className="flex-row gap-2">
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => set("city", c)}
                className={`flex-1 py-2 rounded-full border items-center ${
                  form.city === c ? "bg-[#4A3728] border-[#4A3728]" : "bg-white border-[#D9CFC4]"
                }`}
              >
                <Text className={`text-xs ${form.city === c ? "text-[#FAF7F2]" : "text-[#6B5040]"}`}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Community Guidelines */}
          <View style={{ gap: 8, alignItems: "center", marginHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                onPress={() => hasReadGuidelines && setAgreedToGuidelines((v) => !v)}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                style={{
                  width: 20, height: 20,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: hasReadGuidelines ? "#4A3728" : "#C4B9AA",
                  backgroundColor: agreedToGuidelines ? "#4A3728" : "white",
                  alignItems: "center", justifyContent: "center",
                  opacity: hasReadGuidelines ? 1 : 0.45,
                }}
              >
                {agreedToGuidelines && (
                  <Text style={{ color: "#FAF7F2", fontSize: 11, fontWeight: "700" }}>✓</Text>
                )}
              </TouchableOpacity>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>I have read and agree to</Text>
                <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>
                  <Text
                    onPress={() => { setHasReadGuidelines(true); router.push("/(auth)/terms" as any); }}
                    style={{ color: "#4A3728", fontWeight: "600", textDecorationLine: "underline" }}
                  >
                    Commune's Community Guidelines
                  </Text>
                </Text>
              </View>
            </View>
            {!agreedToGuidelines && (
              <Text style={{ fontSize: 12, color: "#A0624A", textAlign: "center" }}>
                Please click on the Community Guidelines link :)
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="bg-[#4A3728] rounded-full py-4 items-center mt-2"
          >
            {loading
              ? <ActivityIndicator color="#FAF7F2" />
              : <Text className="text-[#FAF7F2] font-semibold text-base">Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center gap-1" style={{ marginTop: 32 }}>
          <Text className="text-[#8B7355] text-sm">Already have an account?</Text>
          <Link href="/(auth)/login" className="text-[#4A3728] text-sm font-semibold">Sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
