import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myExpos, setMyExpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMyExpos, setShowMyExpos] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const adminUser = localStorage.getItem("adminUser");

    if (!adminToken) {
      navigate("/admin");
      return;
    }

    setUser(adminUser);
    
    if (adminUser) {
      cargarExposiciones();
    }
  }, [navigate]);

  const cargarExposiciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://127.0.0.1:8000/api/expos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const exposConItems = await Promise.all(
        data.map(async (expo) => {
          const itemsResponse = await fetch(`http://127.0.0.1:8000/api/items?expo_id=${expo.id}`);
          const items = await itemsResponse.json();
          
          const itemsConImagen = await Promise.all(
            items.map(async (item) => {
              const imagenesResponse = await fetch(`http://127.0.0.1:8000/api/imatges?item_id=${item.id}&destacada=true`);
              const imagenes = await imagenesResponse.json();
              const imagenDestacada = imagenes.length > 0 ? imagenes[0].imatge : null;
              return {
                ...item,
                imagen_destacada: imagenDestacada
              };
            })
          );
          
          return {
            ...expo,
            items: itemsConImagen,
            total_items: itemsConImagen.length
          };
        })
      );
      
      setMyExpos(exposConItems);
    } catch (err) {
      console.error("Error cargando exposiciones:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
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

  // detalls expo
  const verDetalleExpo = (expoId) => {
    navigate(`/admin/exposicion/${expoId}`);
  };

  if (loading && !showMyExpos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-gray-600">Carregant dades...</p>
        </div>
      </div>
    );
  }

  if (error && !showMyExpos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <button onClick={cargarExposiciones} className="mt-4 text-blue-600 underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Panel de Administración UXIA
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuario: <span className="font-semibold text-gray-900">{user}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMyExpos(!showMyExpos)}
                className="px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm sm:text-base"
              >
                {showMyExpos ? "← Welcome" : `Mis Exposiciones (${myExpos.length})`}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm sm:text-base"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showMyExpos ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Mis Exposiciones
              </h2>
              <button
                onClick={() => setShowMyExpos(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p>Carregant exposicions...</p>
              </div>
            ) : myExpos.length > 0 ? (
              <>
                {/* VERSIÓN DESKTOP: Tabla (visible en sm en adelante) */}
                <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-gray-700">
                    <div className="col-span-3">Nom Exposició</div>
                    <div className="col-span-2">Estat</div>
                    <div className="col-span-4">Descripció</div>
                    <div className="col-span-3">Preview Items</div>
                  </div>

                  {myExpos.map((expo) => (
                    <div 
                      key={expo.id} 
                      onClick={() => verDetalleExpo(expo.id)}
                      className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="col-span-3">
                        <div className="font-semibold text-gray-900">{expo.nom}</div>
                        <div className="text-sm text-gray-500">{expo.lloc}</div>
                        <div className="text-xs text-gray-400">
                          {expo.data_inici} → {expo.data_fi}
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getEstatColor(expo.estat)}`}>
                          {getEstatText(expo.estat)}
                        </span>
                      </div>
                      
                      <div className="col-span-4 text-sm text-gray-600 line-clamp-2">
                        {expo.descripcio && expo.descripcio.length > 100 
                          ? expo.descripcio.substring(0, 100) + '...' 
                          : expo.descripcio || "Sense descripció"}
                      </div>
                      
                      <div className="col-span-3">
                        <div className="flex gap-2 flex-wrap">
                          {expo.items && expo.items.length > 0 ? (
                            expo.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex flex-col items-center" title={item.nom}>
                                {item.imagen_destacada ? (
                                  <img 
                                    src={`http://127.0.0.1:8000${item.imagen_destacada}`}
                                    alt={item.nom}
                                    className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                    📷
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 mt-1 max-w-16 truncate">
                                  {item.nom}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">Sense items</span>
                          )}
                          {expo.total_items > 3 && (
                            <div className="flex items-center text-sm text-blue-600">
                              +{expo.total_items - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sm:hidden space-y-4">
                  {myExpos.map((expo) => (
                    <div 
                      key={expo.id} 
                      onClick={() => verDetalleExpo(expo.id)}
                      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                    >

                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{expo.nom}</h3>
                          <p className="text-sm text-gray-500">{expo.lloc}</p>
                          <p className="text-xs text-gray-400">
                            {expo.data_inici} → {expo.data_fi}
                          </p>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getEstatColor(expo.estat)}`}>
                          {getEstatText(expo.estat)}
                        </span>
                      </div>
                      
                      {/* Descripcio */}
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Descripció</span>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {expo.descripcio && expo.descripcio.length > 150 
                            ? expo.descripcio.substring(0, 150) + '...' 
                            : expo.descripcio || "Sense descripció"}
                        </p>
                      </div>
                      
                      {/* Preview */}
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Items</span>
                        <div className="flex gap-3 flex-wrap mt-2">
                          {expo.items && expo.items.length > 0 ? (
                            expo.items.slice(0, 4).map((item) => (
                              <div key={item.id} className="flex flex-col items-center" title={item.nom}>
                                {item.imagen_destacada ? (
                                  <img 
                                    src={`http://127.0.0.1:8000${item.imagen_destacada}`}
                                    alt={item.nom}
                                    className="w-16 h-16 object-cover rounded-lg bg-gray-100 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                                    📷
                                  </div>
                                )}
                                <span className="text-xs text-gray-600 mt-1 max-w-20 truncate text-center">
                                  {item.nom}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sense items</span>
                          )}
                          {expo.total_items > 4 && (
                            <div className="flex items-center text-sm text-blue-600 font-medium">
                              +{expo.total_items - 4} més
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/*  */}
                      <div className="mt-3 pt-2 text-right">
                        <span className="text-xs text-blue-600">Veure detalls →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">No tens exposicions creades encara.</p>
                <p className="text-sm text-gray-500">
                  Les teves exposicions apareixeran aquí un cop les creïs.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center space-y-6 p-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  ¡Bienvenido, {user}!
                </h2>
                <p className="text-gray-600">
                  Accede a tus exposiciones para ver los detalles
                </p>
              </div>
              <button
                onClick={() => setShowMyExpos(true)}
                className="inline-block px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-lg"
              >
                Ver Mis Exposiciones ({myExpos.length})
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;