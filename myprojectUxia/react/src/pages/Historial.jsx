import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Historial = () => {
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarIntents();
  }, []);

  const cargarIntents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/intents");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Intents carregats:", data);
      setIntents(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data desconeguda";
    const date = new Date(dateString);
    return date.toLocaleDateString("ca-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-slate-600">Carregant historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-red-500 p-6 bg-white rounded-lg shadow">
          <p className="mb-4"> Error: {error}</p>
          <button 
            onClick={cargarIntents}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="text-2xl hover:text-blue-500 transition"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">Historial d'Intents</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {intents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-600 font-medium">No hi ha intents per mostrar</p>
            <p className="text-slate-400 text-sm mt-2">
          Fes una foto a un item per començar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {intents.map((intent) => (
              <div key={intent.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <div className="flex gap-4">
                  {/* Imatge */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {intent.imatge ? (
                      <img
                        src={intent.imatge}
                        alt="Intent"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                        📸
                      </div>
                    )}
                  </div>
                  
                  {/* Información */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        {intent.encert === true && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                             Encert
                          </span>
                        )}
                        {intent.encert === false && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                             Error
                          </span>
                        )}
                        {intent.encert === null && (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                             Pendent
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(intent.creat_el)}
                      </span>
                    </div>
                    
                    {intent.item && (
                      <p className="text-sm mt-2">
                        <strong className="text-gray-700">Item:</strong>{" "}
                        <span className="text-gray-600">
                          {typeof intent.item === 'object' ? intent.item.nom : intent.item}
                        </span>
                      </p>
                    )}
                    
                    {intent.confiança !== null && intent.confiança !== undefined && (
                      <p className="text-sm mt-1">
                        <strong className="text-gray-700">Confiança:</strong>{" "}
                        <span className="text-gray-600">{Math.round(intent.confiança * 100)}%</span>
                      </p>
                    )}
                    
                    {intent.descripcio_ia && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {intent.descripcio_ia}
                      </p>
                    )}
                    
                    {intent.etiquetes_ia && intent.etiquetes_ia.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {intent.etiquetes_ia.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {intent.etiquetes_ia.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                            +{intent.etiquetes_ia.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;