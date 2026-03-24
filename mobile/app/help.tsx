import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const FAQS = [
  {
    question: "How does the points system work?",
    answer: "When you list an item, our AI analyses it and assigns a points value based on its current market price in Egypt. You use those points to swap for items of similar value from other members — no money changes hands.",
  },
  {
    question: "How does swapping work?",
    answer: "Find an item you want in Search, then propose a swap. For a swap to be a true match, your offer must include at least one item from the other member's Stuff I Want list — and the item you're requesting must satisfy something on yours. The other member will review your proposal and can accept or decline.",
  },
  {
    question: "Can I swap multiple items at once?",
    answer: "Yes — this is called a bundle swap. If one member's item is worth more than any single item you have, you can offer multiple items whose points add up to the same value. Go to a member's profile and tap 'Propose Bundle Swap'. Commune will automatically suggest the best combination of your items to match the total points value.",
  },
  {
    question: "What if the AI points value doesn't feel fair?",
    answer: "You're in control. When listing an item you can either let our AI suggest a points value, or set your own. If the AI result doesn't feel right, switch to 'Set My Own' and enter the value you think is fair.",
  },
  {
    question: "I've matched — how do I swap?",
    answer: "1. Head to the chat and use 'Schedule a Swap' to suggest a date. The other member confirms it.\n\n2. Once agreed, it appears in your Scheduled Swaps with all details.\n\n3. On the day, press 'Off to Swap' when you're heading out — this activates location sharing between you both.\n\n4. Meet in a public place. Inspect the item before completing the swap.\n\n5. Once done and safely home, press 'Swapped and Safe'. This ends location tracking. You'll then be prompted to rate the other member.",
  },
  {
    question: "Who can use Commune?",
    answer: "Commune is currently available in Egypt only. You'll need a valid Egyptian phone number to sign up.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel at any time from your account settings. Your access continues until the end of your current billing period.",
  },
  {
    question: "What if my rating drops below 3 stars?",
    answer: "Members with a rating below 3 stars will be matched less frequently — our system prioritises pairing people with strong community reputations. Honest listings earn better ratings than overpromised ones.",
  },
  {
    question: "What happens if an item isn't as described?",
    answer: "We take misrepresentation seriously. If you receive an item that doesn't match its listing, contact us immediately and we'll step in to resolve it. Use the rating system and feel free to report the person if needed.",
  },
];

export default function Help() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!name || !email || !message) return;
    // Open mailto as simple contact method
    const subject = encodeURIComponent("Commune Help Request");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    Linking.openURL(`mailto:commune.eg@gmail.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>Get Help</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>Browse FAQs or send us a message.</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* FAQs */}
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728", marginTop: 8, marginBottom: 12 }}>
          Frequently Asked Questions
        </Text>
        <View style={{ gap: 8 }}>
          {FAQS.map((faq, i) => (
            <View key={i} style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#D9CFC4", overflow: "hidden" }}>
              <TouchableOpacity
                onPress={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728", flex: 1, paddingRight: 8 }}>{faq.question}</Text>
                <Ionicons name={openIndex === i ? "chevron-up" : "chevron-down"} size={16} color="#8B7355" />
              </TouchableOpacity>
              {openIndex === i && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#EDE8DF", paddingTop: 10, gap: 6 }}>
                  {faq.answer.split("\n\n").map((para, pi) => (
                    <Text key={pi} style={{ fontSize: 13, color: "#6B5040", lineHeight: 20 }}>{para}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact */}
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728", marginTop: 28, marginBottom: 4 }}>
          Still need help?
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL("mailto:commune.eg@gmail.com")}>
          <Text style={{ fontSize: 13, color: "#8B7355", marginBottom: 16 }}>
            Email us at{" "}
            <Text style={{ color: "#4A3728", fontWeight: "600" }}>commune.eg@gmail.com</Text>
          </Text>
        </TouchableOpacity>

        {submitted ? (
          <View style={{ backgroundColor: "#D8E4D0", borderRadius: 14, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A6640", marginBottom: 4 }}>Message sent!</Text>
            <Text style={{ fontSize: 13, color: "#4A6640" }}>We'll get back to you as soon as we can.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040" }}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#C4B9AA"
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2" }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040" }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#C4B9AA"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2" }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040" }}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="What do you need help with?"
                placeholderTextColor="#C4B9AA"
                multiline
                numberOfLines={4}
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2", textAlignVertical: "top", minHeight: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!name || !email || !message}
              style={{ backgroundColor: (!name || !email || !message) ? "#D9CFC4" : "#4A3728", borderRadius: 999, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
