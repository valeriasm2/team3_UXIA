import { useState, useRef } from "react";

const IdentificaItem = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      identifyImage(file);
    }
  };

  const identifyImage = async (file) => {
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("imatge", file);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error del servidor (${response.status}): ${errorText.substring(0, 50)}`,
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error identificant ítem:", error);
      setResult({
        descripcio: `Error: ${error.message || "Problema de connexió amb la IA"}`,
        etiquetes: ["error", "x"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-estilo bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 animate-slide-up">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
            🔍
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Identifica amb marIA
            </h2>
            <p className="texto-suave uppercase tracking-widest text-[10px]">
              Ollama Vision
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600">
            {preview ? (
              <div className="relative h-full w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {loading && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="text-accent font-bold text-xs uppercase tracking-widest">
                      Analitzant...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                <div className="text-4xl">📸</div>
                <p className="text-xs font-bold uppercase">Sense imatge</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Fes una foto
              </h3>
              <p className="texto-suave leading-relaxed">
                Utilitza la càmera per identificar qualsevol vehicle de
                l'exposició al moment.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="boton-principal w-full flex items-center justify-center gap-3 py-3"
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
              >
                {loading ? "PROCESSANT..." : "IDENTIFICAR COTXE"}
              </button>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleCapture}
                className="hidden"
              />

              <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center uppercase tracking-widest italic">
                Optimitzat per a dispositius mòbils amb càmera HD
              </p>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-accent font-bold">
              <span>✨</span>
              <span>Identificació</span>
            </div>

            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{result.descripcio}"
            </p>

            {result.etiquetes && result.etiquetes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.etiquetes.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-bold uppercase rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(100%); }
        }
      `,
        }}
      />
    </div>
  );
};

export default IdentificaItem;
