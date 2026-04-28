import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemDetailModal from "./components/ItemDetailModal";
import Landing from "./pages/Landing";
import ExpoDetail from "./pages/ExpoDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// ProtectedRoute component para proteger las rutas de admin
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
  const [detail, setDetail] = useState({
    item: null,
    images: [],
  });

  // FETCH EXPOSICIONS AMB REFRESC AUTOMÀTIC (POLLING)
  useEffect(() => {
    const loadExpos = () => {
      getExpos()
        .then(setExpos)
        .catch((err) => console.error("Error expos:", err));
    };

    loadExpos(); // Carrega inicial
    const interval = setInterval(loadExpos, 5000); // Refresca cada 5 segons

    return () => clearInterval(interval);
  }, []);

  // FETCH ITEMS QUAN CANVIA L'EXPO
  useEffect(() => {
    if (navigation.activeExpo) {
      getItems(navigation.activeExpo.id)
        .then((data) => {
          setNavigation((prev) => ({ ...prev, items: data, index: 0 }));
        })
        .catch((err) => console.error("Error items:", err));
    }
  }, [navigation.activeExpo]);

  const verDetalleItem = async (item) => {
    try {
      const data = await getItemImages(item.id);
      setDetail({ item, images: data });
    } catch (err) {
      console.error("Error imatges:", err);
      setDetail({ item, images: [] });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 selection:bg-accent selection:text-white">
      <BackgroundDecoration />

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
            />
          )}
        </main>

        <Footer />
      </div>

      {/* MODAL */}
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
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Main App Routes */}
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
