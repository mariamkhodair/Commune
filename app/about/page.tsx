"use client";

import Sidebar from "@/components/Sidebar";
import { useLang } from "@/lib/languageContext";

export default function AboutUs() {
  const { t, isRTL } = useLang();

  const storyParagraphs = isRTL ? [
    "وُلدت فكرة كوميون عام 2022 في أحد المقاهي الشعبية على كوباية قهوة تركي. كل شيء بدأ بحديث عن كمية الأشياء التي يمتلكها الناس! خزائن مليئة بملابس لم تُلبس، رفوف من الكتب التي لن تُقرأ مرة أخرى، أجهزة تجمع الغبار في الأدراج. في نفس الوقت، هناك من يبحث تحديداً عن هذه الأشياء.",
    "لم يكن السؤال: لماذا لا يستطيع الناس شراء أشياء جديدة؟ بل كان: لماذا يشترون الجديد أصلاً، في حين أن ما يحتاجونه ربما يجلس في بيت شخص آخر؟",
    "فبنينا منصة تساعد الناس على المبادلة بدلاً من الشراء — للحد من الهدر، وتخفيف الضغط المادي، والإسهام في شيء نافع.",
  ] : [
    "Commune was conceived in 2022 in a simple ahwa over a couple of dark roast turkish coffees. It all started with a conversation about how everyone has so much stuff! Wardrobes full of things never worn, shelves of books never re-read, gadgets collecting dust in drawers. Meanwhile, others are looking for exactly those things.",
    "The question wasn't why people couldn't afford new things. It was why they were buying new things at all when what they needed was probably already sitting in someone else's home.",
    "So we built a platform to help people trade instead of buy — reducing waste, cutting costs, and doing something good in the process.",
  ];

  const missionQuote = isRTL
    ? "«مساعدة الناس على ترتيب بيوتهم، وتوفير المال، ومساعدة المحتاجين — فقط عن طريق الإستبدال.»"
    : "\"To help people declutter their Homes, Save money\nand Help those in need - just by swapping.\"";

  const impactItems = isRTL ? [
    { emoji: "♻️", title: "أقل هدراً", body: "كل إستبدال ينقذ منتجاً من القمامة. كلما تبادلنا أكثر، قلّ استهلاكنا." },
    { emoji: "💸", title: "توفير حقيقي", body: "احصل على ما تحتاجه دون إنفاق. نظام النقاط يضمن تبادلاً عادلاً للقيمة بلا مال." },
    { emoji: "🤝🏽", title: "مساهمة في الخير", body: "30٪ من كل رسوم اشتراك سنوي تذهب للجمعيات الخيرية. نتعاون مع منظمات محلية لتمويل المستشفيات وبناء مدارس في مصر." },
  ] : [
    { emoji: "♻️", title: "Less Waste", body: "Every swap is an item saved from a landfill. The more we trade, the less we consume." },
    { emoji: "💸", title: "Real Savings", body: "Get what you need without spending. A points-based system means value is exchanged fairly, not just financially." },
    { emoji: "🤝🏽", title: "Giving Back", body: "30% of every annual subscription fee is donated to charity. We partner with local NGOs to fund hospitals and build schools across Egypt." },
  ];

  const founderBlurb = isRTL
    ? "أسّست مريم كوميون بقناعة راسخة أن تغييراً بسيطاً في نظرتنا إلى الملكية يمكن أن يحدث تأثيراً حقيقياً — للأفراد والمجتمعات والكوكب."
    : "Mariam founded Commune with the belief that a small shift in how we think about ownership can create a meaningful ripple effect — for individuals, communities, and the planet.";

  return (
    <div className="min-h-screen flex" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-2xl">

          {/* Header */}
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">{t("about.header")}</h1>
          <p className="text-[#8B7355] mb-10">{t("about.subheader")}</p>

          {/* Story */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">{t("about.storyTitle")}</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-4 text-sm text-[#6B5040] leading-relaxed">
              {storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {/* Mission */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">{t("about.missionTitle")}</h2>
            <div className="rounded-2xl px-6 py-8 text-center">
              <p className="text-xl text-[#4A3728] font-[family-name:var(--font-jost)] font-light leading-relaxed whitespace-pre-line">
                {missionQuote}
              </p>
            </div>
          </section>

          {/* Impact */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">{t("about.impactTitle")}</h2>
            <div className="flex flex-col gap-3">
              {impactItems.map((item) => (
                <div key={item.title} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4] flex gap-4 items-start">
                  <span className="text-2xl mt-0.5">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-[#4A3728] mb-1">{item.title}</p>
                    <p className="text-sm text-[#6B5040] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Founder */}
          <section>
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">{t("about.founderTitle")}</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-2">
              <p className="text-sm font-medium text-[#4A3728]">Mariam Khodair</p>
              <p className="text-sm text-[#6B5040] leading-relaxed">{founderBlurb}</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
