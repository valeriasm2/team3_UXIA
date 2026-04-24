import React from "react";
import IdentificaItem from "../components/IdentificaItem";

const ExpoDetail = ({
  expo,
  items,
  indexItem,
  setIndexItem,
  onBack,
  verDetalleItem,
}) => {
  const itemActual = items[indexItem];

  const anteriorItem = () => {
    setIndexItem((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const seguentItem = () => {
    setIndexItem((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in space-y-12">
      {/* EXPO HEADER & NAV */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="order-2 sm:order-1">
          <button
            onClick={onBack}
            className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs uppercase"
          >
            ← Tornar
          </button>
        </div>

        <div className="order-1 sm:order-2 text-center sm:text-left flex-1 space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
            {expo.nom}
          </h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-slate-400 text-sm font-bold uppercase tracking-wider">
            <span>📍 {expo.lloc}</span>
            <span className="text-slate-200">|</span>
            <span>
              📅 {expo.data_inici} — {expo.data_fi}
            </span>
          </div>
        </div>

        <div className="hidden sm:block order-3">
          <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-black">
            {items.length}
          </div>
        </div>
      </div>

      {/* ITEMS CAROUSEL */}
      {items.length > 0 ? (
        <div className="relative group">
          {/* MOBILE ARROWS (Overlay) */}
          <div className="lg:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-20 pointer-events-none">
            <button
              onClick={anteriorItem}
              className="border border-slate-200 text-slate-800 p-4 rounded-full shadow-xl hover:bg-slate-50 transition-all active:scale-95 pointer-events-auto bg-white/90 w-12 h-12 flex items-center justify-center font-bold"
            >
              ←
            </button>
            <button
              onClick={seguentItem}
              className="border border-slate-200 text-slate-800 p-4 rounded-full shadow-xl hover:bg-slate-50 transition-all active:scale-95 pointer-events-auto bg-white/90 w-12 h-12 flex items-center justify-center font-bold"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* DESKTOP LEFT ARROW */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <button
                onClick={anteriorItem}
                className="bg-white border border-slate-200 text-slate-800 p-4 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            <div className="lg:col-span-10">
              <div
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer hover:border-accent/40"
                onClick={() => verDetalleItem(itemActual)}
              >
                <div className="aspect-video sm:aspect-21/9 overflow-hidden -m-6 mb-6 bg-slate-100 flex items-center justify-center relative">
                  {itemActual.imatge ? (
                    <img
                      src={itemActual.imatge}
                      alt={itemActual.nom}
                      className="w-full h-full object-contain transform transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-200 text-lg font-black uppercase tracking-widest">
                      Sense imatge
                    </div>
                  )}
                  <div className="absolute top-6 left-6 bg-accent text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg z-10">
                    Automòbil {indexItem + 1} de {items.length}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 leading-none">
                      {itemActual.nom}
                    </h3>
                    <button className="text-accent text-[10px] font-black tracking-[0.2em] border-b border-accent pb-1 hover:text-accent-dark hover:border-accent-dark transition-colors self-start sm:self-auto">
                      VEURE DETALLS +
                    </button>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-lg line-clamp-2 italic">
                    "{itemActual.descripcio}"
                  </p>
                </div>
              </div>
            </div>

            {/* DESKTOP RIGHT ARROW */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <button
                onClick={seguentItem}
                className="bg-white border border-slate-200 text-slate-800 p-4 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-white/5 rounded-[40px] border border-dashed border-white/5">
          <p className="text-white/20 font-black uppercase tracking-widest">
            No hi ha vehicles en aquesta exposició
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpoDetail;
