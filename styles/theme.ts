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
    blue200: "#bfdbfe", // 수정 (기존값 중복 수정)
    blue500: "#3b82f6",
    blue600: "#2563eb", // Main Brand
    blue700: "#1d4ed8",

    indigo50: "#eef2ff",
    indigo100: "#e0e7ff", // 추가
    indigo500: "#6366f1", // 추가
    indigo600: "#4f46e5", // Sub Action

    // 3. Functional Colors (Tailwind Standard Palette)

    // ✅ [NEW] Yellow (주의/강조/별점)
    yellow50: "#fefce8",
    yellow100: "#fef9c3",
    yellow200: "#fef08a",
    yellow400: "#facc15",
    yellow500: "#eab308",
    yellow600: "#ca8a04",

    // ✅ [NEW] Green (성공/완료 - Teal보다 더 일반적인 녹색)
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green200: "#bbf7d0",
    green500: "#22c55e",
    green600: "#16a34a",

    // Teal (Positive - 돈 받을 때)
    teal50: "#f0fdfa",
    teal100: "#ccfbf1",
    teal200: "#99f6e4",
    teal500: "#14b8a6", // 추가
    teal600: "#0d9488",

    // Rose (Negative - 돈 줄 때)
    rose50: "#fff1f2",
    rose100: "#ffe4e6",
    rose200: "#fecdd3",
    rose500: "#f43f5e",
    rose600: "#e11d48",

    // Amber (Warning/Gold)
    amber50: "#fffbeb", // 추가
    amber100: "#fef3c7",
    amber200: "#fde68a", // 추가
    amber500: "#f59e0b",
    amber600: "#d97706", // 추가

    // Orange (Sender)
    orange50: "#fff7ed",
    orange100: "#ffedd5",
    orange200: "#fed7aa",
    orange500: "#f97316",
    orange600: "#ea580c",
  },

  // 의미론적 별칭 (Semantic Aliases)
  semantic: {
    primary: "#2563eb", // blue600
    primaryLight: "#eff6ff", // blue50
    secondary: "#4f46e5", // indigo600

    success: "#0d9488", // teal600
    successBg: "#f0fdfa", // teal50

    danger: "#e11d48", // rose600
    dangerBg: "#fff1f2", // rose50

    warning: "#eab308", // yellow500 (추가됨)
    warningBg: "#fefce8", // yellow50 (추가됨)

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
