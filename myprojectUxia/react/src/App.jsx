// Bypassing cache 1
import { useEffect, useState } from "react"
import { ThemeToggle } from "./components/ThemeToggle"
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemDetailModal from "./components/ItemDetailModal";
import Landing from "./pages/Landing";
import ExpoDetail from "./pages/ExpoDetail";

const App = () => {
  const [expos, setExpos] = useState([]);
  const [expoActual, setExpoActual] = useState(null);
  const [items, setItems] = useState([]);
  const [indexItem, setIndexItem] = useState(0);
  const [itemSeleccionat, setItemSeleccionat] = useState(null);
  const [imatgesItem, setImatgesItem] = useState([]);

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
          setIndexItem(0);
        })
        .catch((err) => console.error("Error items:", err));
    }
  }, [expoActual]);

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
            <Landing expos={expos} onSelectExpo={setExpoActual} />
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

export default App;
