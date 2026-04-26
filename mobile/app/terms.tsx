import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLang } from "@/lib/languageContext";

type Section = { title: string; body: string[]; tips?: string[] };

export default function Terms() {
  const router = useRouter();
  const { t, isRTL } = useLang();

  const SECTIONS_EN: Section[] = [
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
      title: "7. Membership",
      body: [
        "Commune is a membership-based platform. For details about current plans and pricing, visit commune-eg.com.",
        "You may cancel at any time from your account settings; your access will continue until the end of the current billing period.",
        "Commune is currently available in Egypt only.",
      ],
    },
  ];

  const SECTIONS_AR: Section[] = [
    {
      title: "١. الاحترام أولاً",
      body: [
        "كوميون مجتمع قائم على الثقة. يُتوقع من كل عضو أن يعامل الآخرين باحترام ولياقة في جميع الأوقات — في الرسائل، وأماكن التبادل، وفي كل تفاعل على المنصة.",
        "السلوك غير المحترم أو التحرش أو خطاب الكراهية أو أي شكل من أشكال الإساءة لن يُتسامح معه. سيُحظر الأعضاء المتورطون في مثل هذا السلوك نهائياً وسيُلغى اشتراكهم دون استرداد.",
      ],
    },
    {
      title: "٢. الأمانة في وصف منتجاتك",
      body: [
        "عند إضافة منتج، أنت مسؤول عن وصفه بدقة — بما في ذلك حالته وأي عيوب أو آثار استخدام أو تاريخ ذي صلة. تضليل الآخرين بشأن المنتج يُعدّ خيانة لثقة المجتمع وقد يؤدي إلى تقييم سلبي أو إزالتك من المنصة.",
        "إذا كنت غير متأكد مما إذا كان يجب ذكر شيء ما، فاذكره على أي حال. الشخص الآخر يستحق الصورة الكاملة.",
        "نشجع الأعضاء بشدة على مشاركة صور إضافية في المحادثة إذا طُلب منهم ذلك.",
      ],
    },
    {
      title: "٣. التقييمات والمكانة في المجتمع",
      body: [
        "بعد كل تبادل مكتمل، يتاح لكلا العضوين تقييم بعضهما البعض. يعكس تقييمك مدى موثوقيتك وأمانتك كعضو في المجتمع.",
        "الأعضاء الذين يقل تقييمهم عن ٣ نجوم سيُطابَقون مع آخرين بشكل أقل على المنصة. التعريفات الصادقة تكسب تقييمات أفضل من تلك المبالغ فيها.",
      ],
    },
    {
      title: "٤. سلامة التبادل — يرجى القراءة بعناية",
      body: [
        "تُسهّل كوميون التواصل بين الأعضاء لكنها غير حاضرة في عمليات التبادل الفعلية. جميع اللقاءات الشخصية تُرتَّب بشكل مستقل بين الأعضاء، ولا تتحمل كوميون أي مسؤولية عن أي حوادث أو نزاعات أو خسائر قد تحدث أثناء التبادل أو بعده.",
        "مع ذلك، نوصي بشدة باتباع ما يلي:",
      ],
      tips: [
        "التقِ في مكان عام — مقهى أو مول أو أي مكان مضاء ومزدحم. تجنب الاجتماع في المنازل الخاصة.",
        "لا تذهب وحدك لمقابلة عضو لم تلتقِ به من قبل. خذ معك صديقاً أو أخبر شخصاً بوجهتك.",
        "افحص المنتج بعناية في مكان التبادل قبل إتمام الصفقة.",
        "اطلب صوراً إضافية في المحادثة إذا كان لديك أي شك قبل اللقاء.",
      ],
    },
    {
      title: "٥. إلغاء التبادل",
      body: [
        "يحق لأي من الطرفين التراجع عن التبادل في مكان اللقاء — لأي سبب. هذا حقك. ومع ذلك، يُرجى العلم بأن الطرف الآخر قد يأخذ ذلك بعين الاعتبار في تقييمه لك.",
        "إذا غيّرت رأيك، نشجعك على إبلاغ الطرف الآخر في أقرب وقت ممكن احتراماً لوقته.",
      ],
    },
    {
      title: "٦. الإبلاغ والحظر",
      body: [
        "إذا تصرف أحد الأعضاء بطريقة جعلتك تشعر بعدم الأمان أو الانزعاج أو الخداع، يمكنك الإبلاغ عنه مباشرة من ملفه الشخصي. تُراجَع جميع البلاغات من قِبَل فريق كوميون.",
        "سيُزال الأعضاء الذين يثبت تورطهم في التحرش أو الإساءة أو التضليل المتكرر من المنصة نهائياً.",
      ],
    },
    {
      title: "٧. العضوية",
      body: [
        "كوميون منصة قائمة على الاشتراك. للاطلاع على الخطط والأسعار الحالية، تفضل بزيارة commune-eg.com.",
        "يمكنك الإلغاء في أي وقت من إعدادات حسابك؛ سيستمر وصولك حتى نهاية فترة الفوترة الحالية.",
        "كوميون متاحة حالياً في مصر فقط.",
      ],
    },
  ];

  const SECTIONS = isRTL ? SECTIONS_AR : SECTIONS_EN;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728", textAlign: isRTL ? "right" : "left" }}>{t("terms.header")}</Text>
          <Text style={{ fontSize: 12, color: "#8B7355", textAlign: isRTL ? "right" : "left" }}>{t("terms.subheader")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}>

        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#4A3728", marginBottom: 10, textAlign: isRTL ? "right" : "left" }}>{section.title}</Text>
            <View style={{ gap: 10 }}>
              {section.body.map((para, i) => (
                <Text key={i} style={{ fontSize: 13, color: "#6B5040", lineHeight: 21, textAlign: isRTL ? "right" : "left" }}>{para}</Text>
              ))}
              {section.tips && (
                <View style={{ gap: 8, marginTop: 2 }}>
                  {section.tips.map((tip, i) => (
                    <View key={i} style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#A0624A", marginTop: 7, flexShrink: 0 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: "#6B5040", lineHeight: 21, textAlign: isRTL ? "right" : "left" }}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={{ borderTopWidth: 1, borderTopColor: "#D9CFC4", paddingTop: 16, gap: 8 }}>
          <Text style={{ fontSize: 11, color: "#A09080", textAlign: isRTL ? "right" : "left" }}>
            {isRTL
              ? <>آخر تحديث: ٢٣ مارس ٢٠٢٦. لأي استفسارات، تواصل معنا على{" "}<Text style={{ color: "#4A3728", fontWeight: "600" }} onPress={() => Linking.openURL("mailto:commune.eg@gmail.com")}>commune.eg@gmail.com</Text></>
              : <>Last updated 23 March 2026. For questions, contact us at{" "}<Text style={{ color: "#4A3728", fontWeight: "600" }} onPress={() => Linking.openURL("mailto:commune.eg@gmail.com")}>commune.eg@gmail.com</Text></>
            }
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
