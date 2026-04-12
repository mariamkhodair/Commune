import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Please fill in all fields."); return; }
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
        {/* Logo */}
        <View className="items-center mb-10">
          <Image
            source={require("@/assets/icon.png")}
            style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 16 }}
          />
          <Text className="text-3xl font-light text-[#4A3728] tracking-wide">commune</Text>
          <Text className="text-[#8B7355] text-sm mt-1">swap what you don't need</Text>
        </View>

        {/* Form */}
        <View className="gap-3">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Email"
            placeholderTextColor="#C4B9AA"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Password"
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
            className="bg-[#4A3728] rounded-full py-4 items-center mt-2"
          >
            {loading
              ? <ActivityIndicator color="#FAF7F2" />
              : <Text className="text-[#FAF7F2] font-semibold text-base">Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center gap-1" style={{ marginTop: 32 }}>
          <Text className="text-[#8B7355] text-sm">Don't have an account?</Text>
          <Link href="/(auth)/signup" className="text-[#4A3728] text-sm font-semibold">Sign up</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
