import "styled-components";
import { theme } from "./theme"; // 👈 우리가 만든 테마 파일 가져오기

type ThemeType = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme extends ThemeType {}
}
