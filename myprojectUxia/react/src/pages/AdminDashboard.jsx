import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NouItemModal from "../components/NouItemModal";
import EditExpoModal from "../components/EditExpoModal";
import EditItemModal from "../components/EditItemModal";

// Icona llapis reutilitzable
const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const estatBadge = (estat) => {
  const colors = {
    INIT: "bg-gray-100 text-gray-700",
    DISPONIBLE: "bg-green-100 text-green-700",
    ACTUALITZABLE: "bg-amber-100 text-amber-700",
  };
  return colors[estat] || "bg-gray-100 text-gray-700";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myExpos, setMyExpos] = useState([]);

  // Navegació: null=benvinguda, 'list'=llista expos, expo=detall expo
  const [view, setView] = useState(null);

  // Items de l'expo en detall
  const [adminItems, setAdminItems] = useState([]);

  // Modals
  const [nouItemExpo, setNouItemExpo] = useState(null);
  const [editExpo, setEditExpo] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [successMsg, setSuccessMsg] = useState(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const fetchExpos = (adminUser) =>
    fetch(`/api/expos?propietari=${adminUser}`)
      .then((res) => res.json())
      .then((data) => setMyExpos(data || []))
      .catch((err) => console.error("Error fetching expos:", err));

  const fetchAdminItems = (expoId) =>
    fetch(`/api/items?expo_id=${expoId}`)
      .then((res) => res.json())
      .then((data) => setAdminItems(data || []))
      .catch((err) => console.error("Error fetching items:", err));

  // ── Efectes inicials ──────────────────────────────────────────────────────────

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const adminUser = localStorage.getItem("adminUser");
    if (!adminToken) { navigate("/admin"); return; }
    setUser(adminUser);
    if (adminUser) fetchExpos(adminUser);
  }, [navigate]);

  // Recarrega items quan l'expo detall canvia
  useEffect(() => {
    if (view && typeof view === "object") fetchAdminItems(view.id);
  }, [view]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  const handleSelectExpo = (expo) => setView(expo);

  const handleEditExpoSuccess = (updated) => {
    setEditExpo(null);
    showToast(`Exposició "${updated.nom}" actualitzada.`);
    setMyExpos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (view && typeof view === "object" && view.id === updated.id) setView(updated);
  };

  const handleNouItemSuccess = (item, ambImatges) => {
    setNouItemExpo(null);
    showToast(
      ambImatges
        ? `Ítem "${item.nom}" creat. L'expo ha passat a ACTUALITZABLE.`
        : `Ítem "${item.nom}" creat correctament.`
    );
    if (user) fetchExpos(user);
    if (view && typeof view === "object") fetchAdminItems(view.id);
  };

  const handleOpenEditItem = async (itemBasic) => {
    // Obtenim l'ítem complet (amb etiquetes) abans d'obrir el modal
    try {
      const res = await fetch(`/api/items/${itemBasic.id}`);
      const full = await res.json();
      setEditItem(full);
    } catch {
      setEditItem(itemBasic);
    }
  };

  const handleEditItemSuccess = (updated, ambImatges) => {
    setEditItem(null);
    showToast(
      ambImatges
        ? `Ítem "${updated.nom}" actualitzat. L'expo ha passat a ACTUALITZABLE.`
        : `Ítem "${updated.nom}" actualitzat.`
    );
    setAdminItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    if (user) fetchExpos(user);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const isDetailView = view && typeof view === "object";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel UXIA</h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuari: <span className="font-semibold text-gray-900">{user}</span>
              </p>
            </div>
            <div className="flex gap-3">
              {view === null && (
                <button
                  onClick={() => setView("list")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Les meves exposicions ({myExpos.length})
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Tancar sessió
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {successMsg}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Benvinguda ── */}
        {view === null && (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Benvingut, {user}!</h2>
              <p className="text-gray-600">Accedeix a les teves exposicions</p>
              <button
                onClick={() => setView("list")}
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                Les meves exposicions ({myExpos.length})
              </button>
            </div>
          </div>
        )}

        {/* ── Llista expos ── */}
        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Les meves exposicions</h2>
              <button onClick={() => setView(null)} className="text-sm text-gray-600 hover:text-gray-900">
                ← Tornar
              </button>
            </div>

            {myExpos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myExpos.map((expo) => (
                  <div key={expo.id} className="bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col overflow-hidden">
                    <div
                      className="relative cursor-pointer"
                      onClick={() => handleSelectExpo(expo)}
                    >
                      {expo.imatge ? (
                        <img src={expo.imatge} alt={expo.nom} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          Sense imatge
                        </div>
                      )}
                      {/* Botó llapis expo (List View) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditExpo(expo); }}
                        title="Editar exposició"
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow text-gray-600 hover:text-blue-600 transition"
                      >
                        <PencilIcon />
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3
                        className="text-base font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-700"
                        onClick={() => handleSelectExpo(expo)}
                      >
                        {expo.nom}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{expo.lloc}</p>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${estatBadge(expo.estat)}`}>
                          {expo.estat}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {expo.items?.length || 0} ítems
                        </span>
                      </div>
                      <button
                        onClick={() => { handleSelectExpo(expo); setNouItemExpo(expo); }}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        <span className="text-base leading-none">+</span> NOU ITEM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <p className="text-gray-500">No tens cap exposició creada.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Detall expo ── */}
        {isDetailView && (
          <div>
            {/* Capçalera detall */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <button onClick={() => setView("list")} className="text-sm text-gray-500 hover:text-gray-900 mb-2 block">
                  ← Exposicions
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{view.nom}</h2>
                  {/* Botó llapis expo (Detail View) */}
                  <button
                    onClick={() => setEditExpo(view)}
                    title="Editar exposició"
                    className="p-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-blue-600 transition"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{view.lloc}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${estatBadge(view.estat)}`}>
                    {view.estat}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setNouItemExpo(view)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <span className="text-base leading-none">+</span> NOU ITEM
              </button>
            </div>

            {/* Llista ítems */}
            {adminItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col">
                    {item.imatge ? (
                      <img src={item.imatge} alt={item.nom} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
                        Sense imatge
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug">{item.nom}</h4>
                        {/* Botó llapis ítem */}
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          title="Editar ítem"
                          className="shrink-0 p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                      {item.descripcio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descripcio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Aquesta exposició no té ítems.</p>
                <button
                  onClick={() => setNouItemExpo(view)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  + Afegir primer ítem
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {nouItemExpo && (
        <NouItemModal
          expo={nouItemExpo}
          onClose={() => setNouItemExpo(null)}
          onSuccess={handleNouItemSuccess}
        />
      )}
      {editExpo && (
        <EditExpoModal
          expo={editExpo}
          onClose={() => setEditExpo(null)}
          onSuccess={handleEditExpoSuccess}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={handleEditItemSuccess}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
