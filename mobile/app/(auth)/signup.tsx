import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const CAIRO_AREAS = ["Maadi","Zamalek","Heliopolis","New Cairo","6th of October","Mohandessin","Dokki","Nasr City","Rehab","Sheikh Zayed"];
const CITIES = ["Cairo", "Giza", "Alexandria", "Other"];

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", area: "", city: "Cairo" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, phone: `+20${form.phone}`, area: form.area, city: form.city } },
    });
    setLoading(false);
    if (err) setError(err.message);
    else router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="px-6 py-12">
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

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-[#8B7355] text-sm">Already have an account?</Text>
          <Link href="/(auth)/login" className="text-[#4A3728] text-sm font-semibold">Sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
