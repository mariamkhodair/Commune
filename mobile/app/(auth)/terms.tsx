import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Respect Above All",
    body: [
      "Commune is a community built on trust. Every member is expected to treat others with courtesy and respect at all times — in messages, at exchange points, and in every interaction on the platform.",
      "Disrespectful behaviour, harassment, hate speech, or any form of indecency will not be tolerated. Members found to have engaged in such conduct will be permanently banned and their subscription cancelled with no refund.",
    ],
  },
  {
    title: "2. Honesty About Your Stuff",
    body: [
      "When listing an item, you are responsible for describing it accurately — including its condition, any defects, signs of wear, or relevant history. Misrepresenting an item is a breach of community trust and may result in a negative rating or removal from the platform.",
      "If you are unsure whether something is worth mentioning, mention it anyway. The person on the other end deserves the full picture.",
      "We strongly encourage members to share additional photos in the chat if the other party asks.",
    ],
  },
  {
    title: "3. Ratings and Standing in the Community",
    body: [
      "After each completed swap, both members have the opportunity to rate each other. Your rating reflects your reliability and honesty as a community member.",
      "Members whose rating falls below 3 stars will be matched less frequently on the platform. Honest listings tend to earn better ratings than overpromised ones.",
    ],
  },
  {
    title: "4. Exchange Safety — Please Read Carefully",
    body: [
      "Commune facilitates connections between members but is not present at any physical exchange. All in-person meetups are arranged independently between members, and Commune bears no responsibility for any accidents, disputes, losses, or mishaps that may occur during or after an exchange.",
      "With that in mind, we strongly recommend the following:",
    ],
    tips: [
      "Meet in a public place — a café, a mall, or any busy, well-lit location. Avoid meeting at private homes.",
      "Do not go alone to meet a member you have never met before. Bring a friend or let someone know where you are going.",
      "Inspect the item thoroughly at the exchange point before the swap is finalised.",
      "Ask for more photos in the chat if you have any doubts before meeting.",
    ],
  },
  {
    title: "5. Calling Off an Exchange",
    body: [
      "Either member may choose not to proceed with a swap at the exchange point — for any reason. This is your right. However, please be aware that the other member may choose to reflect this in their rating of you.",
      "If you have a change of heart, we encourage you to communicate this as early as possible out of respect for the other member's time.",
    ],
  },
  {
    title: "6. Reporting and Bans",
    body: [
      "If a member behaves in a way that makes you feel unsafe, uncomfortable, or deceived, you can report them directly from their profile. All reports are reviewed by the Commune team.",
      "Members confirmed to have engaged in harassment, indecency, or repeated misrepresentation will be permanently removed from the platform.",
    ],
  },
  {
    title: "7. Subscription and Membership",
    body: [
      "Membership is billed annually at 500 EGP per year. You may cancel at any time from your account settings; your access will continue until the end of the current billing period.",
      "Commune is currently available in Egypt only. A valid Egyptian phone number is required to sign up.",
    ],
  },
];

export default function PreSignupTerms() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>Community Guidelines</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>By joining Commune, you agree to these.</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}>

        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#4A3728", marginBottom: 10 }}>{section.title}</Text>
            <View style={{ gap: 10 }}>
              {section.body.map((para, i) => (
                <Text key={i} style={{ fontSize: 13, color: "#6B5040", lineHeight: 21 }}>{para}</Text>
              ))}
              {section.tips && (
                <View style={{ gap: 8, marginTop: 2 }}>
                  {section.tips.map((tip, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#A0624A", marginTop: 7, flexShrink: 0 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: "#6B5040", lineHeight: 21 }}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={{ borderTopWidth: 1, borderTopColor: "#D9CFC4", paddingTop: 16, gap: 8 }}>
          <Text style={{ fontSize: 11, color: "#A09080" }}>
            Last updated 23 March 2026. For questions, contact us at{" "}
            <Text
              style={{ color: "#4A3728", fontWeight: "600" }}
              onPress={() => Linking.openURL("mailto:commune.eg@gmail.com")}
            >
              commune.eg@gmail.com
            </Text>
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
