/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F6F5F2",
      "foreground": "#1E242B",
      "border": "#E4E2DC",
      "card": "#ffffff",
      "cardForeground": "#1d232a",
      "popover": "#ffffff",
      "popoverForeground": "#1d232a",
      "primary": "#0F1E33",
      "primaryForeground": "#F6F5F2",
      "secondary": "#EFEDE8",
      "secondaryForeground": "#1d232a",
      "muted": "#f0eeea",
      "mutedForeground": "#5F6B7A",
      "accent": "#F3EBD7",
      "accentForeground": "#8E6F2B",
      "destructive": "#b52217",
      "destructiveForeground": "#ffffff",
      "input": "#e4e2dd",
      "ring": "#b99546",
      "chart1": "#0f1e33",
      "chart2": "#B99545",
      "chart3": "#1B7F4C",
      "chart4": "#B42318",
      "chart5": "#3B5B8C",
      "sidebar": "#0F1E33",
      "sidebarForeground": "#eeece7",
      "sidebarBorder": "#24354c",
      "sidebarPrimary": "#b99546",
      "sidebarPrimaryForeground": "#0f1e33",
      "sidebarAccent": "#253A5A",
      "sidebarAccentForeground": "#f7f5f3",
      "sidebarRing": "#b99546"
    },
    "dark": {
      "background": "#0a1524",
      "foreground": "#eeece7",
      "border": "#243042",
      "card": "#111c2c",
      "cardForeground": "#eeece7",
      "popover": "#111c2c",
      "popoverForeground": "#eeece7",
      "primary": "#c09f59",
      "primaryForeground": "#0a1524",
      "secondary": "#202c3c",
      "secondaryForeground": "#eeece7",
      "muted": "#202c3c",
      "mutedForeground": "#9aa4b1",
      "accent": "#493e27",
      "accentForeground": "#ebd7ad",
      "destructive": "#da3a2f",
      "destructiveForeground": "#ffffff",
      "input": "#243042",
      "ring": "#b99546",
      "chart1": "#0f1e33",
      "chart2": "#b99546",
      "chart3": "#1b7e4d",
      "chart4": "#b52217",
      "chart5": "#3c5d8b",
      "sidebar": "#08101c",
      "sidebarForeground": "#eeece7",
      "sidebarBorder": "#1d2735",
      "sidebarPrimary": "#c09f59",
      "sidebarPrimaryForeground": "#0a1524",
      "sidebarAccent": "#172436",
      "sidebarAccentForeground": "#eeece7",
      "sidebarRing": "#c09f59"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "IBM Plex Mono",
      "monospace"
    ]
  },
  "radius": "0.75rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
