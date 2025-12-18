/* eslint-disable @typescript-eslint/no-empty-object-type */
import "styled-components";
import { theme } from "./theme"; // 👈 우리가 만든 테마 파일 가져오기

// 'theme' 객체의 타입을 자동으로 추출합니다. (일일이 적을 필요 없음!)
type ThemeType = typeof theme;

// styled-components의 'DefaultTheme' 인터페이스를 확장합니다.
declare module "styled-components" {
  export interface DefaultTheme extends ThemeType {}
}
