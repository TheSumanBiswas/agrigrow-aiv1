import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { dictionaries, languages, LangCode, TranslationKey } from "./translations";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: TranslationKey) => string;
  aiLanguageName: string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "agriscan-lang";

const getInitialLang = (): LangCode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && stored in dictionaries) return stored;
  } catch {
    /* ignore */
  }
  const browser = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en";
  return (browser in dictionaries ? browser : "en") as LangCode;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((code: LangCode) => setLangState(code), []);

  const t = useCallback(
    (key: TranslationKey) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key,
    [lang]
  );

  const aiLanguageName = languages.find((l) => l.code === lang)?.aiName ?? "English";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, aiLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
