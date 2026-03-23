import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const MENU: MenuItem[] = [
  { label: "Liked Stuff", icon: "heart-outline", route: "/liked" },
  { label: "Liked Members", icon: "people-outline", route: "/liked-members" },
  { label: "Stuff I Want", icon: "star-outline", route: "/stuff-i-want" },
  { label: "My Swaps", icon: "swap-horizontal-outline", route: "/my-swaps" },
  { label: "Browse Members", icon: "person-outline", route: "/members" },
];

export default function More() {
  const router = useRouter();
  const { profile } = useUser();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  const firstName = profile?.name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="px-5 pt-6 pb-6 items-center">
          <View className="w-16 h-16 rounded-full bg-[#4A3728] items-center justify-center mb-3">
            <Text className="text-[#FAF7F2] text-2xl font-bold">{profile?.name?.charAt(0) ?? "?"}</Text>
          </View>
          <Text className="text-lg font-semibold text-[#4A3728]">{profile?.name ?? "Loading..."}</Text>
          {profile?.area ? (
            <Text className="text-sm text-[#8B7355]">{profile.area}, {profile.city}</Text>
          ) : null}
        </View>

        {/* Menu items */}
        <View className="px-5 gap-2 mb-6">
          {MENU.map(({ label, icon, route }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF]"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={icon} size={18} color="#8B7355" />
                <Text className="text-sm text-[#4A3728]">{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C4B9AA" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <View className="px-5 pb-8">
          <TouchableOpacity
            onPress={signOut}
            className="flex-row items-center justify-center gap-2 py-4 rounded-full border border-[#D9CFC4]"
          >
            <Ionicons name="log-out-outline" size={18} color="#A09080" />
            <Text className="text-sm text-[#A09080]">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
