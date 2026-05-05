import React from "react";
import { useTTS } from "../hooks/useTTS";

const ItemDetailModal = ({ item, expo, close, images }) => {
  const { speak, stop, isSpeaking, isSupported } = useTTS();

  if (!item) return null;

  // Map Expo idioma codes to Web Speech language codes
  const getLanguageCode = (idioma) => {
    const languageVariants = {
      ca: "ca",
      es: "es",
      en: "en",
      fr: "fr",
    };
    return languageVariants[idioma] || "ca";
  };

  const handleReadItemName = () => {
    if (isSpeaking) {
      stop();
    } else {
      const expoLanguage = expo ? getLanguageCode(expo.idioma) : null;
      speak(item.nom, expoLanguage);
    }
  };

  const handleReadDescription = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(item.descripcio);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
        onClick={close}
      />
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-slate-100 dark:border-slate-700 p-8 sm:p-12 transition-colors">
        <button
          onClick={close}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          ✕
        </button>

        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {item.nom}
              </h2>
              {isSupported && (
                <button
                  onClick={handleReadItemName}
                  title={`Pronunciar identificador${expo ? ` (${expo.idioma})` : ""}`}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 font-semibold text-sm ${
                    isSpeaking
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-accent text-white hover:bg-accent-dark"
                  }`}
                >
                  🔊
                </button>
              )}
            </div>
            <p className="text-accent text-sm uppercase tracking-widest font-bold">
              Especificacions i Galeria
            </p>
          </div>

          <div className="border-l-4 border-slate-100 dark:border-slate-700 pl-6 py-2">
            <div className="flex items-start gap-3">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xl italic flex-1">
                "{item.descripcio}"
              </p>
              {isSupported && (
                <button
                  onClick={handleReadDescription}
                  title={isSpeaking ? "Parar" : "Llegir descripció"}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 font-semibold text-sm ${
                    isSpeaking
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-accent text-white hover:bg-accent-dark"
                  }`}
                >
                  {isSpeaking ? "⏹️" : "🔊"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
              Galeria Multimèdia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {images && images.length > 0 ? (
                images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-700 aspect-video border border-slate-100 dark:border-slate-700 shadow-sm"
                  >
                    <img
                      src={img.imatge}
                      alt="Imatge del vehicle"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-300 dark:text-slate-600">
                  No hi ha imatges addicionals disponibles
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              onClick={close}
              className="bg-accent text-white font-semibold py-2 px-6 rounded-lg hover:bg-accent-dark transition-colors"
            >
              Tancar galeria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
