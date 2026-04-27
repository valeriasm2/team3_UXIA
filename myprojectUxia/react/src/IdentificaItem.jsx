import { useState, useRef } from "react";
import { identifyItem } from "./api";

const IdentificaItem = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCamera, setIsCamera] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setIsCamera(true);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      setIsCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setPreview(dataUrl);

    // Convert to file and send
    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      identifyImage(file);
    }, "image/jpeg");

    // Stop camera
    video.srcObject.getTracks().forEach((t) => t.stop());
    setIsCamera(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setIsCamera(false);
      identifyImage(file);
    }
  };

  const identifyImage = async (file) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await identifyItem(file);
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
    <div className="card-estilo bg-slate-50 border-slate-200 animate-slide-up">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
            🔍
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Escàner de Vehicles
            </h2>
            <p className="texto-suave uppercase tracking-widest text-[10px]">
              Reconeixement Visual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative aspect-video bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
            {isCamera ? (
              <div className="relative h-full w-full bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-accent shadow-lg"
                />
              </div>
            ) : preview ? (
              <div className="relative h-full w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                >
                  ✕
                </button>
                {loading && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center font-bold text-accent">
                    Analitzant...
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
              <h3 className="text-lg font-bold text-slate-800">Fes una foto</h3>
              <p className="texto-suave leading-relaxed">
                Utilitza la càmera per identificar qualsevol vehicle de
                l'exposició al moment.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="boton-principal w-full flex items-center justify-center gap-3 py-3"
                onClick={startCamera}
                disabled={loading}
              >
                {loading ? "ANALITZANT..." : "ESCANEJAR VEHICLE"}
              </button>

              <button
                className="bg-white border border-slate-200 text-slate-700 w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                onClick={() => fileInputRef.current.click()}
              >
                {loading ? "ANALITZANT..." : "PUJAR FOTO"}
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 text-accent font-bold">
              <span>✨</span>
              <span>Identificació del Vehicle</span>
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
