"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useLang } from "@/lib/languageContext";

type FAQ = { question: string; answer: string };

const FAQS_EN: FAQ[] = [
  {
    question: "How does the points system work?",
    answer: "When you list an item, our AI analyses it and assigns a points value based on its current market price in Egypt. You use those points to swap for items of similar value from other members — no money changes hands.",
  },
  {
    question: "How does swapping work?",
    answer: "Find an item you want in Search, then propose a swap. For a swap to be a true match, your offer must include at least one item from the other member's Stuff I Want list — and the item you're requesting must satisfy something on yours. The other member will review your proposal and can accept or decline. Once accepted, you coordinate the handoff and both items are marked as swapped.",
  },
  {
    question: "Can I swap multiple items at once?",
    answer: "Yes — this is called a bundle swap. If one member's item is worth more than any single item you have, you can offer multiple items whose points add up to the same value. To propose a bundle swap, go to a member's profile page and tap 'Select items'. Choose all the items you're interested in, then tap 'Propose Bundle Swap'. When the swap proposal opens, Commune will automatically suggest the best combination of your items to match the total points value as closely as possible. You can adjust the selection if you prefer. The same matching rule applies — at least one item on each side must satisfy something on the other member's Stuff I Want list.",
  },
  {
    question: "What if the points value assigned to my item doesn't feel fair?",
    answer: "You're in control. When listing an item you can either let our AI suggest a points value based on the current Egyptian market price, or set your own value manually. If you go with AI and the result doesn't feel right, simply switch to 'Set My Own' and enter the value you think is fair.",
  },
  {
    question: "I've matched — now how do I swap?",
    answer: "Once a swap proposal is accepted, here's how the full process works:\n\n1. Head to the chat with your match and use the 'Schedule a Swap' button (next to the send button) to suggest a date. Pick a day on the calendar and send the suggestion — the other member will need to confirm it before the date is locked in.\n\n2. Once you both agree, the swap will appear in your Scheduled Swaps section in the sidebar, with all the details of what's being exchanged and when.\n\n3. On the day of the swap, open the app and go to Scheduled Swaps. When you're ready to leave, press 'Off to Swap'. This will activate location sharing between you and the other member so you can both see that the other is on their way — and as a safety measure during the exchange.\n\n4. We strongly recommend meeting in a public place — a café, a mall, or another busy location. Inspect the item when you meet, and don't go alone to meet someone for the first time. If you have any doubts about the item beforehand, ask for more photos in the chat.\n\n5. Once the swap is done and you're safely on your way home, press 'Swapped and Safe'. This ends location tracking for both members. After that, you'll be prompted to leave a rating for the other member.",
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
    answer: "Members with a rating below 3 stars will be matched less frequently — our system prioritises pairing people with strong community reputations. Think of your rating the way you'd think of your reputation in any community: it's worth looking after. That said, honesty is always better than a bad surprise. If your item is in Fair condition, list it as Fair — members who want it will find you, and you'll get a fair rating for it. There's no shame in being straightforward.",
  },
  {
    question: "What happens if an item isn't as described?",
    answer: "We take misrepresentation seriously. If you receive an item that doesn't match its listing, contact us immediately and we'll step in to resolve it. Make sure to use the rating system — and feel free to report the person if needed.",
  },
];

const FAQS_AR: FAQ[] = [
  {
    question: "كيف يعمل نظام النقاط؟",
    answer: "عندما تضيف منتجاً، يحلله الذكاء الاصطناعي ويعطيه قيمة بالنقاط بناءً على سعره الحالي في السوق المصري. تستخدم هذه النقاط لاستبدال منتجات ذات قيمة مماثلة من أعضاء آخرين — دون أي تبادل مالي.",
  },
  {
    question: "كيف يعمل الإستبدال؟",
    answer: "ابحث عن منتج تريده في Search، ثم اقترح إستبدالاً. لكي يكون الإستبدال متوافقاً، يجب أن يتضمن عرضك على الأقل منتجاً واحداً من قائمة \"ما أريده\" لدى العضو الآخر — كما يجب أن يلبّي المنتج الذي تطلبه شيئاً من قائمتك. بإمكان العضو الآخر قبول اقتراحك أو رفضه. بعد القبول، تنسّقان عملية التسليم ويُحدَّث كلا المنتجين.",
  },
  {
    question: "هل يمكنني استبدال أكثر من منتج في آنٍ واحد؟",
    answer: "نعم — يُسمى ذلك إستبدال مجموعة. إذا كانت قيمة منتج لدى عضو آخر أعلى من أي منتج لديك منفرداً، يمكنك تقديم عدة منتجات تجمعها بنفس القيمة بالنقاط. لاقتراح إستبدال مجموعة، انتقل إلى صفحة ملف العضو واضغط \"اختر منتجات\". اختر المنتجات التي يهمّك، ثم اضغط \"اقتراح إستبدال مجموعة\". عند فتح نافذة الاقتراح، ستقترح كوميون تلقائياً أفضل تركيبة من منتجاتك لمطابقة إجمالي النقاط بأكبر قدر من الدقة. يمكنك تعديل الاختيار إذا أردت. تنطبق نفس قاعدة التوافق — يجب أن يلبّي منتج واحد على الأقل من كل طرف شيئاً من قائمة \"ما أريده\" للطرف الآخر.",
  },
  {
    question: "ماذا لو لم تبدُ قيمة النقاط المحددة لمنتجي عادلة؟",
    answer: "أنت من يتحكم. عند إضافة منتج، يمكنك السماح للذكاء الاصطناعي باقتراح قيمة للنقاط بناءً على السعر الحالي في السوق المصري، أو تحديدها بنفسك يدوياً. إذا اخترت الذكاء الاصطناعي ولم تبدُ النتيجة عادلة، انتقل ببساطة إلى \"تحديد يدوي\" وأدخل القيمة التي تراها مناسبة.",
  },
  {
    question: "وجدتُ تطابقاً — كيف أُتمّ الإستبدال؟",
    answer: "بمجرد قبول اقتراح الإستبدال، إليك كيفية سير العملية:\n\n١. انتقل إلى المحادثة مع تطابقك واستخدم زر \"جدوِل إستبدالاً\" (بجانب زر الإرسال) لاقتراح تاريخ. اختر يوماً من التقويم وأرسل الاقتراح — سيحتاج العضو الآخر إلى تأكيده قبل تثبيت الموعد.\n\n٢. بعد موافقتكما، سيظهر الإستبدال في قسم \"الإستبدالات المجدولة\" في الشريط الجانبي، مع جميع تفاصيل ما يُستبدل ومتى.\n\n٣. في يوم الإستبدال، افتح التطبيق وانتقل إلى الإستبدالات المجدولة. عند استعدادك للخروج، اضغط \"في طريقي للإستبدال\". سيُفعّل هذا مشاركة الموقع بينك وبين العضو الآخر حتى يرى كلاكما أن الآخر في الطريق — وكإجراء أمان أثناء التبادل.\n\n٤. نوصي بشدة بالاجتماع في مكان عام — مقهى أو مول أو أي مكان مزدحم. افحص المنتج عند اللقاء، ولا تذهب وحدك لمقابلة شخص للمرة الأولى. إذا كان لديك أي شك حول المنتج مسبقاً، اطلب صوراً إضافية في المحادثة.\n\n٥. بعد الانتهاء من الإستبدال والعودة للمنزل بأمان، اضغط \"تم الإستبدال بأمان\". ينهي هذا تتبع الموقع لكلا العضوين. بعدها، ستُطلب منك تقييم العضو الآخر.",
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
    answer: "الأعضاء الذين يقل تقييمهم عن ٣ نجوم سيُطابَقون مع آخرين بشكل أقل — نظامنا يُولي الأولوية لمطابقة الأشخاص ذوي السمعة الجيدة في المجتمع. فكّر في تقييمك كما تفكّر في سمعتك في أي مجتمع: تستحق الاهتمام. ومع ذلك، الصدق دائماً أفضل من مفاجأة سيئة. إذا كان منتجك في حالة \"مقبولة\"، أدرجه كذلك — من يريده سيجدك، وستحصل على تقييم عادل. لا حرج في الوضوح.",
  },
  {
    question: "ماذا يحدث إذا لم يطابق المنتج وصفه؟",
    answer: "نأخذ التضليل بجدية تامة. إذا تلقيت منتجاً لا يتطابق مع وصفه، تواصل معنا فوراً وسنتدخل لحل الأمر. احرص على استخدام نظام التقييم — ولا تتردد في الإبلاغ عن الشخص إذا لزم الأمر.",
  },
];

export default function GetHelp() {
  const { t, isRTL } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to email/Supabase
    setSubmitted(true);
  }

  const formComplete = form.name && form.email && form.message;
  const faqs = isRTL ? FAQS_AR : FAQS_EN;

  return (
    <div className="min-h-screen flex" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="max-w-2xl">

          {/* Header */}
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">{t("help.header")}</h1>
          <p className="text-[#8B7355] mb-10">{t("help.subheader")}</p>

          {/* FAQs */}
          <section className="mb-12">
            <h2 className="text-lg font-medium text-[#4A3728] mb-4">{t("help.faqs")}</h2>
            <div className="flex flex-col gap-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#D9CFC4]">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-[#4A3728]">{faq.question}</span>
                    <svg
                      viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round"
                      className={`w-4 h-4 shrink-0 ml-4 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openIndex === i && (
                    <div className="px-5 pb-4 text-sm text-[#6B5040] leading-relaxed border-t border-[#EDE8DF] pt-3 flex flex-col gap-2">
                      {faq.answer.split("\n\n").map((para, pi) => (
                        <p key={pi}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact form */}
          <section>
            <h2 className="text-lg font-medium text-[#4A3728] mb-1">{t("help.stillNeedHelp")}</h2>
            <p className="text-sm text-[#8B7355] mb-5">
              {t("help.contactSubtitle")}{" "}
              <a href="mailto:commune.eg@gmail.com" className="text-[#4A3728] font-medium hover:underline">
                commune.eg@gmail.com
              </a>
            </p>

            {submitted ? (
              <div className="bg-[#D8E4D0] rounded-2xl px-6 py-8 text-center">
                <p className="text-lg font-medium text-[#4A6640] mb-1">{t("help.sent")}</p>
                <p className="text-sm text-[#4A6640]">{t("help.sentHint")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">{t("help.name")}</label>
                  <input
                    name="name"
                    type="text"
                    placeholder={t("help.yourName")}
                    value={form.name}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">{t("help.email")}</label>
                  <input
                    name="email"
                    type="email"
                    placeholder={t("help.yourEmail")}
                    value={form.email}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">{t("help.message")}</label>
                  <textarea
                    name="message"
                    placeholder={t("help.whatNeedHelp")}
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!formComplete}
                  className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("help.sendMessage")}
                </button>

              </form>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
