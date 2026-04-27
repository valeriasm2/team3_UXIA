import React from "react";

const ExpoCard = ({ expo, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(expo)}
      className="card-estilo group cursor-pointer hover:scale-[1.02]"
    >
      <div className="aspect-video mb-4 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
        {expo.imatge ? (
          <img
            src={expo.imatge}
            alt={expo.nom}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            Falta Imatge
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {expo.nom}
        </h3>
        <div className="flex items-center justify-between texto-suave">
          <div className="flex items-center gap-1.5 min-w-0">
            <span>📍 {expo.lloc}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span>📅 {expo.data_inici}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpoCard;
