"use client";

import { useLang } from "@/lib/languageContext";

export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className={`px-4 py-1.5 rounded-full border border-[#D9CFC4] text-sm text-[#6B5040] hover:border-[#4A3728] hover:text-[#4A3728] transition-colors bg-white/60 ${className ?? ""}`}
    >
      {t("sidebar.language")}
    </button>
  );
}
