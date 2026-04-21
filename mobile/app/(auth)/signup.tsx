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
import { LangToggle } from "@/components/LangToggle";

const CAIRO_AREAS = ["Maadi","Zamalek","Heliopolis","New Cairo","6th of October","Mohandessin","Dokki","Nasr City","Rehab","Sheikh Zayed"];
const CITIES = ["Cairo", "Giza", "Alexandria", "Other"];
const DRAFT_KEY = "signup_draft";

export default function Signup() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", area: "", city: "Cairo" });
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
    if (err) setError(err.message);
    else { AsyncStorage.removeItem(DRAFT_KEY); router.replace("/tutorial"); }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Language toggle — top left */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <LangToggle />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: "#4A3728", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Text style={{ color: "#FAF7F2", fontSize: 20, fontWeight: "700" }}>C</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: "300", color: "#4A3728" }}>{t("signup.createAccount")}</Text>
          </View>

          <View style={{ gap: 12 }}>
            {error ? (
              <View style={{ backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: "#DC2626", fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.fullName")}
              placeholderTextColor="#C4B9AA"
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.email")}
              placeholderTextColor="#C4B9AA"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("signup.password")}
              placeholderTextColor="#C4B9AA"
              value={form.password}
              onChangeText={(v) => set("password", v)}
              secureTextEntry
            />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#EDE8DF", paddingHorizontal: 16 }}>
              <Text style={{ color: "#8B7355", marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}>+20</Text>
              <TextInput
                style={{ flex: 1, paddingVertical: 16, color: "#4A3728", textAlign: isRTL ? "right" : "left" }}
                placeholder={t("signup.phone")}
                placeholderTextColor="#C4B9AA"
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Area picker */}
            <Text style={{ fontSize: 12, color: "#8B7355", paddingHorizontal: 4, textAlign: isRTL ? "right" : "left" }}>{t("signup.area")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4, paddingBottom: 4 }}>
                {CAIRO_AREAS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => set("area", a)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, backgroundColor: form.area === a ? "#4A3728" : "white", borderColor: form.area === a ? "#4A3728" : "#D9CFC4" }}
                  >
                    <Text style={{ fontSize: 12, color: form.area === a ? "#FAF7F2" : "#6B5040" }}>{a}</Text>
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
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 999, borderWidth: 1, alignItems: "center", backgroundColor: form.city === c ? "#4A3728" : "white", borderColor: form.city === c ? "#4A3728" : "#D9CFC4" }}
                >
                  <Text style={{ fontSize: 12, color: form.city === c ? "#FAF7F2" : "#6B5040" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Community Guidelines */}
            <View style={{ gap: 8, alignItems: "center", marginHorizontal: 16 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => hasReadGuidelines && setAgreedToGuidelines((v) => !v)}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  style={{
                    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
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
                  <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>{t("signup.agreePrefix")}</Text>
                  <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>
                    <Text
                      onPress={() => { setHasReadGuidelines(true); router.push("/(auth)/terms" as any); }}
                      style={{ color: "#4A3728", fontWeight: "600", textDecorationLine: "underline" }}
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
              style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            >
              {loading
                ? <ActivityIndicator color="#FAF7F2" />
                : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 16 }}>{t("signup.createAccount")}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text style={{ color: "#8B7355", fontSize: 14 }}>{t("signup.haveAccount")}</Text>
            <Link href="/(auth)/login" style={{ color: "#4A3728", fontSize: 14, fontWeight: "600" }}>{t("signup.signInLink")}</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
