import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/languageContext";
const CAIRO_AREAS = ["Maadi","Zamalek","Heliopolis","New Cairo","6th of October","Mohandessin","Dokki","Nasr City","Rehab","Sheikh Zayed"];
const CITIES = ["Cairo", "Giza", "Alexandria", "Other"];
const DRAFT_KEY = "signup_draft";

export default function Signup() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", area: "", city: "Cairo", referralCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false);

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

  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form, agreedToGuidelines, hasReadGuidelines }));
  }, [form, agreedToGuidelines, hasReadGuidelines]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError(t("signup.fillRequired")); return;
    }
    if (!agreedToGuidelines) {
      setError(t("signup.agreeRequired")); return;
    }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, phone: `+20${form.phone}`, area: form.area, city: form.city } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      AsyncStorage.removeItem(DRAFT_KEY);
      if (form.referralCode.trim()) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          fetch(`https://commune-eg.com/api/referral`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ code: form.referralCode.trim() }),
          }).catch(() => {});
        }
      }
      router.replace("/tutorial");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <TouchableOpacity onPress={() => router.push("/(auth)/welcome" as any)} style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 40, color: "#355E3B", fontFamily: "Unbounded_400Regular" }}>
              Commune
            </Text>
          </TouchableOpacity>

          <View style={{ gap: 12 }}>
            {error ? (
              <View style={{ backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: "#DC2626", fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#111111", borderWidth: 1, borderColor: "#E4E4E4", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.fullName")}
              placeholderTextColor="#C7C7CC"
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#111111", borderWidth: 1, borderColor: "#E4E4E4", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.email")}
              placeholderTextColor="#C7C7CC"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#111111", borderWidth: 1, borderColor: "#E4E4E4", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.password")}
              placeholderTextColor="#C7C7CC"
              value={form.password}
              onChangeText={(v) => set("password", v)}
              secureTextEntry
            />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#E4E4E4", paddingHorizontal: 16 }}>
              <Text style={{ color: "#6B6B6B", marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}>+20</Text>
              <TextInput
                style={{ flex: 1, paddingVertical: 16, color: "#111111", textAlign: isRTL ? "right" : "left" }}
                placeholder={t("signup.phone")}
                placeholderTextColor="#C7C7CC"
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Area picker */}
            <Text style={{ fontSize: 12, color: "#6B6B6B", paddingHorizontal: 4, textAlign: isRTL ? "right" : "left" }}>{t("signup.area")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4, paddingBottom: 4 }}>
                {CAIRO_AREAS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => set("area", a)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, backgroundColor: form.area === a ? "#111111" : "white", borderColor: form.area === a ? "#111111" : "#E4E4E4" }}
                  >
                    <Text style={{ fontSize: 12, color: form.area === a ? "#F8F8F6" : "#6B6B6B" }}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* City picker */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => set("city", c)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: "center", backgroundColor: form.city === c ? "#111111" : "white", borderColor: form.city === c ? "#111111" : "#E4E4E4" }}
                >
                  <Text style={{ fontSize: 12, color: form.city === c ? "#F8F8F6" : "#6B6B6B" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Referral code */}
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#111111", borderWidth: 1, borderColor: "#E4E4E4", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.referralCode")}
              placeholderTextColor="#C7C7CC"
              value={form.referralCode}
              onChangeText={(v) => set("referralCode", v.toUpperCase())}
              autoCapitalize="characters"
            />

            {/* Community Guidelines */}
            <View style={{ gap: 8, alignItems: "center", marginHorizontal: 16 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => hasReadGuidelines && setAgreedToGuidelines((v) => !v)}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  style={{
                    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
                    borderColor: hasReadGuidelines ? "#111111" : "#C7C7CC",
                    backgroundColor: agreedToGuidelines ? "#111111" : "white",
                    alignItems: "center", justifyContent: "center",
                    opacity: hasReadGuidelines ? 1 : 0.45,
                  }}
                >
                  {agreedToGuidelines && (
                    <Text style={{ color: "#F8F8F6", fontSize: 11, fontWeight: "400" }}>✓</Text>
                  )}
                </TouchableOpacity>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 20 }}>{t("signup.agreePrefix")}</Text>
                  <Text style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 20 }}>
                    <Text
                      onPress={() => { setHasReadGuidelines(true); router.push("/(auth)/terms" as any); }}
                      style={{ color: "#111111", fontWeight: "400", textDecorationLine: "underline" }}
                    >
                      {t("signup.guidelines")}
                    </Text>
                  </Text>
                </View>
              </View>
              {!agreedToGuidelines && (
                <Text style={{ fontSize: 12, color: "#A0624A", textAlign: "center" }}>
                  {t("signup.guidelinesHint")}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={{ backgroundColor: "#111111", borderRadius: 6, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            >
              {loading
                ? <ActivityIndicator color="#F8F8F6" />
                : <Text style={{ color: "#F8F8F6", fontWeight: "400", fontSize: 16 }}>{t("signup.createAccount")}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text style={{ color: "#6B6B6B", fontSize: 14 }}>{t("signup.haveAccount")}</Text>
            <Link href="/(auth)/login" style={{ color: "#111111", fontSize: 14, fontWeight: "400" }}>{t("signup.signInLink")}</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
