import { useState, useRef } from "react";
import apiService from "../api";
import CameraView from "./CameraView";
import ResultDisplay from "./ResultDisplay";

const IdentificaItem = () => {
  const [status, setStatus] = useState({
    loading: false,
    result: null,
    preview: null,
    isCameraMode: false,
  });
  const fileInputRef = useRef(null);

  const updateStatus = (params) =>
    setStatus((prev) => ({ ...prev, ...params }));

  const onCapture = (file, previewUrl) => {
    updateStatus({ preview: previewUrl, isCameraMode: false });
    identifyImage(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateStatus({ preview: URL.createObjectURL(file) });
      identifyImage(file);
    }
  };

  const identifyImage = async (file) => {
    updateStatus({ loading: true, result: null });
    try {
      const data = await apiService.identifyItem(file);
      updateStatus({ result: data });
    } catch (error) {
      console.error("Error identificant ítem:", error);
      updateStatus({
        result: {
          descripcio: `Error: ${error.message || "Problema de connexió amb la IA"}`,
          etiquetes: ["error"],
        },
      });
    } finally {
      updateStatus({ loading: false });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow animate-slide-up">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
            🔍
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Identifica amb marIA
            </h2>
            <p className="text-slate-400 text-sm uppercase tracking-widest text-[10px]">
              Ollama Vision
            </p>
          </div>
        </div>

        {status.isCameraMode ? (
          <CameraView
            onCapture={onCapture}
            onCancel={() => updateStatus({ isCameraMode: false })}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative aspect-video bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
              {status.preview ? (
                <div className="relative h-full w-full">
                  <img
                    src={status.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {status.loading && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="text-accent font-bold text-xs uppercase tracking-widest">
                        Analitzant...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="text-4xl">📸</div>
                  <p className="text-xs font-bold uppercase">Sense imatge</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Saber-ne més
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Fes una foto o puja una imatge per saber quin vehicle és.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="bg-accent text-white font-semibold px-6 rounded-lg hover:bg-accent-dark transition-colors w-full flex items-center justify-center gap-3 py-3"
                  onClick={() => updateStatus({ isCameraMode: true })}
                  disabled={status.loading}
                >
                  OBRIR CÀMERA
                </button>

                <button
                  className="bg-white border border-slate-200 text-slate-600 w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                  onClick={() => fileInputRef.current.click()}
                  disabled={status.loading}
                >
                  PUJAR IMATGE
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        <ResultDisplay result={status.result} />
      </div>
    </div>
  );
};

export default IdentificaItem;
