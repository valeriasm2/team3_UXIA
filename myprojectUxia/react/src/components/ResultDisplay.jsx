import React from "react";

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
      <div className="flex items-center gap-2 text-accent font-bold">
        <span>✨</span>
        <span>Identificació</span>
      </div>

      <p className="text-slate-700 leading-relaxed italic">
        "{result.descripcio}"
      </p>

      {result.etiquetes && result.etiquetes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.etiquetes.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
