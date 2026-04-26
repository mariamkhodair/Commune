import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLang } from "@/lib/languageContext";

type FAQ = { question: string; answer: string };

const FAQS_EN: FAQ[] = [
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

const FAQS_AR: FAQ[] = [
  {
    question: "كيف يعمل نظام النقاط؟",
    answer: "عندما تضيف منتجاً، يحلله الذكاء الاصطناعي ويعطيه قيمة بالنقاط بناءً على سعره الحالي في السوق المصري. تستخدم هذه النقاط لاستبدال منتجات ذات قيمة مماثلة من أعضاء آخرين — دون أي تبادل مالي.",
  },
  {
    question: "كيف يعمل الإستبدال؟",
    answer: "ابحث عن منتج تريده في Search، ثم اقترح إستبدالاً. لكي يكون الإستبدال متوافقاً، يجب أن يتضمن عرضك على الأقل منتجاً واحداً من قائمة \"ما أريده\" لدى العضو الآخر — كما يجب أن يلبّي المنتج الذي تطلبه شيئاً من قائمتك. بإمكان العضو الآخر قبول اقتراحك أو رفضه.",
  },
  {
    question: "هل يمكنني استبدال أكثر من منتج في آنٍ واحد؟",
    answer: "نعم — يُسمى ذلك إستبدال مجموعة. إذا كانت قيمة منتج لدى عضو آخر أعلى من أي منتج لديك منفرداً، يمكنك تقديم عدة منتجات تجمعها بنفس القيمة بالنقاط. انتقل إلى ملف العضو واضغط \"اقتراح إستبدال مجموعة\"، وستقترح كوميون تلقائياً أفضل تركيبة من منتجاتك لمطابقة إجمالي النقاط.",
  },
  {
    question: "ماذا لو لم تبدُ قيمة النقاط المقترحة عادلة؟",
    answer: "أنت من يتحكم. عند إضافة منتج، يمكنك السماح للذكاء الاصطناعي باقتراح قيمة للنقاط أو تحديدها بنفسك يدوياً. إذا لم تبدُ النتيجة عادلة، انتقل إلى \"تحديد يدوي\" وأدخل القيمة التي تراها مناسبة.",
  },
  {
    question: "وجدتُ تطابقاً — كيف أُتمّ الإستبدال؟",
    answer: "١. انتقل إلى المحادثة واستخدم \"جدوِل إستبدالاً\" لاقتراح تاريخ. يؤكد العضو الآخر الموعد.\n\n٢. بعد الاتفاق، يظهر الإستبدال في قسم \"الإستبدالات المجدولة\" بكل تفاصيله.\n\n٣. في اليوم المحدد، اضغط \"في طريقي للإستبدال\" عند خروجك — يُفعّل هذا مشاركة الموقع بينكما.\n\n٤. التقِ في مكان عام. افحص المنتج قبل إتمام الإستبدال.\n\n٥. بعد الانتهاء والعودة للمنزل بأمان، اضغط \"تم الإستبدال بأمان\". ينهي هذا تتبع الموقع، وستُطلب منك تقييم العضو الآخر.",
  },
  {
    question: "من يمكنه استخدام كوميون؟",
    answer: "كوميون متاحة حالياً في مصر فقط. ستحتاج إلى رقم هاتف مصري سليم للتسجيل.",
  },
  {
    question: "كيف يمكنني إلغاء اشتراكي؟",
    answer: "يمكنك الإلغاء في أي وقت من إعدادات حسابك. سيستمر وصولك حتى نهاية فترة الفوترة الحالية.",
  },
  {
    question: "ماذا يحدث إذا انخفض تقييمي إلى ما دون ٣ نجوم؟",
    answer: "الأعضاء الذين يقل تقييمهم عن ٣ نجوم سيُطابَقون مع آخرين بشكل أقل — نظامنا يُولي الأولوية لمطابقة الأشخاص ذوي السمعة الجيدة في المجتمع. التعريفات الصادقة تكسب تقييمات أفضل من تلك المبالَغ فيها.",
  },
  {
    question: "ماذا يحدث إذا لم يطابق المنتج وصفه؟",
    answer: "نأخذ التضليل بجدية تامة. إذا تلقيت منتجاً لا يتطابق مع وصفه، تواصل معنا فوراً وسنتدخل لحل الأمر. استخدم نظام التقييم ولا تتردد في الإبلاغ عن الشخص إذا لزم الأمر.",
  },
];

export default function Help() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const FAQS = isRTL ? FAQS_AR : FAQS_EN;

  function handleSubmit() {
    if (!name || !email || !message) return;
    const subject = encodeURIComponent("Commune Help Request");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    Linking.openURL(`mailto:commune.eg@gmail.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728", textAlign: isRTL ? "right" : "left" }}>{t("help.header")}</Text>
          <Text style={{ fontSize: 12, color: "#8B7355", textAlign: isRTL ? "right" : "left" }}>{t("help.subheader")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* FAQs */}
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728", marginTop: 8, marginBottom: 12, textAlign: isRTL ? "right" : "left" }}>
          {t("help.faqs")}
        </Text>
        <View style={{ gap: 8 }}>
          {FAQS.map((faq, i) => (
            <View key={i} style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#D9CFC4", overflow: "hidden" }}>
              <TouchableOpacity
                onPress={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#4A3728", flex: 1, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0, textAlign: isRTL ? "right" : "left" }}>{faq.question}</Text>
                <Ionicons name={openIndex === i ? "chevron-up" : "chevron-down"} size={16} color="#8B7355" />
              </TouchableOpacity>
              {openIndex === i && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#EDE8DF", paddingTop: 10, gap: 6 }}>
                  {faq.answer.split("\n\n").map((para, pi) => (
                    <Text key={pi} style={{ fontSize: 13, color: "#6B5040", lineHeight: 20, textAlign: isRTL ? "right" : "left" }}>{para}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact */}
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A3728", marginTop: 28, marginBottom: 4, textAlign: isRTL ? "right" : "left" }}>
          {t("help.stillNeedHelp")}
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL("mailto:commune.eg@gmail.com")}>
          <Text style={{ fontSize: 13, color: "#8B7355", marginBottom: 16, textAlign: isRTL ? "right" : "left" }}>
            {t("help.emailUs")}{" "}
            <Text style={{ color: "#4A3728", fontWeight: "600" }}>commune.eg@gmail.com</Text>
          </Text>
        </TouchableOpacity>

        {submitted ? (
          <View style={{ backgroundColor: "#D8E4D0", borderRadius: 14, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#4A6640", marginBottom: 4 }}>{t("help.sent")}</Text>
            <Text style={{ fontSize: 13, color: "#4A6640" }}>{t("help.sentHint")}</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#D9CFC4", padding: 16, gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040", textAlign: isRTL ? "right" : "left" }}>{t("help.name")}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t("help.yourName")}
                placeholderTextColor="#C4B9AA"
                textAlign={isRTL ? "right" : "left"}
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2" }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040", textAlign: isRTL ? "right" : "left" }}>{t("help.email")}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("help.emailPlaceholder")}
                placeholderTextColor="#C4B9AA"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign={isRTL ? "right" : "left"}
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2" }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B5040", textAlign: isRTL ? "right" : "left" }}>{t("help.message")}</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={t("help.messagePlaceholder")}
                placeholderTextColor="#C4B9AA"
                multiline
                numberOfLines={4}
                textAlign={isRTL ? "right" : "left"}
                style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#4A3728", backgroundColor: "#FAF7F2", textAlignVertical: "top", minHeight: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!name || !email || !message}
              style={{ backgroundColor: (!name || !email || !message) ? "#D9CFC4" : "#4A3728", borderRadius: 999, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>{t("help.sendMessage")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
