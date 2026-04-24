import React from "react";

const ItemDetailModal = ({ item, close, images }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={close}></div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-slide-up">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold"
        >
          ✕
        </button>

        <div className="space-y-10">
          <header className="space-y-2 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3 text-slate-400 text-sm font-bold uppercase tracking-widest">
              <span>🚘 Vehicle</span>
              <span className="text-slate-200">|</span>
              <span>ID: {item.id}</span>
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {item.nom}
            </h2>
          </header>

          <div className="border-l-4 border-slate-100 pl-6 py-2">
            <p className="text-slate-600 leading-relaxed text-xl italic">
              "{item.descripcio}"
            </p>
          </div>

          <section className="space-y-4">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>🖼️</span> Galeria d'imatges
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {images && images.length > 0 ? (
                images.map((img) => (
                  <div
                    key={img.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
                  >
                    <img
                      src={img.imatge}
                      alt={`Vista de ${item.nom}`}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    {img.ordre === 1 && (
                      <span className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                        Destacada
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                    No hi ha imatges adicionals
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
