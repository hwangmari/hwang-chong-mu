// 첫 화면에 남은 움직임은 딱 두 가지다.
// 1) 커리어 리본이 한 번 풀리는 것 (이 페이지의 시그니처)
// 2) 제목의 형광펜이 한 번 그어지는 것
// 그 밖의 등장 효과는 두지 않는다.
import { keyframes } from "styled-components";

export const HERO_TIMING = {
  /** 형광펜이 그어지기 시작하는 시각(초) */
  mark: 0.2,
  /** 빛줄기가 풀리기 시작하는 시각(초) */
  ribbonLine: 0.15,
  /** 회사 칸이 피어나기 시작하는 시각(초) */
  ribbonBloom: 0.62,
} as const;

export const OUT_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

export const markDraw = keyframes`
  from { background-size: 0% 100%; }
  to   { background-size: 100% 100%; }
`;

export const unrollLine = keyframes`
  0%   { transform: scaleX(0); opacity: 1; }
  70%  { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
`;

export const bloomSegment = keyframes`
  from { opacity: 0; transform: scaleY(0.15); }
  to   { opacity: 1; transform: none; }
`;
