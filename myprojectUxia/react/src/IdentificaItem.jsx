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
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error identificant ítem:", error);
      setResult({
        descripcio: "Error de connexió amb marIA 2",
        etiquetes: ["error"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="identify-card">
      <h2>🔍 Identifica amb marIA</h2>

      <div className="capture-area">
        {preview ? (
          <img src={preview} alt="Preview" className="preview-img" />
        ) : (
          <div className="placeholder-icon">📸</div>
        )}
      </div>

      <div className="actions">
        <button
          className="btn-primary"
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
        >
          {loading ? "Analitzant..." : "Fes una foto ara"}
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleCapture}
        style={{ display: "none" }}
      />

      {result && (
        <div className="result-info animate-in">
          <h3>Resultat de la IA:</h3>
          <p className="description">{result.descripcio}</p>
          <div className="tags-container">
            {result.etiquetes &&
              result.etiquetes.map((tag, i) => (
                <span key={i} className="tag-badge">
                  {tag}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentificaItem;
