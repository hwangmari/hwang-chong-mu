import type { DefaultTheme } from "styled-components";

/** data/experiences.tsx가 들고 있는 tailwind 스타일 색 이름을 테마 토큰으로 옮긴다. */
export function companyColor(theme: DefaultTheme, colorClass: string): string {
  if (colorClass.includes("orange-500")) return theme.colors.orange500;
  if (colorClass.includes("yellow-400")) return theme.colors.yellow400;
  if (colorClass.includes("blue-600")) return theme.colors.blue600;
  if (colorClass.includes("gray-400")) return theme.colors.gray400;
  // "bg-black"은 다크 모드에서 흰색이 되어 버리므로 본문 색 토큰을 쓴다.
  if (colorClass.includes("black")) return theme.colors.gray900;
  return theme.colors.gray300;
}

// 각 토큰의 밝기(oklch의 L). 라이트/다크에서 값이 뒤집히는 것들이 있어 표로 들고 있는다.
const LIGHTNESS: Record<string, { light: number; dark: number }> = {
  "orange-500": { light: 0.705, dark: 0.74 },
  "yellow-400": { light: 0.852, dark: 0.78 },
  "blue-600": { light: 0.546, dark: 0.64 },
  "gray-400": { light: 0.708, dark: 0.52 },
  black: { light: 0.205, dark: 0.9 },
};

/** 회사 색 위에 얹을 글자색. 배경이 밝으면 검정, 어두우면 흰색. */
export function companyInk(theme: DefaultTheme, colorClass: string): string {
  const key = Object.keys(LIGHTNESS).find((k) => colorClass.includes(k));
  const entry = key ? LIGHTNESS[key] : undefined;
  const lightness = entry ? (theme.mode === "dark" ? entry.dark : entry.light) : 0.9;
  return lightness > 0.62 ? "#151515" : "#ffffff";
}
