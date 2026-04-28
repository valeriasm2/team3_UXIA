import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NouItemModal from "../components/NouItemModal";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myExpos, setMyExpos] = useState([]);
  const [showMyExpos, setShowMyExpos] = useState(false);
  const [nouItemExpo, setNouItemExpo] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchExpos = (adminUser) => {
    fetch(`/api/expos?propietari=${adminUser}`)
      .then((res) => res.json())
      .then((data) => setMyExpos(data || []))
      .catch((err) => console.error("Error fetching expos:", err));
  };

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const adminUser = localStorage.getItem("adminUser");

    if (!adminToken) {
      navigate("/admin");
      return;
    }

    setUser(adminUser);
    if (adminUser) fetchExpos(adminUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  const handleNouItemSuccess = (item, ambImatges) => {
    setNouItemExpo(null);
    const msg = ambImatges
      ? `Ítem "${item.nom}" creat. L'expo ha passat a estat ACTUALITZABLE.`
      : `Ítem "${item.nom}" creat correctament.`;
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
    if (user) fetchExpos(user);
  };

  const estatBadge = (estat) => {
    const colors = {
      INIT: "bg-gray-100 text-gray-700",
      DISPONIBLE: "bg-green-100 text-green-700",
      ACTUALITZABLE: "bg-amber-100 text-amber-700",
    };
    return colors[estat] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración UXIA
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuario:{" "}
                <span className="font-semibold text-gray-900">{user}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMyExpos(!showMyExpos)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Mis Exposiciones ({myExpos.length})
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {successMsg}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showMyExpos ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Mis Exposiciones
                </h2>
                <button
                  onClick={() => setShowMyExpos(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Volver
                </button>
              </div>

              {myExpos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myExpos.map((expo) => (
                    <div
                      key={expo.id}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col"
                    >
                      {expo.imatge && (
                        <img
                          src={expo.imatge}
                          alt={expo.nom}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {expo.nom}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{expo.lloc}</p>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${estatBadge(expo.estat)}`}
                        >
                          {expo.estat}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {expo.items?.length || 0} ítems
                        </span>
                      </div>
                      {/* Botó + NOU ITEM */}
                      <button
                        onClick={() => setNouItemExpo(expo)}
                        className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        <span className="text-lg leading-none">+</span>
                        NOU ITEM
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-600 mb-4">
                    No tienes exposiciones creadas aún.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  ¡Bienvenido, {user}!
                </h2>
                <p className="text-gray-600">Accede a tus exposiciones</p>
              </div>
              <button
                onClick={() => setShowMyExpos(true)}
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                Mis Exposiciones ({myExpos.length})
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Nou Item */}
      {nouItemExpo && (
        <NouItemModal
          expo={nouItemExpo}
          onClose={() => setNouItemExpo(null)}
          onSuccess={handleNouItemSuccess}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
