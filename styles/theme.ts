const colors = {
  white: "#ffffff",
  black: "#000000",

  /** 1. Neutral (Pure Gray) - 제공해주신 값 적용 */
  gray50: "oklch(0.985 0 0)",
  gray100: "oklch(0.97 0 0)",
  gray200: "oklch(0.922 0 0)",
  gray300: "oklch(0.87 0 0)",
  gray400: "oklch(0.708 0 0)",
  gray500: "oklch(0.556 0 0)",
  gray600: "oklch(0.439 0 0)",
  gray700: "oklch(0.371 0 0)",
  gray800: "oklch(0.269 0 0)",
  gray900: "oklch(0.205 0 0)",
  gray950: "oklch(0.145 0 0)", // 950 추가됨 (아주 깊은 검은색에 가까운 회색)

  /** 2. Primary (Blue & Indigo) */
  blue50: "oklch(0.97 0.014 254.604)",
  blue100: "oklch(0.932 0.032 255.585)",
  blue200: "oklch(0.882 0.059 254.128)",
  blue500: "oklch(0.623 0.214 259.815)",
  blue600: "oklch(0.546 0.245 262.881)",
  blue700: "oklch(0.488 0.243 264.376)",

  indigo50: "oklch(0.962 0.018 272.314)",
  indigo100: "oklch(0.93 0.034 272.788)",
  indigo500: "oklch(0.585 0.233 277.117)",
  indigo600: "oklch(0.511 0.262 276.966)",

  /** 3. Functional Colors */
  yellow50: "oklch(0.987 0.026 102.212)",
  yellow100: "oklch(0.973 0.071 103.193)",
  yellow200: "oklch(0.945 0.129 101.54)",
  yellow400: "oklch(0.852 0.199 91.936)",
  yellow500: "oklch(0.795 0.184 86.047)",
  yellow600: "oklch(0.681 0.162 75.834)",

  /** Green (성공/완료) */
  green50: "oklch(0.982 0.018 155.826)",
  green100: "oklch(0.962 0.044 156.743)",
  green200: "oklch(0.925 0.084 155.995)",
  green500: "oklch(0.723 0.219 149.579)",
  green600: "oklch(0.627 0.194 149.214)",

  /** Teal (Positive) */
  teal50: "oklch(0.984 0.014 180.72)",
  teal100: "oklch(0.953 0.051 180.801)",
  teal200: "oklch(0.91 0.096 180.426)",
  teal500: "oklch(0.704 0.14 182.503)",
  teal600: "oklch(0.6 0.118 184.704)",

  /** Rose (Negative) */
  rose50: "oklch(0.969 0.015 12.422)",
  rose100: "oklch(0.941 0.03 12.58)",
  rose200: "oklch(0.892 0.058 10.001)",
  rose500: "oklch(0.645 0.246 16.439)",
  rose600: "oklch(0.586 0.253 17.585)",

  /** Amber (Warning) */
  amber50: "oklch(0.987 0.022 95.277)",
  amber100: "oklch(0.962 0.059 95.617)",
  amber200: "oklch(0.924 0.12 95.746)",
  amber500: "oklch(0.769 0.188 70.08)",
  amber600: "oklch(0.666 0.179 58.318)",

  /** Orange (Sender) */
  orange50: "oklch(0.98 0.016 73.684)",
  orange100: "oklch(0.954 0.038 75.164)",
  orange200: "oklch(0.901 0.076 70.697)",
  orange500: "oklch(0.705 0.213 47.604)",
  orange600: "oklch(0.646 0.222 41.116)",
};

export const theme = {
  colors,
  layout: {
    maxWidth: "1025px",
    narrowWidth: "540px",
  },
  /** 의미론적 별칭 (Semantic Aliases) */
  semantic: {
    primary: colors.blue600,
    primaryLight: colors.blue50,
    secondary: colors.indigo600,

    success: colors.teal600,
    successBg: colors.teal50,

    danger: colors.rose600,
    dangerBg: colors.rose50,

    warning: colors.yellow500,
    warningBg: colors.yellow50,

    text: colors.gray900,
    subText: colors.gray500,
    border: colors.gray200,
    bg: colors.gray50,

    sender: colors.orange500,
    senderBg: colors.orange50,
    senderBorder: colors.orange200,
  },

  media: {
    mobile: `(max-width: 767px)`,
    desktop: `(min-width: 1024px)`,
  },
};
