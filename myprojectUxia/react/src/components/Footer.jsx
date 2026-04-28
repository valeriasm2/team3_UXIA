import React from "react";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* LOGOS SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 py-10 px-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <a
            href="https://sites.google.com/xtec.cat/proyectos-de-innovacion/inicio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-72 hover:opacity-80 transition-opacity"
          >
            <img
              src="/media/logosFooter/generalitat.png"
              alt="Generalitat de Catalunya"
              className="w-full h-auto object-contain"
            />
          </a>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-600 hidden md:block"></div>
          <a
            href="https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-B-2023-24805.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-72 hover:opacity-80 transition-opacity"
          >
            <img
              src="/media/logosFooter/ministerio.png"
              alt="Ministeri d'Educació"
              className="w-full h-auto object-contain"
            />
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-50 dark:border-slate-700">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
              UXIA <span className="text-accent">PROJECT</span>
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Assistent Intel·ligent d'Exposicions © 2026
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
