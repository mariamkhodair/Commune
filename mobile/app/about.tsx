import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function About() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>About Commune</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>Why we started and what we stand for.</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 28 }}>

        {/* Story */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>The Story</Text>
          <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 18, gap: 12 }}>
            <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 21 }}>
              Commune was conceived in 2022 in a simple ahwa over a couple of dark roast turkish coffees. It all started with a conversation about how everyone has so much stuff! Wardrobes full of things never worn, shelves of books never re-read, gadgets collecting dust in drawers. Meanwhile, others are looking for exactly those things.
            </Text>
            <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 21 }}>
              The question wasn't why people couldn't afford new things. It was why they were buying new things at all when what they needed was probably already sitting in someone else's home.
            </Text>
            <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 21 }}>
              So we built a platform to help people trade instead of buy — reducing waste, cutting costs, and doing something good in the process.
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>Our Mission</Text>
          <View style={{ borderRadius: 16, padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 17, color: "#4A3728", textAlign: "center", lineHeight: 28, fontStyle: "italic" }}>
              "To help people declutter their Homes, Save money and Help those in need — just by swapping."
            </Text>
          </View>
        </View>

        {/* Impact */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>The Impact</Text>
          <View style={{ gap: 10 }}>

            <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 22 }}>♻️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", marginBottom: 4 }}>Less Waste</Text>
                <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>Every swap is an item saved from a landfill. The more we trade, the less we consume.</Text>
              </View>
            </View>

            <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 22 }}>💸</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", marginBottom: 4 }}>Real Savings</Text>
                <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>Get what you need without spending. A points-based system means value is exchanged fairly, not just financially.</Text>
              </View>
            </View>

            <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 22 }}>🤝🏽</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", marginBottom: 4 }}>Giving Back</Text>
                <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>30% of every annual subscription fee is donated to charity. We partner with local NGOs to fund hospitals and build schools across Egypt.</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Founder */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>The Founder</Text>
          <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 18, gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>Mariam Khodair</Text>
            <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 21 }}>
              Mariam founded Commune with the belief that a small shift in how we think about ownership can create a meaningful ripple effect — for individuals, communities, and the planet.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
