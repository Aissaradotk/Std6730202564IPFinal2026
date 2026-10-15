import { Platform } from "react-native";

export const lightColors = {
  midnightNavy: "#0B1020",
  deepSlate: "#151C31",
  electricViolet: "#7857FF",
  brightBlue: "#477BFF",
  cyanAccent: "#43D9E8",
  softBackground: "#F5F6FA",
  primaryText: "#171A2B",
  mutedText: "#777F95",
  success: "#22B983",
  warning: "#F5A524",
  danger: "#F05D73",

  headerBg: "#0f172a",
  headerBorder: "#1e293b",
  cardBg: "#ffffff",
  surfaceBg: "#f8fafc",
  subCardBg: "#f8fafc",
  logoBadgeBg: "#1e293b",
  logoBadgeBorder: "#334155",
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
  buttonBg: "#2563eb",
  buttonDisabled: "rgba(37,99,235,0.5)",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  border: "#cbd5e1",
  kpiBg: "#f8fafc",
  kpiBorder: "#e2e8f0",
  tabBg: "#ffffff",
  tabBorder: "#cbd5e1",
  mode: "light"
};

export const darkColors = {
  midnightNavy: "#0B1020",
  deepSlate: "#151C31",
  electricViolet: "#7857FF",
  brightBlue: "#477BFF",
  cyanAccent: "#43D9E8",
  softBackground: "#0B1020",
  primaryText: "#F8FAFC",
  mutedText: "#94A3B8",
  success: "#22B983",
  warning: "#F5A524",
  danger: "#F05D73",

  headerBg: "#070b14",
  headerBorder: "#1e293b",
  cardBg: "#111827",
  surfaceBg: "#0b1020",
  subCardBg: "#1a2234",
  logoBadgeBg: "#151c31",
  logoBadgeBorder: "#334155",
  inputBg: "#1a2234",
  inputBorder: "#334155",
  buttonBg: "#3b82f6",
  buttonDisabled: "rgba(59,130,246,0.5)",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  border: "#334155",
  kpiBg: "#151c31",
  kpiBorder: "#334155",
  tabBg: "#111827",
  tabBorder: "#334155",
  mode: "dark"
};

export const colors = lightColors;

export const getTheme = (isDark = false) => (isDark ? darkColors : lightColors);

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8
};

export const typography = {
  fontFamily: Platform.select({
    web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    default: "System"
  }),
  fontFamilyMono: Platform.select({
    web: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    default: "Courier"
  }),
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5
  },
  subheading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155"
  },
  body: {
    fontSize: 14,
    fontWeight: "500",
    color: "#171A2B"
  }
};

export const spacing = (factor) => factor * 8; // 8px grid
