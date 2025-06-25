import { useEffect, useState } from "react";
import { applyCSSVariables } from "../lib/theme-config";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let actualTheme: "light" | "dark";

    if (theme === "system") {
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      actualTheme = theme;
    }

    root.classList.add(actualTheme);

    // Aplicar variables CSS personalizadas
    applyCSSVariables(actualTheme);
  }, [theme]);

  const setThemeValue = (theme: Theme) => {
    localStorage.setItem("theme", theme);
    setTheme(theme);
  };

  return {
    theme,
    setTheme: setThemeValue,
  };
}
