import React, { createContext, useContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

const LANGUAGE_CODES = {
  ca: "ca",
  es: "es",
  en: "en",
  fr: "fr",
};

const LANGUAGE_NAMES = {
  ca: "Català",
  es: "Castellà",
  en: "Anglès",
  fr: "Francès",
};

const getBrowserLanguage = () => {
  if (typeof navigator === "undefined") return "ca";

  const browserLang = navigator.language || navigator.userLanguage || "ca";
  const langCode = browserLang.split("-")[0];

  // Map common language codes to our supported languages
  const langMap = {
    ca: "ca",
    es: "es",
    en: "en",
    fr: "fr",
  };

  return langMap[langCode] || "ca";
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // First, try to get from localStorage
    if (typeof window !== "undefined" && localStorage) {
      const stored = localStorage.getItem("selectedLanguage");
      if (stored && LANGUAGE_CODES[stored]) {
        return stored;
      }
    }
    // Fall back to browser language
    return getBrowserLanguage();
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage) {
      localStorage.setItem("selectedLanguage", language);
    }
  }, [language]);

  const changeLanguage = (lang) => {
    if (LANGUAGE_CODES[lang]) {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    changeLanguage,
    languageCode: LANGUAGE_CODES[language] || LANGUAGE_CODES.ca,
    languageName: LANGUAGE_NAMES[language] || LANGUAGE_NAMES.ca,
    supportedLanguages: [
      { code: "ca", name: "Català" },
      { code: "es", name: "Castellà" },
      { code: "en", name: "Anglès" },
      { code: "fr", name: "Francès" },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
