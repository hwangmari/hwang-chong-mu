/* eslint-disable @typescript-eslint/no-empty-object-type */
import "styled-components";
import { theme } from "./theme"; // 👈 우리가 만든 테마 파일 가져오기

type ThemeType = typeof theme;

/** styled-components의 'DefaultTheme' 인터페이스를 확장합니다. */
declare module "styled-components" {
  export interface DefaultTheme extends ThemeType {}
}
