import React, { useState, useEffect } from "react";
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

// ProtectedRoute component para proteger las rutas de admin
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin" />;
};

const MainApp = () => {
  const [expos, setExpos] = useState([]);
  const [expoActual, setExpoActual] = useState(null);
  const [items, setItems] = useState([]);
  const [indexItem, setIndexItem] = useState(0);
  const [itemSeleccionat, setItemSeleccionat] = useState(null);
  const [imatgesItem, setImatgesItem] = useState([]);
  const [selectedItemIdForCarousel, setSelectedItemIdForCarousel] =
    useState(null);
  const [itemIdToShowModal, setItemIdToShowModal] = useState(null);

  // FETCH EXPOSICIONS
  useEffect(() => {
    fetch("/api/expos")
      .then((res) => res.json())
      .then((data) => setExpos(data))
      .catch((err) => console.error("Error expos:", err));
  }, []);

  // FETCH ITEMS QUAN CANVIA L'EXPO
  useEffect(() => {
    if (expoActual) {
      fetch(`/api/items?expo_id=${expoActual.id}`)
        .then((res) => res.json())
        .then((data) => {
          setItems(data);

          // Si hay un item seleccionado para mostrar en el carrusel, encontrar su índice
          if (selectedItemIdForCarousel) {
            const itemIndex = data.findIndex(
              (item) => item.id === selectedItemIdForCarousel,
            );
            setIndexItem(itemIndex >= 0 ? itemIndex : 0);
            setSelectedItemIdForCarousel(null);
          } else {
            setIndexItem(0);
          }
        })
        .catch((err) => console.error("Error items:", err));
    }
  }, [expoActual, selectedItemIdForCarousel]);

  // Mostrar modal del item cuando esté disponible
  useEffect(() => {
    if (itemIdToShowModal && items.length > 0) {
      const itemToShow = items.find((item) => item.id === itemIdToShowModal);
      if (itemToShow) {
        (async () => {
          setItemSeleccionat(itemToShow);
          try {
            const res = await fetch(`/api/imatges?item_id=${itemToShow.id}`);
            const data = await res.json();
            setImatgesItem(data);
          } catch (err) {
            console.error("Error imatges:", err);
          }
        })();
        setItemIdToShowModal(null);
      }
    }
  }, [itemIdToShowModal, items]);

  const verDetalleItem = async (item) => {
    setItemSeleccionat(item);
    try {
      const res = await fetch(`/api/imatges?item_id=${item.id}`);
      const data = await res.json();
      setImatgesItem(data);
    } catch (err) {
      console.error("Error imatges:", err);
    }
  };

  const handleSelectItem = (itemId, expoId) => {
    // Encontrar el expo por su ID
    const expoToSelect = expos.find((e) => e.id === expoId);
    if (expoToSelect) {
      // Establecer el item que se debe mostrar primero en el carrusel
      setSelectedItemIdForCarousel(itemId);
      // Establecer el item para mostrar en el modal
      setItemIdToShowModal(itemId);
      // Establecer el expo actual (esto desencadenará el useEffect para cargar los items)
      setExpoActual(expoToSelect);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 selection:bg-accent selection:text-white">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform -rotate-12"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform rotate-12"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="grow">
          {expoActual ? (
            <ExpoDetail
              expo={expoActual}
              items={items}
              indexItem={indexItem}
              setIndexItem={setIndexItem}
              onBack={() => setExpoActual(null)}
              verDetalleItem={verDetalleItem}
            />
          ) : (
            <Landing
              expos={expos}
              onSelectExpo={setExpoActual}
              onSelectItem={handleSelectItem}
            />
          )}
        </main>

        <Footer />
      </div>

      {/* MODAL */}
      {itemSeleccionat && (
        <ItemDetailModal
          item={itemSeleccionat}
          close={() => setItemSeleccionat(null)}
          images={imatgesItem}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
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
        <Route path="/admin/exposicion/:id" element={
          <ProtectedRoute>
            <AdminExpoDetail />
          </ProtectedRoute>
        } />

        {/* Main App Routes */}
        <Route path="/" element={<MainApp />} />
        <Route path="/historial" element={<Historial />} />


      </Routes>
    </BrowserRouter>
  );
};

export default App;