import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AdminExpoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expo, setExpo] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      cargarExpoYItems();
    }
  }, [id]);

  const cargarExpoYItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const expoResponse = await fetch(`/api/expos/${id}`);

      if (!expoResponse.ok) {
        throw new Error("Error carregant l'exposició");
      }

      const expoData = await expoResponse.json();

      const itemsResponse = await fetch(`/api/items?expo_id=${id}`);

      if (!itemsResponse.ok) {
        throw new Error("Error carregant els items");
      }

      const itemsData = await itemsResponse.json();

      const itemsConImagenes = await Promise.all(
        itemsData.map(async (item) => {
          const imagenesResponse = await fetch(`/api/imatges?item_id=${item.id}&nomes_publiques=true`);
          const imagenes = await imagenesResponse.json();
          
          const destacada = imagenes.find(img => img.es_destacada === true) || imagenes[0];
          const otrasImagenes = (destacada ? imagenes.filter(img => img.id !== destacada.id) : imagenes).slice(0, 4);
          
          return {
            ...item,
            imagenes: imagenes,
            imagen_destacada_url: destacada?.imatge || null,
            otras_imagenes: otrasImagenes
          };
        })
      );
      
      setExpo(expoData);
      setItems(itemsConImagenes);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstatColor = (estat) => {
    switch(estat) {
      case 'DISPONIBLE': return 'bg-green-100 text-green-800';
      case 'ACTUALITZABLE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstatText = (estat) => {
    switch(estat) {
      case 'DISPONIBLE': return 'Disponible';
      case 'ACTUALITZABLE': return 'Actualitzable';
      default: return 'Inici';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-gray-600">Carregant detalls de l'exposició...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={cargarExpoYItems}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!expo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-600">No s'ha trobat l'exposició</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Tornar al Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {expo.nom}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <p className="text-sm text-gray-600">{expo.lloc}</p>
                <p className="text-sm text-gray-400">
                  {expo.data_inici} → {expo.data_fi}
                </p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getEstatColor(expo.estat)}`}>
                  {getEstatText(expo.estat)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3 max-w-2xl">
                {expo.descripcio}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aquesta exposició no té items</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {item.imagen_destacada_url ? (
                    <img
                      src={item.imagen_destacada_url}
                      alt={item.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                      📷
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    📸 {item.imagenes?.length || 0}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                    {item.nom}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {item.descripcio || "Sense descripció"}
                  </p>

                  {item.otras_imagenes && item.otras_imagenes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-2">Més imatges:</p>
                      <div className="flex gap-2 flex-wrap">
                        {item.otras_imagenes.slice(0, 4).map((img) => (
                          <img
                            key={img.id}
                            src={img.imatge}
                            alt="thumbnail"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:border-blue-500 transition cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminExpoDetail;