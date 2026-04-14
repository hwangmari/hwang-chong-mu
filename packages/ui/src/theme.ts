// 컬러 토큰은 "lightness ladder" 기준이에요.
// gray50 = 가장 옅은 톤, gray950 = 가장 짙은 톤.
// 다크 모드에선 라이트와 동일한 키를 쓰되 lightness가 미러링되어,
// 컴포넌트 코드(예: theme.colors.gray900)는 고치지 않아도 자동으로 다크에 맞게 보여요.

export const lightColors = {
  white: "#ffffff",
  black: "#000000",

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
  gray950: "oklch(0.145 0 0)",

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

  yellow50: "oklch(0.987 0.026 102.212)",
  yellow100: "oklch(0.973 0.071 103.193)",
  yellow200: "oklch(0.945 0.129 101.54)",
  yellow400: "oklch(0.852 0.199 91.936)",
  yellow500: "oklch(0.795 0.184 86.047)",
  yellow600: "oklch(0.681 0.162 75.834)",

  green50: "oklch(0.982 0.018 155.826)",
  green100: "oklch(0.962 0.044 156.743)",
  green200: "oklch(0.925 0.084 155.995)",
  green500: "oklch(0.723 0.219 149.579)",
  green600: "oklch(0.627 0.194 149.214)",

  teal50: "oklch(0.984 0.014 180.72)",
  teal100: "oklch(0.953 0.051 180.801)",
  teal200: "oklch(0.91 0.096 180.426)",
  teal500: "oklch(0.704 0.14 182.503)",
  teal600: "oklch(0.6 0.118 184.704)",

  rose50: "oklch(0.969 0.015 12.422)",
  rose100: "oklch(0.941 0.03 12.58)",
  rose200: "oklch(0.892 0.058 10.001)",
  rose500: "oklch(0.645 0.246 16.439)",
  rose600: "oklch(0.586 0.253 17.585)",

  amber50: "oklch(0.987 0.022 95.277)",
  amber100: "oklch(0.962 0.059 95.617)",
  amber200: "oklch(0.924 0.12 95.746)",
  amber500: "oklch(0.769 0.188 70.08)",
  amber600: "oklch(0.666 0.179 58.318)",

  orange50: "oklch(0.98 0.016 73.684)",
  orange100: "oklch(0.954 0.038 75.164)",
  orange200: "oklch(0.901 0.076 70.697)",
  orange500: "oklch(0.705 0.213 47.604)",
  orange600: "oklch(0.646 0.222 41.116)",
} as const;

export const darkColors = {
  // 다크 모드에선 white = 카드/표면 색, black = 강조 텍스트 색으로 의미가 뒤집힘.
  // 너무 까만 배경 + 너무 흰 텍스트는 눈이 피곤하니 부드러운 톤으로.
  white: "oklch(0.275 0 0)",
  black: "oklch(0.92 0 0)",

  // 그레이는 lightness 미러링이지만 양 극단(50, 950)을 안쪽으로 끌어와 대비 완화
  gray50: "oklch(0.225 0 0)", // 페이지 배경 (덜 까만 차콜)
  gray100: "oklch(0.275 0 0)", // 카드 표면
  gray200: "oklch(0.34 0 0)", // 구분선 / soft border
  gray300: "oklch(0.4 0 0)", // border
  gray400: "oklch(0.52 0 0)", // mute text
  gray500: "oklch(0.62 0 0)", // body sub
  gray600: "oklch(0.72 0 0)", // body
  gray700: "oklch(0.8 0 0)", // strong text
  gray800: "oklch(0.86 0 0)", // heading
  gray900: "oklch(0.9 0 0)", // main text (soft white, 눈 안 부심)
  gray950: "oklch(0.94 0 0)", // 강조 텍스트

  // 50/100/200 = 다크 표면 위에서도 자연스러운 어두운 틴트
  // 500/600/700 = 다크 위에서 또렷한 액센트
  blue50: "oklch(0.27 0.06 254.604)",
  blue100: "oklch(0.32 0.09 255.585)",
  blue200: "oklch(0.38 0.12 254.128)",
  blue500: "oklch(0.7 0.2 259.815)",
  blue600: "oklch(0.64 0.22 262.881)",
  blue700: "oklch(0.58 0.24 264.376)",

  indigo50: "oklch(0.28 0.07 272.314)",
  indigo100: "oklch(0.33 0.1 272.788)",
  indigo500: "oklch(0.67 0.22 277.117)",
  indigo600: "oklch(0.62 0.24 276.966)",

  yellow50: "oklch(0.29 0.06 102.212)",
  yellow100: "oklch(0.34 0.09 103.193)",
  yellow200: "oklch(0.4 0.12 101.54)",
  yellow400: "oklch(0.78 0.18 91.936)",
  yellow500: "oklch(0.82 0.18 86.047)",
  yellow600: "oklch(0.74 0.16 75.834)",

  green50: "oklch(0.27 0.05 155.826)",
  green100: "oklch(0.32 0.08 156.743)",
  green200: "oklch(0.38 0.11 155.995)",
  green500: "oklch(0.76 0.21 149.579)",
  green600: "oklch(0.7 0.19 149.214)",

  teal50: "oklch(0.27 0.04 180.72)",
  teal100: "oklch(0.32 0.07 180.801)",
  teal200: "oklch(0.38 0.1 180.426)",
  teal500: "oklch(0.74 0.13 182.503)",
  teal600: "oklch(0.66 0.12 184.704)",

  rose50: "oklch(0.28 0.05 12.422)",
  rose100: "oklch(0.33 0.08 12.58)",
  rose200: "oklch(0.39 0.11 10.001)",
  rose500: "oklch(0.7 0.24 16.439)",
  rose600: "oklch(0.64 0.25 17.585)",

  amber50: "oklch(0.29 0.05 95.277)",
  amber100: "oklch(0.34 0.08 95.617)",
  amber200: "oklch(0.4 0.12 95.746)",
  amber500: "oklch(0.8 0.18 70.08)",
  amber600: "oklch(0.72 0.18 58.318)",

  orange50: "oklch(0.29 0.05 73.684)",
  orange100: "oklch(0.34 0.07 75.164)",
  orange200: "oklch(0.4 0.1 70.697)",
  orange500: "oklch(0.74 0.21 47.604)",
  orange600: "oklch(0.68 0.22 41.116)",
} as const;

// 하위 호환: 기존에 `colors`를 직접 import한 곳을 위한 별칭
export const colors = lightColors;

export type ThemeMode = "light" | "dark";

// Palette = light/dark 둘 다 공통으로 만족하는 string 키 셋
export type Palette = { readonly [K in keyof typeof lightColors]: string };

const sharedTheme = {
  layout: {
    maxWidth: "1025px",
    narrowWidth: "540px",
  },
  media: {
    mobile: "(max-width: 767px)",
    desktop: "(min-width: 1024px)",
  },
} as const;

export type Semantic = {
  primary: string;
  primaryLight: string;
  secondary: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  text: string;
  subText: string;
  border: string;
  bg: string;
  sender: string;
  senderBg: string;
  senderBorder: string;
};

function buildSemantic(palette: Palette): Semantic {
  return {
    primary: palette.blue600,
    primaryLight: palette.blue50,
    secondary: palette.indigo600,

    success: palette.teal600,
    successBg: palette.teal50,

    danger: palette.rose600,
    dangerBg: palette.rose50,

    warning: palette.yellow500,
    warningBg: palette.yellow50,

    text: palette.gray900,
    subText: palette.gray500,
    border: palette.gray200,
    bg: palette.gray50,

    sender: palette.orange500,
    senderBg: palette.orange50,
    senderBorder: palette.orange200,
  };
}

export type UiTheme = {
  mode: ThemeMode;
  colors: Palette;
  semantic: Semantic;
  layout: typeof sharedTheme.layout;
  media: typeof sharedTheme.media;
};

export const lightTheme: UiTheme = {
  ...sharedTheme,
  mode: "light",
  colors: lightColors,
  semantic: buildSemantic(lightColors),
};

export const darkTheme: UiTheme = {
  ...sharedTheme,
  mode: "dark",
  colors: darkColors,
  semantic: buildSemantic(darkColors),
};

// 하위 호환: 기존 코드는 uiTheme 그대로 import 가능
export const uiTheme = lightTheme;
