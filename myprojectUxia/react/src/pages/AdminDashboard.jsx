import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NouItemModal from "../components/NouItemModal";
import EditExpoModal from "../components/EditExpoModal";
import EditItemModal from "../components/EditItemModal";

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
  const [loading, setLoading] = useState(true);
  // null = benvinguda, 'list' = llista expos, expo_obj = detall expo
  const [view, setView] = useState(null);
  const [adminItems, setAdminItems] = useState([]);
  const [nouItemExpo, setNouItemExpo] = useState(null);
  const [editExpo, setEditExpo] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const fetchExposAmbItems = async (username) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expos?propietari=${username}`);
      const data = await res.json();

      const exposEnriquides = await Promise.all(
        data.map(async (expo) => {
          const itemsRes = await fetch(`/api/items?expo_id=${expo.id}`);
          const items = await itemsRes.json();

          const itemsAmbImatge = await Promise.all(
            items.map(async (item) => {
              const imgRes = await fetch(`/api/imatges?item_id=${item.id}&nomes_publiques=true`);
              const imgs = await imgRes.json();
              const destacada = imgs.find((i) => i.es_destacada) || imgs[0];
              return { ...item, imatge_destacada: destacada?.imatge || null };
            })
          );

          return { ...expo, items: itemsAmbImatge };
        })
      );

      setMyExpos(exposEnriquides);
    } catch (err) {
      console.error("Error carregant exposicions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminItems = async (expoId) => {
    try {
      const res = await fetch(`/api/items?expo_id=${expoId}`);
      const items = await res.json();

      const itemsAmbImatges = await Promise.all(
        items.map(async (item) => {
          const imgRes = await fetch(`/api/imatges?item_id=${item.id}&nomes_publiques=true`);
          const imgs = await imgRes.json();
          const destacada = imgs.find((i) => i.es_destacada) || imgs[0];
          const altres = imgs.filter((i) => i !== destacada).slice(0, 4);
          return { ...item, imatge_destacada: destacada?.imatge || null, altres_imatges: altres };
        })
      );

      setAdminItems(itemsAmbImatges);
    } catch (err) {
      console.error("Error carregant items:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const adminUser = localStorage.getItem("adminUser");
    if (!token) { navigate("/admin"); return; }
    setUser(adminUser);
    if (adminUser) fetchExposAmbItems(adminUser);
  }, [navigate]);

  useEffect(() => {
    if (view && typeof view === "object") {
      fetchAdminItems(view.id);
    }
  }, [view]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  const handleSelectExpo = (expo) => setView(expo);

  const handleEditExpoSuccess = (updated) => {
    setEditExpo(null);
    showToast(`Exposició "${updated.nom}" actualitzada.`);
    setMyExpos((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...updated, items: e.items } : e))
    );
    if (view && typeof view === "object" && view.id === updated.id) setView(updated);
  };

  const handleNouItemSuccess = (item, ambImatges) => {
    setNouItemExpo(null);
    showToast(
      ambImatges
        ? `Ítem "${item.nom}" creat. L'expo ha passat a ACTUALITZABLE.`
        : `Ítem "${item.nom}" creat correctament.`
    );
    if (user) fetchExposAmbItems(user);
    if (view && typeof view === "object") fetchAdminItems(view.id);
  };

  const handleOpenEditItem = async (itemBasic) => {
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
    if (view && typeof view === "object") fetchAdminItems(view.id);
    if (user) fetchExposAmbItems(user);
  };

  const isDetailView = view && typeof view === "object";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel UXIA</h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuari: <span className="font-semibold text-gray-900">{user}</span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Benvinguda ── */}
        {view === null && (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Benvingut, {user}!</h2>
              <p className="text-gray-600">Accedeix a les teves exposicions per gestionar-les</p>
              <button
                onClick={() => setView("list")}
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                Les meves exposicions ({myExpos.length})
              </button>
            </div>
          </div>
        )}

        {/* ── Llista expos (Spec 14) ── */}
        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Les meves exposicions</h2>
              <button onClick={() => setView(null)} className="text-sm text-gray-600 hover:text-gray-900">
                ← Tornar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 animate-pulse">Carregant exposicions...</p>
              </div>
            ) : myExpos.length > 0 ? (
              <>
                {/* Desktop: taula */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-gray-700 text-sm">
                    <div className="col-span-3">Nom Exposició</div>
                    <div className="col-span-2">Estat</div>
                    <div className="col-span-4">Descripció</div>
                    <div className="col-span-3">Preview Items</div>
                  </div>

                  {myExpos.map((expo) => (
                    <div
                      key={expo.id}
                      className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition items-center"
                    >
                      <div className="col-span-3">
                        <div
                          className="font-semibold text-gray-900 hover:text-blue-700 cursor-pointer"
                          onClick={() => handleSelectExpo(expo)}
                        >
                          {expo.nom}
                        </div>
                        <div className="text-sm text-gray-500">{expo.lloc}</div>
                        <div className="text-xs text-gray-400">
                          {expo.data_inici} → {expo.data_fi}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${estatBadge(expo.estat)}`}>
                          {expo.estat}
                        </span>
                      </div>
                      <div className="col-span-4 text-sm text-gray-600 line-clamp-2">
                        {expo.descripcio || "Sense descripció"}
                      </div>
                      <div className="col-span-3">
                        <div className="flex gap-2 flex-wrap items-center">
                          {expo.items?.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex flex-col items-center" title={item.nom}>
                              {item.imatge_destacada ? (
                                <img
                                  src={item.imatge_destacada}
                                  alt={item.nom}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-lg">
                                  📷
                                </div>
                              )}
                              <span className="text-xs text-gray-500 mt-1 max-w-[48px] truncate">{item.nom}</span>
                            </div>
                          ))}
                          {expo.items?.length > 3 && (
                            <span className="text-xs text-blue-600 font-medium">+{expo.items.length - 3}</span>
                          )}
                          <button
                            onClick={() => setEditExpo(expo)}
                            className="ml-auto p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 transition"
                            title="Editar exposició"
                          >
                            <PencilIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile: targetes */}
                <div className="md:hidden space-y-4">
                  {myExpos.map((expo) => (
                    <div
                      key={expo.id}
                      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div onClick={() => handleSelectExpo(expo)} className="flex-1">
                          <h3 className="font-bold text-gray-900">{expo.nom}</h3>
                          <p className="text-sm text-gray-500">{expo.lloc}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estatBadge(expo.estat)}`}>
                            {expo.estat}
                          </span>
                          <button
                            onClick={() => setEditExpo(expo)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500"
                          >
                            <PencilIcon />
                          </button>
                        </div>
                      </div>
                      <p
                        className="text-sm text-gray-600 line-clamp-2 mb-3"
                        onClick={() => handleSelectExpo(expo)}
                      >
                        {expo.descripcio || "Sense descripció"}
                      </p>
                      <div className="flex gap-2 flex-wrap" onClick={() => handleSelectExpo(expo)}>
                        {expo.items?.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex flex-col items-center">
                            {item.imatge_destacada ? (
                              <img src={item.imatge_destacada} alt={item.nom} className="w-14 h-14 object-cover rounded-lg" />
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">📷</div>
                            )}
                            <span className="text-xs text-gray-500 mt-1 max-w-[56px] truncate">{item.nom}</span>
                          </div>
                        ))}
                        {expo.items?.length > 4 && (
                          <div className="flex items-center text-xs text-blue-600 font-medium">
                            +{expo.items.length - 4} més
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <p className="text-gray-500">No tens cap exposició creada.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Detall expo (Spec 15) ── */}
        {isDetailView && (
          <div>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <button onClick={() => setView("list")} className="text-sm text-gray-500 hover:text-gray-900 mb-2 block">
                  ← Exposicions
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{view.nom}</h2>
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

            {adminItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {adminItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {item.imatge_destacada ? (
                        <img
                          src={item.imatge_destacada}
                          alt={item.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📷</div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug">{item.nom}</h4>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          title="Editar ítem"
                          className="shrink-0 p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                      {item.descripcio && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.descripcio}</p>
                      )}
                      {item.altres_imatges?.length > 0 && (
                        <div className="mt-auto">
                          <p className="text-xs text-gray-400 mb-1">Més imatges:</p>
                          <div className="flex gap-1 flex-wrap">
                            {item.altres_imatges.map((img) => (
                              <img
                                key={img.id}
                                src={img.imatge}
                                alt="thumbnail"
                                className="w-10 h-10 object-cover rounded-md border border-gray-200"
                              />
                            ))}
                          </div>
                        </div>
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
