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
        throw new Error(`Error del servidor (${response.status}): ${errorText.substring(0, 50)}`);
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
          {loading ? (
            <span className="loading-spinner-text">Analitzant imatge...</span>
          ) : (
            <>📸 Fes una foto o puja un arxiu</>
          )}
        </button>
        <p className="hint">Pots triar una foto de la teva galeria o fer-ne una al moment</p>
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
          <div className="result-header">
            <span className="sparkle">✨</span>
            <h3>Identificació completa</h3>
          </div>
          <p className="description">{result.descripcio}</p>
          <div className="tags-container">
            {result.etiquetes &&
              result.etiquetes.map((tag, i) => (
                <span key={i} className="tag-badge">
                  #{tag}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentificaItem;
