const faqs = [
  {
    question: "How does swapping work?",
    answer: "Find an item you want, propose a swap by offering one of your own items in return, and coordinate a meetup once the other member accepts. No money changes hands.",
  },
  {
    question: "How does the points system work?",
    answer: "Each item is assigned a points value based on its current market price in Egypt. You can let our AI suggest a value or set your own. Points are used to match swaps of roughly equal value.",
  },
  {
    question: "How do I cancel my membership?",
    answer: "You can cancel at any time from your account settings. Your access continues until the end of your current billing period.",
  },
  {
    question: "Who can use Commune?",
    answer: "Commune is currently available in Egypt only.",
  },
  {
    question: "What if an item isn't as described?",
    answer: "Contact us at commune.eg@gmail.com and we'll step in to help resolve it. You can also report the member directly from their profile.",
  },
  {
    question: "How do I delete my account?",
    answer: "Email us at commune.eg@gmail.com and we will delete your account and personal data within 30 days.",
  },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-sm text-[#8B7355] hover:text-[#4A3728] transition-colors">← Commune</a>
          <h1 className="text-3xl font-light text-[#4A3728] mt-6 mb-2">Support</h1>
          <p className="text-[#8B7355]">We're here to help.</p>
        </div>

        {/* Contact */}
        <div className="bg-white/70 rounded-2xl px-6 py-5 border border-[#D9CFC4] mb-10">
          <p className="text-sm font-medium text-[#4A3728] mb-1">Get in touch</p>
          <p className="text-sm text-[#6B5040] leading-relaxed">
            Email us at{" "}
            <a href="mailto:commune.eg@gmail.com" className="text-[#4A3728] font-medium hover:underline">
              commune.eg@gmail.com
            </a>{" "}
            and we'll get back to you as soon as we can.
          </p>
        </div>

        {/* FAQs */}
        <h2 className="text-base font-semibold text-[#4A3728] mb-4">Common questions</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/60 rounded-2xl px-5 py-4 border border-[#D9CFC4]">
              <p className="text-sm font-medium text-[#4A3728] mb-1">{faq.question}</p>
              <p className="text-sm text-[#6B5040] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#D9CFC4]">
          <p className="text-xs text-[#A09080]">
            © 2026 Commune. Cairo, Egypt. ·{" "}
            <a href="/privacy" className="hover:text-[#4A3728] transition-colors">Privacy Policy</a>
          </p>
        </div>

      </div>
    </div>
  );
}
