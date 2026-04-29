import { useState } from "react";

const EditExpoModal = ({ expo, onClose, onSuccess }) => {
  const [nom, setNom] = useState(expo.nom || "");
  const [lloc, setLloc] = useState(expo.lloc || "");
  const [descripcio, setDescripcio] = useState(expo.descripcio || "");
  const [dataInici, setDataInici] = useState(expo.data_inici || "");
  const [dataFi, setDataFi] = useState(expo.data_fi || "");
  const [imatge, setImatge] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImatge(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("lloc", lloc);
      formData.append("descripcio", descripcio);
      formData.append("data_inici", dataInici);
      formData.append("data_fi", dataFi);
      if (imatge) formData.append("imatge", imatge);

      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`/api/expos/${expo.id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }

      const updated = await res.json();
      onSuccess(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Editar Exposició</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lloc */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lloc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lloc}
              onChange={(e) => setLloc(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Lloc de l'exposició"
            />
          </div>

          {/* Descripció */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripció <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcio}
              onChange={(e) => setDescripcio(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data inici <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataInici}
                onChange={(e) => setDataInici(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data fi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataFi}
                onChange={(e) => setDataFi(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Imatge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imatge{" "}
              <span className="text-gray-400 font-normal text-xs">(opcional — substitueix l'actual)</span>
            </label>

            {/* Previsualització actual o nova */}
            {(preview || expo.imatge) && (
              <img
                src={preview || expo.imatge}
                alt="preview"
                className="w-full h-32 object-cover rounded-lg mb-2 border border-gray-200"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-4 py-3 transition">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586A2 2 0 0111.414 11H13a2 2 0 011.414.586L19 16M14 8a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm text-gray-500">
                {imatge ? imatge.name : "Selecciona una nova imatge"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              {loading ? "Guardant…" : "Guardar canvis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpoModal;
