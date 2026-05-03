import { useState, useEffect, useRef } from "react";

const STATUS_COLORS = {
  IDLE:      "bg-gray-100 text-gray-600",
  QUEUED:    "bg-yellow-100 text-yellow-700",
  RUNNING:   "bg-blue-100 text-blue-700",
  OK:        "bg-green-100 text-green-700",
  ERROR:     "bg-red-100 text-red-700",
  CANCELLED: "bg-orange-100 text-orange-700",
  REPLACE:   "bg-purple-100 text-purple-700",
};

const STATUS_LABELS = {
  IDLE:      "IDLE",
  QUEUED:    "QUEUED",
  RUNNING:   "RUNNING",
  OK:        "OK",
  ERROR:     "ERROR",
  CANCELLED: "CANCELLED",
  REPLACE:   "REPLACE",
};

const POLLING_INTERVAL_MS = 5000;
const ACTIVE_STATUSES = ["QUEUED", "RUNNING", "REPLACE"];

export default function BtnEntrenarIA({ expoId, initialTrainStatus = "IDLE", onTrainOk }) {
  const [trainStatus, setTrainStatus] = useState(initialTrainStatus);
  const [statusInfo, setStatusInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const isActive = ACTIVE_STATUSES.includes(trainStatus);

  const fetchStatus = async () => {
    try {
      const resp = await fetch(`/api/expos/${expoId}/train-status`);
      if (!resp.ok) return;
      const data = await resp.json();
      setTrainStatus(data.train_status);
      setStatusInfo(data);
      if (data.train_status === "OK") {
        stopPolling();
        if (onTrainOk) onTrainOk();
      } else if (!ACTIVE_STATUSES.includes(data.train_status)) {
        stopPolling();
      }
    } catch {
      // silencia errors de xarxa durant el polling
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchStatus, POLLING_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (ACTIVE_STATUSES.includes(initialTrainStatus)) {
      startPolling();
    }
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (isActive) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [trainStatus]);

  const handleEntrenar = async () => {
    if (!window.confirm("Vols iniciar l'entrenament de la IA amb les imatges d'aquesta exposició?")) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/expos/${expoId}/entrenar`, { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.detail || "Error iniciant l'entrenament");
        return;
      }
      setTrainStatus(data.train_status);
      setStatusInfo(data);
    } catch (e) {
      setError("No s'ha pogut connectar amb el servidor");
    } finally {
      setLoading(false);
    }
  };

  const colorClass = STATUS_COLORS[trainStatus] || STATUS_COLORS.IDLE;
  const canTrain = !isActive && !loading;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Train</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {isActive && (
              <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
            )}
            {STATUS_LABELS[trainStatus] || trainStatus}
          </span>
        </div>

        <button
          onClick={handleEntrenar}
          disabled={!canTrain}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            canTrain
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Iniciant..." : isActive ? "Entrenant..." : "Entrena IA Expo"}
        </button>
      </div>

      {statusInfo.eta && isActive && (
        <p className="text-xs text-gray-500">
          ETA: {statusInfo.eta}
          {statusInfo.global_percentage && ` · ${statusInfo.global_percentage}`}
          {statusInfo.accuracy && ` · Accuracy: ${statusInfo.accuracy}`}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
