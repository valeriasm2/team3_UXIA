import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BackgroundDecoration from "./components/BackgroundDecoration";
import ItemDetailModal from "./components/ItemDetailModal";
import CookieBanner from "./components/CookieBanner";
import Landing from "./pages/Landing";

const COOKIE_NAME = 'uxia_user_id';
const COOKIE_DAYS = 365 * 10; // 10 años (esencialmente permanente)

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
};

import ExpoDetail from "./pages/ExpoDetail";
import Historial from "./pages/Historial";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExpoDetail from "./pages/AdminExpoDetail";
import { getExpos, getItems, getItemImages } from "./api";

export const DarkContext = createContext({ isDark: false, toggle: () => {} });
export const useDark = () => useContext(DarkContext);

const Protected = ({ children }) =>
  sessionStorage.getItem("adminToken") ? children : <Navigate to="/admin" />;

const MainApp = () => {
  const [userId, setUserId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    initUser();
    checkCookieConsent();
  }, []);

  const initUser = async () => {
    try {
      let cookieId = getCookie(COOKIE_NAME);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/usuari/identificar?cookie_id=${cookieId || ''}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      
      const data = await response.json();
      
      if (data.cookie_id) {
        if (!cookieId) {
          setCookie(COOKIE_NAME, data.cookie_id, COOKIE_DAYS);
        }
        setUserId(data.cookie_id);
        setIsNewUser(data.es_nou);
      }
    } catch (error) {
      console.error('Error inicializando usuario:', error);
      const localId = getCookie(COOKIE_NAME) || `local_${Date.now()}_${Math.random()}`;
      if (!getCookie(COOKIE_NAME)) {
        setCookie(COOKIE_NAME, localId, COOKIE_DAYS);
      }
      setUserId(localId);
    } finally {
      setLoading(false);
    }
  };

  const checkCookieConsent = () => {
    const consented = localStorage.getItem('cookies_consent');
    if (!consented) {
      setShowCookieBanner(true);
    }
  };

  const acceptCookies = () => {
    localStorage.setItem('cookies_consent', 'true');
    setShowCookieBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookies_consent', 'false');
    setShowCookieBanner(false);
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  const [expos, setExpos] = useState([]);
  const [nav, setNav] = useState({ activeExpo: null, items: [], index: 0 });
  const [detail, setDetail] = useState({ item: null, images: [] });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [modalItemId, setModalItemId] = useState(null);

  useEffect(() => {
    const load = () => getExpos().then(setExpos).catch(console.error);
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!nav.activeExpo || nav.items.length > 0) return;
    getItems(nav.activeExpo.id).then((data) => {
      setNav((p) => ({ ...p, items: data, index: 0 }));
    });
  }, [nav.activeExpo]);

  const showDetail = async (item) => {
    try {
      setDetail({ item, images: await getItemImages(item.id) });
    } catch {
      setDetail({ item, images: [] });
    }
  };

  const onSelectItem = async (itemId, expoId) => {
    const expo = expos.find((e) => e.id === expoId);
    if (!expo) return;

    // Primer posem l'expo activa
    setNav({ activeExpo: expo, items: [], index: 0 });
    setSelectedItemId(itemId);
    
    // Carreguem els ítems immediatament i obrim el detall
    const items = await getItems(expoId);
    const item = items.find((i) => i.id === itemId);
    const index = items.findIndex((i) => i.id === itemId);
    
    setNav({ activeExpo: expo, items, index: index >= 0 ? index : 0 });
    if (item) showDetail(item);
    setSelectedItemId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <BackgroundDecoration />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="grow">
          {nav.activeExpo ? (
            <ExpoDetail
              expo={nav.activeExpo}
              items={nav.items}
              indexItem={nav.index}
              setIndexItem={(i) =>
                setNav((p) => ({
                  ...p,
                  index: typeof i === "function" ? i(p.index) : i,
                }))
              }
              onBack={() => setNav({ activeExpo: null, items: [], index: 0 })}
              verDetalleItem={showDetail}
            />
          ) : (
            <Landing
              expos={expos}
              onSelectExpo={(expo) =>
                setNav({ activeExpo: expo, items: [], index: 0 })
              }
              onSelectItem={onSelectItem}
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
      {/* Banner de cookies */}
      {showCookieBanner && (
        <CookieBanner onAccept={acceptCookies} onReject={rejectCookies} />
      )}
    </div>
  );
};

const App = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => setIsDark((d) => !d);

  return (
    <DarkContext.Provider value={{ isDark, toggle }}>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <Protected>
                <AdminDashboard />
              </Protected>
            }
          />
          <Route
            path="/admin/exposicion/:id"
            element={
              <Protected>
                <AdminExpoDetail />
              </Protected>
            }
          />
          <Route path="/" element={<MainApp />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </BrowserRouter>
    </DarkContext.Provider>
  );
};

export default App;