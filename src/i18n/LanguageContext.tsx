import React, { createContext, useContext, useState, useCallback } from "react";
import ta from "./ta.json";
import en from "./en.json";

export type Lang = "ta" | "en";
const translations = { ta, en } as const;

export type TranslationKey = keyof typeof ta;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ta",
  setLang: () => {},
  t: (key) => String(key),
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("app_lang") as Lang) || "ta"
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("app_lang", l);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const dict = translations[lang] as Record<string, string>;
    const fallback = translations.ta as Record<string, string>;
    return dict[key] || fallback[key] || String(key);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

