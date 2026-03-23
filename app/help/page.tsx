"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

const faqs = [
  {
    question: "How does the points system work?",
    answer: "When you list an item, our AI analyses it and assigns a points value based on its current market price in Egypt. You use those points to swap for items of similar value from other users — no money changes hands.",
  },
  {
    question: "How does swapping work?",
    answer: "Find an item you want in Search, then propose a swap. The other user will see your offer and can accept or decline. Once accepted, you coordinate the handoff and both items are marked as swapped.",
  },
  {
    question: "What if the points value assigned to my item doesn't feel fair?",
    answer: "You're in control. When listing an item you can either let our AI suggest a points value based on the current Egyptian market price, or set your own value manually. If you go with AI and the result doesn't feel right, simply switch to 'Set My Own' and enter the value you think is fair.",
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
    question: "What happens if an item isn't as described?",
    answer: "We take misrepresentation seriously. If you receive an item that doesn't match its listing, contact us immediately and we'll step in to resolve it.",
  },
];

export default function GetHelp() {
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

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="max-w-2xl">

          {/* Header */}
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Get Help</h1>
          <p className="text-[#8B7355] mb-10">We're here to help. Browse the FAQs or send us a message.</p>

          {/* FAQs */}
          <section className="mb-12">
            <h2 className="text-lg font-medium text-[#4A3728] mb-4">Frequently Asked Questions</h2>
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
                    <div className="px-5 pb-4 text-sm text-[#6B5040] leading-relaxed border-t border-[#EDE8DF] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact form */}
          <section>
            <h2 className="text-lg font-medium text-[#4A3728] mb-1">Still need help?</h2>
            <p className="text-sm text-[#8B7355] mb-5">
              Send us a message or email us directly at{" "}
              <a href="mailto:commune.eg@gmail.com" className="text-[#4A3728] font-medium hover:underline">
                commune.eg@gmail.com
              </a>
            </p>

            {submitted ? (
              <div className="bg-[#D8E4D0] rounded-2xl px-6 py-8 text-center">
                <p className="text-lg font-medium text-[#4A6640] mb-1">Message sent!</p>
                <p className="text-sm text-[#4A6640]">We'll get back to you as soon as we can.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Message</label>
                  <textarea
                    name="message"
                    placeholder="What do you need help with?"
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
                  Send Message
                </button>

              </form>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
