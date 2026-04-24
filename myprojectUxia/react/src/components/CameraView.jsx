import React, { useState, useRef, useEffect } from "react";

const CameraView = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Error acceso cámara:", err);
        setError("No s'ha pogut accedir a la càmera. Revisa els permisos.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      onCapture(file, canvas.toDataURL("image/jpeg"));
    }, "image/jpeg");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-100 text-center">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button onClick={onCancel} className="text-slate-500 underline text-sm">
          Tornar enrere
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-300">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-accent/80 text-white text-[10px] px-2 py-1 rounded-full animate-pulse uppercase tracking-widest">
          En viu
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCapture}
          className="bg-accent text-white font-semibold py-2 px-6 rounded-lg hover:bg-accent-dark transition-colors grow flex items-center justify-center gap-2"
        >
          <span>📸</span> CAPTURAR FOTO
        </button>
        <button
          onClick={onCancel}
          className="bg-slate-200 text-slate-700 px-6 rounded-lg font-bold hover:bg-slate-300 transition-colors"
        >
          CANCEL·LAR
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
