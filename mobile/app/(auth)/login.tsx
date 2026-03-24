"use client";
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
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
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-14 h-14 rounded-full bg-[#4A3728] items-center justify-center mb-4">
            <Text className="text-[#FAF7F2] text-2xl font-bold">C</Text>
          </View>
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
          />
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-[#4A3728] border border-[#EDE8DF]"
            placeholder="Password"
            placeholderTextColor="#C4B9AA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-[#8B7355] text-sm">Don't have an account?</Text>
          <Link href="/(auth)/signup" className="text-[#4A3728] text-sm font-semibold">Sign up</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
