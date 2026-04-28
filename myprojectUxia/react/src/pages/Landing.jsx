import React, { useState } from "react";
import ExpoCard from "../components/ExpoCard";
import IdentificaItem from "../IdentificaItem";

const Landing = ({ expos, onSelectExpo }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearchTerm(value);

    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(value)}`,
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExpo = (result) => {
    if (result.type === "expo") {
      const expo = expos.find((e) => e.id === result.id);
      if (expo) {
        onSelectExpo(expo);
      }
    }
  };

  const showResults = searchTerm.length >= 3;
  const expoResults = searchResults.filter((r) => r.type === "expo");
  const itemResults = searchResults.filter((r) => r.type === "item");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-slide-up space-y-16">
      {/* SEARCH SECTION */}
      <section className="space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-slate-900">
            Explora UXIA
          </h2>
          <p className="texto-suave">
            Busca una ciutat, esdeveniment o cotxe per veure els continguts de
            l'exposició.
          </p>

          {/* SEARCH BAR */}
          <div className="relative w-full mt-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Escriu almenys 3 lletres..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm"
            />

            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="absolute top-full left-0 right-0 mt-4 text-center animate-pulse">
                <p className="text-accent/50 text-[10px] font-black uppercase tracking-[0.2em]">
                  Escriu {3 - searchTerm.length} caràcters més...
                </p>
              </div>
            )}

            {isLoading && searchTerm.length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-4 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                  Cercant...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RESULTS SECTION - Only shown if searchTerm >= 3 */}
        {showResults ? (
          <div className="space-y-12 animate-fade-in">
            {/* EXPOS SECTION */}
            {expoResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                      EXPO
                    </span>
                    Exposicions ({expoResults.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
                  {expoResults.map((result) => (
                    <div
                      key={`expo-${result.id}`}
                      onClick={() => handleSelectExpo(result)}
                      className="cursor-pointer"
                    >
                      <ExpoCard
                        expo={result}
                        onSelect={() => handleSelectExpo(result)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ITEMS SECTION */}
            {itemResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                      ITEM
                    </span>
                    Cotxes ({itemResults.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {itemResults.map((result) => (
                    <div
                      key={`item-${result.id}`}
                      className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {result.imatge && (
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={result.imatge}
                            alt={result.nom}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-slate-900 mb-2">
                          {result.nom}
                        </h4>
                        <p className="text-slate-600 text-sm line-clamp-2">
                          {result.descripcio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NO RESULTS */}
            {expoResults.length === 0 && itemResults.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="texto-suave">
                  No hi ha coincidències per "{searchTerm}"
                </p>
              </div>
            )}

            {/* CLEAR BUTTON */}
            {searchTerm && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase transition-colors"
                >
                  Netejar ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          /* INITIAL PLACEHOLDER */
          <div className="py-12 flex flex-col items-center opacity-20">
            <div className="w-px h-16 bg-accent rounded-full"></div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest">
              Esperant cerca
            </p>
          </div>
        )}
      </section>

      {/* IA SECTION */}
      <section className="pt-16 border-t border-slate-100">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            No saps quin cotxe és?
          </h2>
          <p className="texto-suave">
            Utilitza la nostra identificació visual "marIA"
          </p>
        </div>
        <IdentificaItem />
      </section>
    </div>
  );
};

export default Landing;
