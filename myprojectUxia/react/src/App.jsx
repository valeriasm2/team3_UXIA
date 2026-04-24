import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemDetailModal from "./components/ItemDetailModal";
import Landing from "./pages/Landing";
import ExpoDetail from "./pages/ExpoDetail";
import BackgroundDecoration from "./components/BackgroundDecoration";
import { useAppData } from "./useAppData";

const App = () => {
  const { data, modal, actions } = useAppData();

  return (
    <div className="min-h-screen bg-background text-slate-800 selection:bg-accent selection:text-white">
      <BackgroundDecoration />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="grow">
          {data.expoActual ? (
            <ExpoDetail
              expo={data.expoActual}
              items={data.items}
              indexItem={data.indexItem}
              setIndexItem={actions.setIndexItem}
              onBack={() => actions.setExpoActual(null)}
              verDetalleItem={actions.verDetalleItem}
            />
          ) : (
            <Landing expos={data.expos} onSelectExpo={actions.setExpoActual} />
          )}
        </main>
        <Footer />
      </div>
      {modal.item && (
        <ItemDetailModal
          item={modal.item}
          close={actions.closeModal}
          images={modal.images}
        />
      )}
    </div>
  );
};

export default App;
