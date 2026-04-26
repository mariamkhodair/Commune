"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useLang } from "@/lib/languageContext";

const sectionsEn = [
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
      "We strongly encourage members to share additional photos in the chat if the other party asks. If something looks different in person from how it was listed, be upfront — it goes a long way.",
    ],
  },
  {
    title: "3. Ratings and Standing in the Community",
    body: [
      "After each completed swap, both members have the opportunity to rate each other. Your rating reflects your reliability and honesty as a community member — treat it the way you would treat your reputation.",
      "Members whose rating falls below 3 stars will be matched less frequently on the platform. This is not a punishment — it is a signal that something in how you're swapping could be improved. There is no shame in listing an item as 'Fair' if that's what it is; honest listings tend to earn better ratings than overpromised ones.",
    ],
  },
  {
    title: "4. Exchange Safety — Please Read Carefully",
    body: [
      "Commune facilitates connections between members but is not present at any physical exchange. All in-person meetups are arranged independently between members, and Commune bears no responsibility for any accidents, disputes, losses, or mishaps that may occur during or after an exchange. Participating in swaps is done at each member's own discretion and risk.",
      "With that in mind, we strongly recommend the following:",
    ],
    tips: [
      "Meet in a public place — a café, a mall, or any busy, well-lit location. Avoid meeting at private homes, especially for a first exchange.",
      "Do not go alone to meet a member you have never met before. Bring a friend or let someone know where you are going.",
      "Inspect the item thoroughly at the exchange point before the swap is finalised. Once both parties leave, the exchange is considered complete.",
      "Ask for more photos in the chat if you have any doubts before meeting. It is always better to ask than to be surprised.",
    ],
  },
  {
    title: "5. Calling Off an Exchange",
    body: [
      "Either member may choose not to proceed with a swap at the exchange point — for any reason. This is your right. However, please be aware that the other member may choose to reflect this in their rating of you. Commune will not intervene in rating decisions made in good faith.",
      "If you have a change of heart, we encourage you to communicate this as early as possible — ideally before making the trip — out of respect for the other member's time.",
    ],
  },
  {
    title: "6. Reporting and Bans",
    body: [
      "If a member behaves in a way that makes you feel unsafe, uncomfortable, or deceived, you can report them directly from their profile. All reports are reviewed by the Commune team.",
      "Members confirmed to have engaged in harassment, indecency, or repeated misrepresentation will be permanently removed from the platform and their subscription will not be refunded.",
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

const sectionsAr = [
  {
    title: "١. الاحترام فوق كل شيء",
    body: [
      "كوميون مجتمع قائم على الثقة. يُتوقع من كل عضو أن يعامل الآخرين بأدب واحترام في جميع الأوقات — في الرسائل، وعند نقاط التبادل، وفي كل تفاعل على المنصة.",
      "السلوك غير المحترم والمضايقات وخطاب الكراهية وأي شكل من أشكال الإساءة لن يُتسامح معها. الأعضاء الذين يثبت تورطهم في مثل هذا السلوك سيُحظرون نهائياً وستُلغى اشتراكاتهم دون استرداد.",
    ],
  },
  {
    title: "٢. الأمانة في وصف منتجاتك",
    body: [
      "عند إدراج منتج، أنت مسؤول عن وصفه بدقة — بما في ذلك حالته وأي عيوب أو علامات استخدام أو تاريخ ذي صلة. تضليل المشتري يُعدّ خرقاً لثقة المجتمع وقد يؤدي إلى تقييم سلبي أو الإزالة من المنصة.",
      "إذا كنت غير متأكد مما إذا كان شيء ما يستحق الذكر، اذكره على أي حال. الشخص على الطرف الآخر يستحق الصورة الكاملة.",
      "نشجع الأعضاء بشدة على مشاركة صور إضافية في المحادثة إذا طلب الطرف الآخر. إذا بدا المنتج مختلفاً في الواقع عما هو مدرج، كن صريحاً — ذلك يُحدث فرقاً كبيراً.",
    ],
  },
  {
    title: "٣. التقييمات والمكانة في المجتمع",
    body: [
      "بعد كل إستبدال مكتمل، يتاح لكلا العضوين فرصة تقييم بعضهما. يعكس تقييمك مصداقيتك وأمانتك كعضو في المجتمع — تعامل معه كما تتعامل مع سمعتك.",
      "الأعضاء الذين ينخفض تقييمهم عن 3 نجوم ستقل تطابقاتهم على المنصة. هذا ليس عقاباً — بل إشارة إلى أن ثمة جانباً في طريقة إستبدالك يمكن تحسينه. لا حرج في إدراج منتج بحالة 'مقبول' إذا كان كذلك؛ الإدراجات الصادقة تحصل عادةً على تقييمات أفضل من تلك المبالغة.",
    ],
  },
  {
    title: "٤. سلامة التبادل — يرجى القراءة بعناية",
    body: [
      "كوميون يُيسّر التواصل بين الأعضاء لكنه غير حاضر في أي تبادل مادي. جميع اللقاءات الشخصية تُرتب بشكل مستقل بين الأعضاء، ولا تتحمل كوميون أي مسؤولية عن أي حوادث أو نزاعات أو خسائر قد تقع أثناء التبادل أو بعده. المشاركة في الإستبدالات تتم على مسؤولية كل عضو.",
      "مع ذلك، نوصي بشدة بما يلي:",
    ],
    tips: [
      "التقِ في مكان عام — مقهى، مول، أو أي مكان مزدحم وجيد الإضاءة. تجنب اللقاء في المنازل الخاصة، خاصةً في أول تبادل.",
      "لا تذهب وحدك للقاء عضو لم تلتقِ به من قبل. أحضر معك صديقاً أو أخبر أحداً بوجهتك.",
      "افحص المنتج جيداً عند نقطة التبادل قبل إتمام الإستبدال. بمجرد مغادرة الطرفين، يُعتبر التبادل مكتملاً.",
      "اطلب المزيد من الصور في المحادثة إذا كان لديك أي تشكيك قبل اللقاء. الأفضل دائماً أن تسأل على أن تفاجأ.",
    ],
  },
  {
    title: "٥. التراجع عن تبادل",
    body: [
      "يحق لأي من العضوين الامتناع عن إتمام الإستبدال عند نقطة التبادل — لأي سبب كان. هذا حقك. غير أن العضو الآخر قد يختار التعبير عن ذلك في تقييمه لك. لن تتدخل كوميون في قرارات التقييم المتخذة بحسن نية.",
      "إذا تغيّر رأيك، نشجعك على إبلاغ الطرف الآخر في أقرب وقت ممكن — ويُفضّل قبل الذهاب — احتراماً لوقته.",
    ],
  },
  {
    title: "٦. الإبلاغ والحظر",
    body: [
      "إذا تصرف عضو بطريقة تجعلك تشعر بعدم الأمان أو الانزعاج أو التضليل، يمكنك الإبلاغ عنه مباشرةً من صفحته الشخصية. جميع البلاغات يراجعها فريق كوميون.",
      "الأعضاء الذين يثبت تورطهم في المضايقة أو الإساءة أو التضليل المتكرر ستتم إزالتهم نهائياً من المنصة ولن يُسترد اشتراكهم.",
    ],
  },
  {
    title: "٧. العضوية",
    body: [
      "كوميون منصة قائمة على الاشتراك. للاطلاع على الخطط والأسعار الحالية، تفضّل بزيارة commune-eg.com.",
      "يمكنك الإلغاء في أي وقت من إعدادات حسابك؛ ستستمر في الوصول حتى نهاية فترة الفوترة الحالية.",
      "كوميون متاحة حالياً في مصر فقط.",
    ],
  },
];

export default function TermsAndConditions() {
  const { t, isRTL } = useLang();
  const sections = isRTL ? sectionsAr : sectionsEn;

  return (
    <div className="min-h-screen flex" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-2xl">

          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">{t("terms.header")}</h1>
          <p className="text-[#8B7355] mb-10">{t("terms.subheader")}</p>

          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-base font-semibold text-[#4A3728] mb-3">{section.title}</h2>
                <div className="flex flex-col gap-3">
                  {section.body.map((para, i) => (
                    <p key={i} className="text-sm text-[#6B5040] leading-relaxed">{para}</p>
                  ))}
                  {section.tips && (
                    <ul className="flex flex-col gap-2 mt-1">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#6B5040] leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A0624A] shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-[#D9CFC4]">
            <p className="text-xs text-[#A09080]">{isRTL ? "آخر تحديث في 23 مارس 2026. للاستفسار، تواصل معنا على" : "Last updated 23 March 2026. For questions, contact us at"}{" "}
              <a href="mailto:commune.eg@gmail.com" className="text-[#4A3728] hover:underline">commune.eg@gmail.com</a>.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
