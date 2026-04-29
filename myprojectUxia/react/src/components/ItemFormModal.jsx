import React, { useState, useEffect } from "react";

/**
 * Component base reutilitzable per a NouItemModal i EditItemModal.
 *   title       — títol del modal
 *   subtitle    — subtítol opcional (ex: "Expo: nom")
 *   initialValues — { nom, descripcio, etiquetesIds[], imatges[], previews[], imatgeDestacada } per pre-emplenar en edició
 *   onSubmit    — async ({ nom, descripcio, etiquetesIds, imatges, imatgeDestacada }) => void  (llença error si falla)
 *   onClose     — callback per tancar
 *   submitLabel — text del botó principal
 */
const ItemFormModal = ({
  title,
  subtitle,
  initialValues = {},
  onSubmit,
  onClose,
  submitLabel = "Confirmar",
  onDelete,
}) => {
  const [nom, setNom] = useState(initialValues.nom || "");
  const [descripcio, setDescripcio] = useState(initialValues.descripcio || "");
  const [etiquetes, setEtiquetes] = useState([]);
  const [selectedEtiquetes, setSelectedEtiquetes] = useState(
    initialValues.etiquetesIds || [],
  );
  const [imatges, setImatges] = useState(initialValues.imatges || []);
  const [previews, setPreviews] = useState(initialValues.previews || []);
  const [destacada, setDestacada] = useState(
    initialValues.imatgeDestacada !== undefined
      ? initialValues.imatgeDestacada
      : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/etiquetes")
      .then((res) => res.json())
      .then((data) => setEtiquetes(data || []))
      .catch(() => {});
  }, []);

  const toggleEtiqueta = (id) => {
    setSelectedEtiquetes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImatges = [...imatges, ...files];
    const newPreviews = newImatges.map((f) => {
      if (f.preview) return f.preview; // Imagen existente
      return URL.createObjectURL(f); // Nueva imagen
    });
    setImatges(newImatges);
    setPreviews(newPreviews);
    // Si es la primera imagen, marcarla como destacada
    if (imatges.length === 0 && newImatges.length > 0) {
      setDestacada(0);
    }
  };

  const removeImage = (idx) => {
    setImatges(imatges.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
    if (destacada === idx) {
      setDestacada(0);
    } else if (destacada > idx) {
      setDestacada(destacada - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        nom,
        descripcio,
        etiquetesIds: selectedEtiquetes,
        imatges, // Pass ALL imatges (File and Object) so parent can track deletions & featured
        imatgeDestacada: destacada,
      });
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
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
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
              placeholder="Nom de l'ítem"
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
              placeholder="Descripció de l'ítem"
            />
          </div>

          {/* Tags */}
          {etiquetes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                {etiquetes.map((etiqueta) => (
                  <button
                    key={etiqueta.id}
                    type="button"
                    onClick={() => toggleEtiqueta(etiqueta.id)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                      selectedEtiquetes.includes(etiqueta.id)
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 border border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {etiqueta.nom}
                  </button>
                ))}
              </div>
              {selectedEtiquetes.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedEtiquetes.length} tag(s) seleccionat(s)
                </p>
              )}
            </div>
          )}

          {/* Imatges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imatges{" "}
              <span className="text-gray-400 font-normal text-xs">
                (si s'afegeixen, l'expo passa a ACTUALITZABLE)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-4 py-3 transition">
              <svg
                className="w-5 h-5 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586A2 2 0 0111.414 11H13a2 2 0 011.414.586L19 16M14 8a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-sm text-gray-500">
                {imatges.length > 0
                  ? `${imatges.length} imatge(s) seleccionada(s)`
                  : "Selecciona imatges (múltiple permès)"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {previews.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Gestiona les imatges: Clica per marcar com destacada
                </p>
                <div className="flex gap-3 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`preview ${i}`}
                        className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition ${
                          destacada === i
                            ? "border-yellow-500 ring-2 ring-yellow-300"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        onClick={() => setDestacada(i)}
                      />
                      {destacada === i && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <svg
                            className="w-5 h-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                      {imatges[i] instanceof File && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition">
                          +
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Clica sobre una imatge per marcar-la com a destacada. Clica la
                  X per eliminar.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition"
              >
                Eliminar
              </button>
            )}
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
              {loading ? "Processant…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;
