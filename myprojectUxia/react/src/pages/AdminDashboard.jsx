import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NouItemModal from "../components/NouItemModal";
import EditExpoModal from "../components/EditExpoModal";
import EditItemModal from "../components/EditItemModal";
import { useDark } from "../App";

const Pencil = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const badge = (estat) =>
  ({
    INIT: "bg-gray-100 text-gray-700",
    DISPONIBLE: "bg-green-100 text-green-700",
    ACTUALITZABLE: "bg-amber-100 text-amber-700",
  })[estat] ?? "bg-gray-100 text-gray-700";

const Thumb = ({ item }) => (
  <div className="flex flex-col items-center" title={item.nom}>
    {item.imatge_destacada ? (
      <img
        src={item.imatge_destacada}
        alt={item.nom}
        className="w-12 h-12 object-cover rounded-lg"
      />
    ) : (
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        📷
      </div>
    )}
    <span className="text-xs text-gray-500 mt-1 max-w-[48px] truncate">
      {item.nom}
    </span>
  </div>
);

const EditBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 transition"
  >
    <Pencil />
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggle } = useDark();
  const [user, setUser] = useState(null);
  const [myExpos, setMyExpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [adminItems, setAdminItems] = useState([]);
  const [nouItemExpo, setNouItemExpo] = useState(null);
  const [editExpo, setEditExpo] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchExpos = async (username) => {
    setLoading(true);
    try {
      const data = await fetch(`/api/expos?propietari=${username}`).then((r) =>
        r.json(),
      );
      const enriched = await Promise.all(
        data.map(async (expo) => {
          const items = await fetch(`/api/items?expo_id=${expo.id}`).then((r) =>
            r.json(),
          );
          const withImg = await Promise.all(
            items.map(async (item) => {
              const imgs = await fetch(
                `/api/imatges?item_id=${item.id}&nomes_publiques=true`,
              ).then((r) => r.json());
              const dest = imgs.find((i) => i.es_destacada) || imgs[0];
              return { ...item, imatge_destacada: dest?.imatge || null };
            }),
          );
          return { ...expo, items: withImg };
        }),
      );
      setMyExpos(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (expoId) => {
    const items = await fetch(`/api/items?expo_id=${expoId}`).then((r) =>
      r.json(),
    );
    const withImg = await Promise.all(
      items.map(async (item) => {
        const imgs = await fetch(
          `/api/imatges?item_id=${item.id}&nomes_publiques=true`,
        ).then((r) => r.json());
        const dest = imgs.find((i) => i.es_destacada) || imgs[0];
        const altres = imgs.filter((i) => i !== dest).slice(0, 4);
        return {
          ...item,
          imatge_destacada: dest?.imatge || null,
          altres_imatges: altres,
        };
      }),
    );
    setAdminItems(withImg);
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const u = localStorage.getItem("adminUser");
    if (!token) {
      navigate("/admin");
      return;
    }
    setUser(u);
    if (u) fetchExpos(u);
  }, [navigate]);

  useEffect(() => {
    if (view && typeof view === "object") fetchItems(view.id);
  }, [view]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  const onEditExpoOk = (updated) => {
    setEditExpo(null);
    showToast(`Exposició "${updated.nom}" actualitzada.`);
    setMyExpos((p) =>
      p.map((e) => (e.id === updated.id ? { ...updated, items: e.items } : e)),
    );
    if (view?.id === updated.id) setView(updated);
  };

  const onNouItemOk = (item, ambImg) => {
    setNouItemExpo(null);
    showToast(
      ambImg
        ? `"${item.nom}" creat. Expo → ACTUALITZABLE.`
        : `"${item.nom}" creat.`,
    );
    if (user) fetchExpos(user);
    if (view && typeof view === "object") fetchItems(view.id);
  };

  const openEditItem = async (itemBasic) => {
    try {
      setEditItem(
        await fetch(`/api/items/${itemBasic.id}`).then((r) => r.json()),
      );
    } catch {
      setEditItem(itemBasic);
    }
  };

  const onEditItemOk = (updated, ambImg) => {
    setEditItem(null);
    if (updated.deleted) {
      showToast(`Ítem eliminat correctament.`);
    } else {
      showToast(
        ambImg
          ? `"${updated.nom}" actualitzat. Expo → ACTUALITZABLE.`
          : `"${updated.nom}" actualitzat.`,
      );
    }
    if (view && typeof view === "object") fetchItems(view.id);
    if (user) fetchExpos(user);
  };

  const isDetail = view && typeof view === "object";

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm animate-fade-in">
          {toast}
        </div>
      )}

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel UXIA</h1>
            <p className="text-sm text-gray-600 mt-1">
              Usuari:{" "}
              <span className="font-semibold text-gray-900">{user}</span>
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggle}
              aria-label="Cambiar tema"
              className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer flex items-center justify-center"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM5 8a1 1 0 100-2H4a1 1 0 100 2h1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
            </button>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === null && (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Benvingut, {user}!
              </h2>
              <p className="text-gray-500">
                Accedeix a les teves exposicions per gestionar-les
              </p>
              <button
                onClick={() => setView("list")}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition hover:scale-105 shadow-lg"
              >
                Les meves exposicions ({myExpos.length})
              </button>
            </div>
          </div>
        )}

        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Les meves exposicions
              </h2>
              <button
                onClick={() => setView(null)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                ← Tornar
              </button>
            </div>

            {loading ? (
              <p className="text-center py-12 text-gray-500 animate-pulse">
                Carregant exposicions...
              </p>
            ) : myExpos.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                No tens cap exposició creada.
              </div>
            ) : (
              <>
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-semibold text-gray-700">
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
                      <div
                        className="col-span-3 cursor-pointer"
                        onClick={() => setView(expo)}
                      >
                        <div className="font-semibold text-gray-900 hover:text-blue-700">
                          {expo.nom}
                        </div>
                        <div className="text-sm text-gray-500">{expo.lloc}</div>
                        <div className="text-xs text-gray-400">
                          {expo.data_inici} → {expo.data_fi}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${badge(expo.estat)}`}
                        >
                          {expo.estat}
                        </span>
                      </div>
                      <div className="col-span-4 text-sm text-gray-600 line-clamp-2">
                        {expo.descripcio || "Sense descripció"}
                      </div>
                      <div className="col-span-3 flex gap-2 flex-wrap items-center">
                        {expo.items?.slice(0, 3).map((item) => (
                          <Thumb key={item.id} item={item} />
                        ))}
                        {expo.items?.length > 3 && (
                          <span className="text-xs text-blue-600">
                            +{expo.items.length - 3}
                          </span>
                        )}
                        <EditBtn onClick={() => setEditExpo(expo)} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="md:hidden space-y-4">
                  {myExpos.map((expo) => (
                    <div
                      key={expo.id}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setView(expo)}
                        >
                          <h3 className="font-bold text-gray-900">
                            {expo.nom}
                          </h3>
                          <p className="text-sm text-gray-500">{expo.lloc}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${badge(expo.estat)}`}
                          >
                            {expo.estat}
                          </span>
                          <EditBtn onClick={() => setEditExpo(expo)} />
                        </div>
                      </div>
                      <p
                        className="text-sm text-gray-600 line-clamp-2 mb-3 cursor-pointer"
                        onClick={() => setView(expo)}
                      >
                        {expo.descripcio || "Sense descripció"}
                      </p>
                      <div
                        className="flex gap-2 flex-wrap cursor-pointer"
                        onClick={() => setView(expo)}
                      >
                        {expo.items?.slice(0, 4).map((item) => (
                          <Thumb key={item.id} item={item} />
                        ))}
                        {expo.items?.length > 4 && (
                          <span className="self-center text-xs text-blue-600">
                            +{expo.items.length - 4} més
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {isDetail && (
          <div>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <button
                  onClick={() => setView("list")}
                  className="text-sm text-gray-500 hover:text-gray-900 mb-2 block"
                >
                  ← Exposicions
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {view.nom}
                  </h2>
                  <EditBtn onClick={() => setEditExpo(view)} />
                </div>
                <p className="text-sm text-gray-500 mt-1">{view.lloc}</p>
                <span
                  className={`mt-2 inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${badge(view.estat)}`}
                >
                  {view.estat}
                </span>
              </div>
              <button
                onClick={() => setNouItemExpo(view)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                + NOU ITEM
              </button>
            </div>

            {adminItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {adminItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      {item.imatge_destacada ? (
                        <img
                          src={item.imatge_destacada}
                          alt={item.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                          📷
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                          {item.nom}
                        </h4>
                        <button
                          onClick={() => openEditItem(item)}
                          className="shrink-0 p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition"
                        >
                          <Pencil />
                        </button>
                      </div>
                      {item.descripcio && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {item.descripcio}
                        </p>
                      )}
                      {item.altres_imatges?.length > 0 && (
                        <div className="mt-auto">
                          <p className="text-xs text-gray-400 mb-1">
                            Més imatges:
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {item.altres_imatges.map((img) => (
                              <img
                                key={img.id}
                                src={img.imatge}
                                alt=""
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
                <p className="text-gray-500 mb-4">
                  Aquesta exposició no té ítems.
                </p>
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

      {nouItemExpo && (
        <NouItemModal
          expo={nouItemExpo}
          onClose={() => setNouItemExpo(null)}
          onSuccess={onNouItemOk}
        />
      )}
      {editExpo && (
        <EditExpoModal
          expo={editExpo}
          onClose={() => setEditExpo(null)}
          onSuccess={onEditExpoOk}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={onEditItemOk}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
