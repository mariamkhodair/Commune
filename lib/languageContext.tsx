"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Lang, translations, tr } from "./translations";

type LangContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Parameters<typeof tr>[1], vars?: Parameters<typeof tr>[2]) => string;
  isRTL: boolean;
};

const Ctx = createContext<LangContext>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("commune_lang") as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("commune_lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const dict = translations[lang];
  const t = (key: Parameters<typeof tr>[1], vars?: Parameters<typeof tr>[2]) =>
    tr(dict, key, vars);

  return (
    <Ctx.Provider value={{ lang, setLang, t, isRTL: lang === "ar" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  return useContext(Ctx);
}
