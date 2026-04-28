import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemDetailModal from "./components/ItemDetailModal";
import Landing from "./pages/Landing";
import ExpoDetail from "./pages/ExpoDetail";
import Historial from "./pages/Historial";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExpoDetail from "./pages/AdminExpoDetail";

import { getExpos, getItems, getItemImages } from "./api";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin" />;
};

const MainApp = () => {
  const [expos, setExpos] = useState([]);
  const [navigation, setNavigation] = useState({
    activeExpo: null,
    items: [],
    index: 0,
  });
  const [detail, setDetail] = useState({ item: null, images: [] });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemIdToShowModal, setItemIdToShowModal] = useState(null);

  useEffect(() => {
    const loadExpos = () => {
      getExpos()
        .then(setExpos)
        .catch((err) => console.error("Error expos:", err));
    };
    loadExpos();
    const interval = setInterval(loadExpos, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigation.activeExpo) {
      getItems(navigation.activeExpo.id)
        .then((data) => {
          let index = 0;
          if (selectedItemId) {
            const idx = data.findIndex((item) => item.id === selectedItemId);
            if (idx >= 0) index = idx;
            setSelectedItemId(null);
          }
          setNavigation((prev) => ({ ...prev, items: data, index }));
        })
        .catch((err) => console.error("Error items:", err));
    }
  }, [navigation.activeExpo]);

  useEffect(() => {
    if (itemIdToShowModal && navigation.items.length > 0) {
      const itemToShow = navigation.items.find((item) => item.id === itemIdToShowModal);
      if (itemToShow) {
        verDetalleItem(itemToShow);
        setItemIdToShowModal(null);
      }
    }
  }, [itemIdToShowModal, navigation.items]);

  const verDetalleItem = async (item) => {
    try {
      const data = await getItemImages(item.id);
      setDetail({ item, images: data });
    } catch (err) {
      console.error("Error imatges:", err);
      setDetail({ item, images: [] });
    }
  };

  const handleSelectItem = (itemId, expoId) => {
    const expoToSelect = expos.find((e) => e.id === expoId);
    if (expoToSelect) {
      setSelectedItemId(itemId);
      setItemIdToShowModal(itemId);
      setNavigation({ activeExpo: expoToSelect, items: [], index: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-accent selection:text-white transition-colors">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform -rotate-12"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform rotate-12"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="grow">
          {navigation.activeExpo ? (
            <ExpoDetail
              expo={navigation.activeExpo}
              items={navigation.items}
              indexItem={navigation.index}
              setIndexItem={(index) =>
                setNavigation((prev) => ({ ...prev, index }))
              }
              onBack={() =>
                setNavigation({ activeExpo: null, items: [], index: 0 })
              }
              verDetalleItem={verDetalleItem}
            />
          ) : (
            <Landing
              expos={expos}
              onSelectExpo={(expo) =>
                setNavigation({ activeExpo: expo, items: [], index: 0 })
              }
              onSelectItem={handleSelectItem}
            />
          )}
        </main>

        <Footer />
      </div>

      {detail.item && (
        <ItemDetailModal
          item={detail.item}
          close={() => setDetail({ item: null, images: [] })}
          images={detail.images}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exposicion/:id"
          element={
            <ProtectedRoute>
              <AdminExpoDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<MainApp />} />
        <Route path="/historial" element={<Historial />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
