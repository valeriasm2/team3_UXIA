import React from "react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
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
      </nav>
    </header>
  );
};

export default Header;
