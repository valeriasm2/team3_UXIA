import React from "react";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-md py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <img src="/media/logo_vng.png" alt="VNG" className="h-12 w-auto" />
          <img src="/media/logo_ieti.png" alt="IETI" className="h-10 w-auto" />
          <img
            src="/media/logo_lluisa_vidal.png"
            alt="Lluïsa Vidal"
            className="h-12 w-auto"
          />
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-100 px-4 py-1 rounded-full">
            © {new Date().getFullYear()} UXIA — Arxiu Digital de l'Exposició de
            Vilanova
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
