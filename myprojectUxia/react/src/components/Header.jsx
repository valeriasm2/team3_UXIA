import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDark } from "../App";
import { useLanguage } from "../context/LanguageContext";

const LANGS = ["en", "es", "ca", "fr"];

const DarkToggle = ({ isDark, toggle, label }) => (
  <button
    onClick={toggle}
    aria-label={label}
    className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center"
  >
    {isDark ? (
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM5 8a1 1 0 100-2H4a1 1 0 100 2h1z" clipRule="evenodd" />
      </svg>
    )}
  </button>
);

const LangSelector = ({ current, onChange }) => (
  <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
    {LANGS.map((lang) => (
      <button
        key={lang}
        onClick={() => onChange(lang)}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
          current === lang
            ? "bg-accent text-white shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        {lang.toUpperCase()}
      </button>
    ))}
  </div>
);

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isHistorial = location.pathname === "/historial";
  const isAdmin =
    location.pathname === "/admin" || location.pathname === "/admin/dashboard";

  const { isDark, toggle } = useDark();
  const { changeLanguage } = useLanguage();

  const cambiarIdioma = (lang) => {
    i18n.changeLanguage(lang);
    changeLanguage(lang);
  };

  const currentLang = i18n.language?.split("-")[0] || "en";

  const Brand = ({ subtitle }) => (
    <div
      className="flex items-center gap-3 cursor-pointer select-none"
      onClick={() => navigate("/")}
    >
      <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-white text-lg font-black shadow-sm">
        U
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {t("app_title")}
        </span>
        <span className="text-[10px] font-bold text-accent uppercase tracking-widest mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 transition-colors shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Brand subtitle={t("admin")} />

          <div className="flex items-center gap-2">
            <LangSelector current={currentLang} onChange={cambiarIdioma} />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            <DarkToggle isDark={isDark} toggle={toggle} label={t("change_theme")} />
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Brand subtitle={t("app_subtitle")} />

        <div className="flex items-center gap-2">
          <LangSelector current={currentLang} onChange={cambiarIdioma} />

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {!isHistorial && (
            <button
              onClick={() => navigate("/historial")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <span className="text-base">📋</span>
              <span className="hidden sm:inline">{t("history")}</span>
            </button>
          )}

          <button
            onClick={() => navigate("/admin")}
            className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {t("admin_login")}
          </button>

          <DarkToggle isDark={isDark} toggle={toggle} label={t("change_theme")} />
        </div>
      </nav>
    </header>
  );
};

export default Header;
