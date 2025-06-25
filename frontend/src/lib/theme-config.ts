// Configuración de colores del tema
// Este archivo centraliza todas las paletas de colores para facilitar su personalización

export const themeColors = {
  light: {
    // Colores base
    background: "#ffffff",
    foreground: "#09090b",

    // Colores de superficie
    card: "#ffffff",
    cardForeground: "#09090b",
    popover: "#ffffff",
    popoverForeground: "#09090b",

    // Colores primarios
    primary: "#18181b",
    primaryForeground: "#fafafa",

    // Colores secundarios
    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",

    // Colores mutados (elementos deshabilitados/secundarios)
    muted: "#f4f4f5",
    mutedForeground: "#71717a",

    // Colores de acento
    accent: "#f4f4f5",
    accentForeground: "#18181b",

    // Colores destructivos (errores, eliminar)
    destructive: "#ef4444",
    destructiveForeground: "#fafafa",

    // Colores de borde
    border: "#e4e4e7",
    input: "#e4e4e7",
    ring: "#18181b",

    // Colores específicos del dashboard
    sidebar: "#fafafa",
    sidebarForeground: "#18181b",
    tableHeader: "#f9fafb",
    tableHover: "#f9fafb",
  },

  dark: {
    // Colores base - más suaves que el negro puro
    background: "#0a0a0a",
    foreground: "#e4e4e7",

    // Colores de superficie - grises más suaves
    card: "#111111",
    cardForeground: "#e4e4e7",
    popover: "#111111",
    popoverForeground: "#e4e4e7",

    // Colores primarios - menos contrastantes
    primary: "#d4d4d8",
    primaryForeground: "#0a0a0a",

    // Colores secundarios - tonos intermedios
    secondary: "#1f1f23",
    secondaryForeground: "#d4d4d8",

    // Colores mutados - grises medios
    muted: "#1f1f23",
    mutedForeground: "#a1a1aa",

    // Colores de acento
    accent: "#1f1f23",
    accentForeground: "#d4d4d8",

    // Colores destructivos - rojo más suave
    destructive: "#dc2626",
    destructiveForeground: "#fafafa",

    // Colores de borde - más sutiles
    border: "#27272a",
    input: "#27272a",
    ring: "#d4d4d8",

    // Colores específicos del dashboard
    sidebar: "#0f0f0f",
    sidebarForeground: "#d4d4d8",
    tableHeader: "#161618",
    tableHover: "#1a1a1c",
  },
};

// Función para aplicar los colores al CSS
export const applyCSSVariables = (theme: "light" | "dark") => {
  const colors = themeColors[theme];
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    // Convertir camelCase a kebab-case y agregar prefijo
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
};
