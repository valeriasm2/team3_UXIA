import { useState, useEffect, useContext, createContext } from "react";

// Crear contexto del tema
export const ThemeContext = createContext();

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider");
  }
  return context;
};

// Hook para manejar la lógica del tema
export const useThemeLogic = () => {
  const [isDark, setIsDark] = useState(() => {
    // Verificar preferencia guardada en localStorage
    const savedTheme = localStorage.getItem("theme-preference");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    // Si no hay preferencia guardada, detectar la del dispositivo
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Aplicar tema al documento
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme-preference", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      localStorage.setItem("theme-preference", "light");
    }
  }, [isDark]);

  // Detectar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      // Solo aplicar si no hay preferencia manual guardada
      if (!localStorage.getItem("theme-preference")) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return { isDark, toggleTheme };
};
