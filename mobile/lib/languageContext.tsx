import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "./translations";
import { tr, translations } from "./translations";

const STORAGE_KEY = "app_lang";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations.en, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "en" || v === "ar") setLangState(v);
    });
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }

  const t = (key: keyof typeof translations.en, vars?: Record<string, string | number>) =>
    tr(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
