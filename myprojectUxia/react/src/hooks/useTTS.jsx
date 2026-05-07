import { useCallback, useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export const useTTS = () => {
  const { languageCode } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== "undefined" &&
      (window.speechSynthesis !== undefined ||
        window.webkitSpeechSynthesis !== undefined),
  );
  const [availableVoices, setAvailableVoices] = useState([]);

  // Get available voices
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      setAvailableVoices(voices);
    };

    updateVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis?.removeEventListener?.(
        "voiceschanged",
        updateVoices,
      );
    };
  }, [isSupported]);

  // Map language codes to language variants that Web Speech API recognizes
  const getLanguageVariant = (lang) => {
    const variants = {
      ca: ["ca-ES", "ca", "ca-AD", "ca-Valencia"],
      es: ["es-ES", "es-MX", "es"],
      en: ["en-US", "en-GB", "en"],
      fr: ["fr-FR", "fr-CA", "fr"],
    };
    return variants[lang] || ["en-US"];
  };

  // Find best matching voice for language
  const findBestVoice = (targetLanguage) => {
    const variants = getLanguageVariant(targetLanguage);

    // Try each variant
    for (const variant of variants) {
      const voice = availableVoices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(variant.toLowerCase()) ||
          v.lang.toLowerCase() === variant.toLowerCase(),
      );
      if (voice) {
        console.log(
          `Found voice for ${targetLanguage}: ${voice.name} (${voice.lang})`,
        );
        return variant;
      }
    }

    // Fallback: try to find any voice that starts with the language code
    const langCode = targetLanguage.split("-")[0];
    const fallbackVoice = availableVoices.find((v) =>
      v.lang.toLowerCase().startsWith(langCode.toLowerCase()),
    );
    if (fallbackVoice) {
      console.log(
        `Fallback voice for ${targetLanguage}: ${fallbackVoice.name} (${fallbackVoice.lang})`,
      );
      return fallbackVoice.lang;
    }

    console.warn(`No voice found for ${targetLanguage}, using ${variants[0]}`);
    return variants[0];
  };

  const speak = useCallback(
    (text, language = null) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis?.cancel?.();

      const utterance = new SpeechSynthesisUtterance(text);

      // Get the target language
      const targetLang = language || languageCode;

      // Find the best voice
      const bestLang = findBestVoice(targetLang);
      utterance.lang = bestLang;

      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("TTS Error:", event.error);
        setIsSpeaking(false);
      };

      window.speechSynthesis?.speak?.(utterance);
    },
    [languageCode, isSupported, availableVoices],
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel?.();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
};
