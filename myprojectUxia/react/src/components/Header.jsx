import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHistorial = location.pathname === "/historial";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white text-xl font-bold">
            U
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">
              UXIA
            </h1>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
              Assistent
            </span>
          </div>
        </div>

        {!isHistorial && (
          <button
            onClick={() => navigate("/historial")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 text-slate-700 hover:text-slate-900"
          >
            <span className="text-xl">📋</span>
            <span className="text-sm font-medium hidden sm:inline">Historial</span>
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;