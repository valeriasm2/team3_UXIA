import { useState, useRef } from "react";

const IdentificaItem = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [camOpen, setCamOpen] = useState(false);
  const [camError, setCamError] = useState(null);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const openCamera = async () => {
    setCamError(null);
    setCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setCamError(err.message);
      }
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOpen(false);
    setCamError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    closeCamera();
    canvas.toBlob(
      (blob) => {
        setPreview(URL.createObjectURL(blob));
        identify(new File([blob], "foto.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    identify(file);
    e.target.value = "";
  };

  const identify = async (file) => {
    setLoading(true);
    setResult(null);
    const body = new FormData();
    body.append("imatge", file);
    try {
      const res = await fetch("/api/identify", { method: "POST", body });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setResult({ descripcio: `Error: ${err.message}`, etiquetes: ["error"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {camOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-black relative">
            {camError ? (
              <div className="p-8 text-center space-y-4">
                <p className="text-red-400 text-sm">
                  No s'ha pogut accedir a la càmera: {camError}
                </p>
                <button
                  onClick={closeCamera}
                  className="px-4 py-2 bg-white text-black rounded-lg font-semibold"
                >
                  Tancar
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-linear-to-t from-black/70 flex justify-center gap-4">
                  <button
                    onClick={closeCamera}
                    className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition"
                  >
                    Cancel·lar
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-xl font-bold transition"
                  >
                    📸 Capturar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm animate-slide-up">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Identifica amb marIA
              </h2>
              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">
                Ollama Vision
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-accent font-bold text-xs uppercase tracking-widest animate-pulse">
                        Analitzant...
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                  <div className="text-4xl">📸</div>
                  <p className="text-xs font-bold uppercase">Sense imatge</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Fes una foto
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Utilitza la càmera o puja una imatge per identificar qualsevol
                  vehicle de l'exposició.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={openCamera}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-accent hover:bg-accent-dark text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 {loading ? "PROCESSANT..." : "OBRIR CÀMERA"}
                </button>

                <button
                  onClick={() => galleryRef.current.click()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🖼️ PUJAR IMATGE
                </button>

                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl p-6 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 text-accent font-bold">
                <span>✨</span>
                <span>Identificació</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{result.descripcio}"
              </p>
              {result.etiquetes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.etiquetes.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-bold uppercase rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IdentificaItem;
