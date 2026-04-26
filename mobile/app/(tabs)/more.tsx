import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

export default function More() {
  const router = useRouter();
  const { userId, profile } = useUser();
  const { t, isRTL, lang, setLang } = useLang();

  const SECTIONS = [
    {
      heading: t("drawer.myActivity"),
      items: [
        { label: t("drawer.mySwaps"),        icon: "swap-horizontal-outline" as const, route: "/my-swaps" },
        { label: t("drawer.scheduledSwaps"), icon: "calendar-outline" as const,        route: "/scheduled-swaps" },
        { label: t("drawer.stuffIWant"),     icon: "star-outline" as const,            route: "/stuff-i-want" },
      ],
    },
    {
      heading: t("drawer.discover"),
      items: [
        { label: t("drawer.browseMembers"),  icon: "person-outline" as const,          route: "/members" },
      ],
    },
    {
      heading: t("drawer.support"),
      items: [
        { label: t("drawer.getHelp"),        icon: "help-circle-outline" as const,     route: "/help" },
        { label: t("drawer.about"),          icon: "information-circle-outline" as const, route: "/about" },
        { label: t("drawer.guidelines"),     icon: "document-text-outline" as const,   route: "/terms" },
      ],
    },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile header */}
        <TouchableOpacity onPress={() => router.push("/profile" as any)} className="px-5 pt-6 pb-6 items-center">
          <View className="w-16 h-16 rounded-full bg-[#EDE8DF] items-center justify-center mb-3 overflow-hidden">
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} />
            ) : (
              <Text className="text-[#4A3728] text-2xl font-bold">{profile?.name?.charAt(0) ?? "?"}</Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text className="text-lg font-semibold text-[#4A3728]">{profile?.name ?? "..."}</Text>
            <Ionicons name="pencil-outline" size={14} color="#8B7355" />
          </View>
          {profile?.area ? (
            <Text className="text-sm text-[#8B7355]">{profile.area}, {profile.city}</Text>
          ) : null}
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map(({ heading, items }) => (
          <View key={heading} className="px-5 mb-5">
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: isRTL ? "right" : "left" }}>
              {heading}
            </Text>
            <View style={{ gap: 6 }}>
              {items.map(({ label, icon, route }) => (
                <TouchableOpacity
                  key={route}
                  onPress={() => router.push(route as any)}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#EDE8DF" }}
                >
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <Ionicons name={icon} size={18} color="#8B7355" />
                    <Text style={{ fontSize: 14, color: "#4A3728" }}>{label}</Text>
                  </View>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="#C4B9AA" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Language toggle */}
        <View className="px-5 mb-5">
          <TouchableOpacity
            onPress={() => setLang(lang === "en" ? "ar" : "en")}
            style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#EDE8DF" }}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <Ionicons name="language-outline" size={18} color="#8B7355" />
              <Text style={{ fontSize: 14, color: "#4A3728" }}>{t("drawer.language")}</Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="#C4B9AA" />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <View className="px-5">
          <TouchableOpacity
            onPress={signOut}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999, borderWidth: 1, borderColor: "#D9CFC4" }}
          >
            <Ionicons name="log-out-outline" size={18} color="#A09080" />
            <Text style={{ fontSize: 14, color: "#A09080" }}>{t("common.signOut")}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
