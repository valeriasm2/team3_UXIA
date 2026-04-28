import React from "react";

const ItemDetailModal = ({ item, close, images }) => {
  if (!item) return null;

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
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {item.nom}
            </h2>
            <p className="text-accent text-sm uppercase tracking-widest font-bold">
              Especificacions i Galeria
            </p>
          </div>

          <div className="border-l-4 border-slate-100 dark:border-slate-700 pl-6 py-2">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xl italic">
              "{item.descripcio}"
            </p>
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
