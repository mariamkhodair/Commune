import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/languageContext";
import { LangToggle } from "@/components/LangToggle";

export default function Login() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError(t("login.fillAllFields")); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else router.replace("/(tabs)");
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

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 24 }}>
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Image
              source={require("@/assets/icon.png")}
              style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 16 }}
            />
            <Text style={{ fontSize: 28, fontWeight: "300", color: "#4A3728", letterSpacing: 1 }}>commune</Text>
            <Text style={{ color: "#8B7355", fontSize: 14, marginTop: 4 }}>{t("login.tagline")}</Text>
          </View>

          {/* Form */}
          <View style={{ gap: 12 }}>
            {error ? (
              <View style={{ backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: "#DC2626", fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("login.email")}
              placeholderTextColor="#C4B9AA"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextInput
              style={{ backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#4A3728", borderWidth: 1, borderColor: "#EDE8DF", textAlign: isRTL ? "right" : "left" }}
              placeholder={t("login.password")}
              placeholderTextColor="#C4B9AA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            >
              {loading
                ? <ActivityIndicator color="#FAF7F2" />
                : <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 16 }}>{t("login.signIn")}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text style={{ color: "#8B7355", fontSize: 14 }}>{t("login.noAccount")}</Text>
            <Link href="/(auth)/signup" style={{ color: "#4A3728", fontSize: 14, fontWeight: "600" }}>{t("login.signUpLink")}</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
