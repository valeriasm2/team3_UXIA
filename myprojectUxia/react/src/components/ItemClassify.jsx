import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const ItemClassify = () => {
  const { t } = useTranslation();
  const [expos, setExpos] = useState([]);
  const [selectedExpo, setSelectedExpo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [camOpen, setCamOpen] = useState(false);
  const [camError, setCamError] = useState(null);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetch("/api/expos?estat=DISPONIBLE")
      .then((r) => r.json())
      .then(setExpos)
      .catch(() => setExpos([]));
  }, []);

  const openCamera = async () => {
    setCamError(null);
    setCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        classify(new File([blob], "foto.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    classify(file);
    e.target.value = "";
  };

  const classify = async (file) => {
    if (!selectedExpo) return;
    setLoading(true);
    setResult(null);
    const body = new FormData();
    body.append("imatge", file);
    try {
      const res = await fetch(`/api/expos/${selectedExpo.id}/classify`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.detail || "Error classificant la imatge" });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ error: t('train_connection_error') });
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
                <p className="text-red-400 text-sm">{t('camera_access_error')}: {camError}</p>
                <button onClick={closeCamera} className="px-4 py-2 bg-white text-black rounded-lg font-semibold">{t('close')}</button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-linear-to-t from-black/70 flex justify-center gap-4">
                  <button onClick={closeCamera} className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition">{t('cancel')}</button>
                  <button onClick={capturePhoto} className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-xl font-bold transition">📸 {t('capture')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-xl">🎯</div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('item_id_title')}</h2>
              <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{t('item_id_subtitle')}</p>
            </div>
          </div>

          {/* Selector d'expo */}
          {expos.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-400">
              {t('no_trained_expos')}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                {t('select_expo')}
              </label>
              <select
                value={selectedExpo?.id || ""}
                onChange={(e) => {
                  const expo = expos.find((x) => x.id === parseInt(e.target.value));
                  setSelectedExpo(expo || null);
                  setResult(null);
                  setPreview(null);
                }}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-green-500/30 outline-none"
              >
                <option value="">{t('choose_expo')}</option>
                {expos.map((expo) => (
                  <option key={expo.id} value={expo.id}>{expo.nom}</option>
                ))}
              </select>
            </div>
          )}

          {selectedExpo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {loading && (
                      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs uppercase tracking-widest animate-pulse">{t('classifying')}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                    <div className="text-4xl">🎯</div>
                    <p className="text-xs font-bold uppercase">{t('no_image')}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('classify_description')}</p>
                <button
                  onClick={openCamera}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 {loading ? t('classifying').toUpperCase() : t('open_camera').toUpperCase()}
                </button>
                <button
                  onClick={() => galleryRef.current.click()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🖼️ {t('upload_image').toUpperCase()}
                </button>
                <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
            </div>
          )}

          {/* Resultat */}
          {result && (
            <div className={`border rounded-xl p-6 space-y-3 shadow-sm animate-fade-in ${
              result.error
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                : result.trobat
                ? "bg-white dark:bg-slate-700/80 border-green-200 dark:border-green-700"
                : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
            }`}>
              {result.error ? (
                <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{result.error}</p>
              ) : result.trobat ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                    <span>✅</span><span>{t('item_identified')}</span>
                  </div>
                  <div className="flex gap-4">
                    {result.imatge && (
                      <img src={result.imatge} alt={result.nom} className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{result.nom}</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mt-1 line-clamp-3 italic">"{result.descripcio}"</p>
                    </div>
                  </div>
                  {result.model_version && (
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Model v{result.model_version}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    <span>❓</span><span>{t('no_match_found')}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {t('no_match_description')}
                    {result.prediction && <span className="block mt-1 text-xs">{t('ai_prediction')} <span className="font-mono">{result.prediction}</span></span>}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ItemClassify;
