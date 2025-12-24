export const theme = {
  colors: {
    white: "#ffffff",
    black: "#000000",

    // 1. Neutral (Slate Gray) - 차분하고 고급스러운 회색
    gray50: "#f8fafc",
    gray100: "#f1f5f9",
    gray200: "#e2e8f0",
    gray300: "#cbd5e1",
    gray400: "#94a3b8",
    gray500: "#64748b",
    gray600: "#475569",
    gray700: "#334155",
    gray800: "#1e293b",
    gray900: "#0f172a",

    // 2. Primary (Royal Blue & Indigo) - 황총무의 신뢰
    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue500: "#3b82f6",
    blue600: "#2563eb", // Main Brand Color
    blue700: "#1d4ed8",
    indigo50: "#eef2ff",
    indigo600: "#4f46e5", // Sub Action

    // 3. Functional Colors
    // Positive (돈 받을 때): Teal
    teal50: "#f0fdfa",
    teal100: "#ccfbf1",
    teal200: "#99f6e4", // ✅ 추가됨!
    teal600: "#0d9488",

    // Negative/Danger (돈 줄 때): Rose
    rose50: "#fff1f2",
    rose100: "#ffe4e6",
    rose200: "#fecdd3", // ✅ 추가됨!
    rose500: "#f43f5e",
    rose600: "#e11d48",

    // Warning/Highlight: Amber
    amber100: "#fef3c7",
    amber500: "#f59e0b",

    orange50: "#fff7ed",
    orange100: "#ffedd5",
    orange200: "#fed7aa",
    orange500: "#f97316",
    orange600: "#ea580c",
  },

  // 의미론적 별칭 (Semantic Aliases) - 코드에서 고민 없이 쓰기 위함
  semantic: {
    primary: "#2563eb", // blue600
    primaryLight: "#eff6ff", // blue50
    secondary: "#4f46e5", // indigo600
    success: "#0d9488", // teal600
    successBg: "#f0fdfa", // teal50
    danger: "#e11d48", // rose600
    dangerBg: "#fff1f2", // rose50
    text: "#0f172a", // gray900
    subText: "#64748b", // gray500
    border: "#e2e8f0", // gray200
    bg: "#f8fafc", // gray50
    sender: "#f97316", // orange500
    senderBg: "#fff7ed", // orange50
    senderBorder: "#fed7aa", // orange200
  },

  media: {
    mobile: `(max-width: 767px)`,
    desktop: `(min-width: 1024px)`,
  },
};
