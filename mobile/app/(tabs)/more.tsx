import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const SECTIONS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: "My Activity",
    items: [
      { label: "My Swaps",         icon: "swap-horizontal-outline", route: "/my-swaps" },
      { label: "Scheduled Swaps",  icon: "calendar-outline",         route: "/scheduled-swaps" },
      { label: "Stuff I Want",     icon: "star-outline",             route: "/stuff-i-want" },
      { label: "Liked Stuff",      icon: "heart-outline",            route: "/liked" },
      { label: "Liked Members",    icon: "people-outline",           route: "/liked-members" },
    ],
  },
  {
    heading: "Discover",
    items: [
      { label: "Browse Members",   icon: "person-outline",           route: "/members" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Get Help",         icon: "help-circle-outline",      route: "/help" },
      { label: "About Commune",    icon: "information-circle-outline", route: "/about" },
      { label: "Terms & Conditions", icon: "document-text-outline",  route: "/terms" },
    ],
  },
];

export default function More() {
  const router = useRouter();
  const { profile } = useUser();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

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

        {/* Sections */}
        {SECTIONS.map(({ heading, items }) => (
          <View key={heading} className="px-5 mb-5">
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {heading}
            </Text>
            <View style={{ gap: 6 }}>
              {items.map(({ label, icon, route }) => (
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
          </View>
        ))}

        {/* Sign out */}
        <View className="px-5">
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
