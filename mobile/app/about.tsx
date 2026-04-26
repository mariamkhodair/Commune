import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLang } from "@/lib/languageContext";

export default function About() {
  const router = useRouter();
  const { t, isRTL } = useLang();

  const storyParagraphs = isRTL
    ? [
        "نشأت فكرة كوميون في عام 2022 في مقهى بسيط على فنجانَي قهوة تركية. بدأ كل شيء بحديث عن كثرة ما يمتلكه الناس! خزائن مليئة بملابس لم تُلبَس، ورفوف من الكتب التي لن تُعاد قراءتها، وأجهزة تتراكم الغبار عليها في الأدراج. في الوقت ذاته، هناك من يبحث عن هذه الأشياء بالضبط.",
        "لم يكن السؤال لماذا لا يستطيع الناس شراء أشياء جديدة. بل لماذا يشترون أشياء جديدة أصلاً، بينما ما يحتاجونه موجود على الأرجح في بيت شخص آخر.",
        "فبنينا منصة تساعد الناس على التبادل بدلاً من الشراء — للتقليل من الهدر، وخفض التكاليف، والمساهمة في شيء أفضل.",
      ]
    : [
        "Commune was conceived in 2022 in a simple ahwa over a couple of dark roast turkish coffees. It all started with a conversation about how everyone has so much stuff! Wardrobes full of things never worn, shelves of books never re-read, gadgets collecting dust in drawers. Meanwhile, others are looking for exactly those things.",
        "The question wasn't why people couldn't afford new things. It was why they were buying new things at all when what they needed was probably already sitting in someone else's home.",
        "So we built a platform to help people trade instead of buy — reducing waste, cutting costs, and doing something good in the process.",
      ];

  const missionQuote = isRTL
    ? '"مساعدة الناس على ترتيب منازلهم، وتوفير المال، ومساعدة المحتاجين — فقط من خلال التبادل."'
    : '"To help people declutter their Homes, Save money and Help those in need — just by swapping."';

  const impactItems = isRTL
    ? [
        { emoji: "♻️", title: "تقليل الهدر", body: "كل تبادل يعني منتجاً أُنقذ من النفايات. كلما تبادلنا أكثر، قلّ ما نستهلكه." },
        { emoji: "💸", title: "توفير حقيقي", body: "احصل على ما تحتاجه دون إنفاق. نظام النقاط يضمن تبادلاً عادلاً للقيمة، لا مالياً فحسب." },
        { emoji: "🤝🏽", title: "العطاء للمجتمع", body: "٣٠٪ من رسوم الاشتراك السنوي تُتبرع للجمعيات الخيرية. نتعاون مع المنظمات المحلية لدعم المستشفيات وبناء المدارس في مصر." },
      ]
    : [
        { emoji: "♻️", title: "Less Waste", body: "Every swap is an item saved from a landfill. The more we trade, the less we consume." },
        { emoji: "💸", title: "Real Savings", body: "Get what you need without spending. A points-based system means value is exchanged fairly, not just financially." },
        { emoji: "🤝🏽", title: "Giving Back", body: "30% of every annual subscription fee is donated to charity. We partner with local NGOs to fund hospitals and build schools across Egypt." },
      ];

  const founderBio = isRTL
    ? "أسّست مريم كوميون بقناعة أن تغييراً بسيطاً في طريقة تفكيرنا حول التملّك يمكن أن يُحدث أثراً إيجابياً عميقاً — للأفراد والمجتمعات والكوكب."
    : "Mariam founded Commune with the belief that a small shift in how we think about ownership can create a meaningful ripple effect — for individuals, communities, and the planet.";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728", textAlign: isRTL ? "right" : "left" }}>{t("about.header")}</Text>
          <Text style={{ fontSize: 12, color: "#8B7355", textAlign: isRTL ? "right" : "left" }}>{t("about.subheader")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 28 }}>

        {/* Story */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>{t("about.story")}</Text>
          <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 18, gap: 12 }}>
            {storyParagraphs.map((para, i) => (
              <Text key={i} style={{ fontSize: 13, color: "#6B5040", lineHeight: 21, textAlign: isRTL ? "right" : "left" }}>{para}</Text>
            ))}
          </View>
        </View>

        {/* Mission */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>{t("about.mission")}</Text>
          <View style={{ borderRadius: 16, padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 17, color: "#4A3728", textAlign: "center", lineHeight: 28, fontStyle: "italic" }}>
              {missionQuote}
            </Text>
          </View>
        </View>

        {/* Impact */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>{t("about.impact")}</Text>
          <View style={{ gap: 10 }}>
            {impactItems.map(({ emoji, title, body }) => (
              <View key={title} style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, flexDirection: isRTL ? "row-reverse" : "row", gap: 14, alignItems: "flex-start" }}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", marginBottom: 4, textAlign: isRTL ? "right" : "left" }}>{title}</Text>
                  <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 20, textAlign: isRTL ? "right" : "left" }}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Founder */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#4A3728", textAlign: "center", marginBottom: 12 }}>{t("about.founder")}</Text>
          <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#D9CFC4", padding: 18, gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", textAlign: isRTL ? "right" : "left" }}>Mariam Khodair</Text>
            <Text style={{ fontSize: 13, color: "#6B5040", lineHeight: 21, textAlign: isRTL ? "right" : "left" }}>{founderBio}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
