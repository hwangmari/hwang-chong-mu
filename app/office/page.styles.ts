"use client";

import Link from "next/link";
import styled, { css, keyframes } from "styled-components";
import { MAP_H, MAP_W } from "./stations";

/* 황총무 오피스 전용 스타일 (2026-10-27).
   사무실 그림은 픽셀이라 늘려도 흐려지지 않게(pixelated) 그리고,
   이름표·누르는 곳은 그림 위에 % 자리로 얹는다. */

/* ===== 전체 화면 모드 (2026-10-27) =====
   헤더·푸터는 페이지가 useMarkChromeHidden 으로 숨기고, 여기서는 사무실을 화면 가득 펼친다.
   위: 떠 있는 막대(나가기 · 픽셀|동숲 · 이름표) / 가운데: 사무실 / 아래: 떠 있는 '가까이 있는 것' 카드 */
const glassBar = css`
  background: rgba(30, 33, 41, 0.62);
  backdrop-filter: blur(8px);
  color: #fff;
`;

export const StRoot = styled.div<{ $full: boolean; $animal: boolean }>`
  ${({ $full, $animal }) =>
    $full &&
    css`
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${$animal ? "#b9dd9c" : "#8cc46a"};
    `}
`;

/* 위 막대: 보통 땐 탭 줄(오른쪽 끝 '전체 화면'), 전체 화면에선 화면 위에 떠 있는 유리 막대 */
export const StBar = styled.div<{ $full: boolean }>`
  /* 폰 전체 화면에선 "오피스"·"이름표 모두 보기" 같은 긴 말을 빼고 아이콘만 */
  @media ${({ theme }) => theme.media.mobile} {
    ${({ $full }) => ($full ? ".more { display: none; }" : "")}
  }
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};

  ${({ $full }) =>
    $full &&
    css`
      position: absolute;
      top: 0.75rem;
      left: 50%;
      z-index: 3;
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 1.5rem);
      margin: 0;
      padding: 0.3rem 0.4rem;
      border: 0;
      border-radius: 999px;
      ${glassBar}
    `}
`;

export const StBarButton = styled.button<{ $light?: boolean }>`
  flex-shrink: 0;
  padding: 0.4rem 0.8rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  ${({ $light, theme }) =>
    $light
      ? css`
          margin-left: auto;
          margin-bottom: 0.35rem;
          background: ${theme.semantic.bg};
          color: ${theme.semantic.text};
        `
      : css`
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        `}
`;

/* 픽셀 | 동숲 — 페이지 탭이라 밑줄 탭 (전체 화면에선 막대 안의 알약) */
export const StModeTabs = styled.div<{ $full: boolean }>`
  display: flex;
  gap: ${({ $full }) => ($full ? "0.25rem" : "1.25rem")};
`;

export const StModeTab = styled.button<{ $on: boolean; $full: boolean }>`
  margin-bottom: -1px;
  padding: 0.5rem 0.1rem 0.6rem;
  border: 0;
  border-bottom: 2px solid ${({ theme, $on }) => ($on ? theme.semantic.primary : "transparent")};
  background: transparent;
  color: ${({ theme, $on }) => ($on ? theme.semantic.text : theme.semantic.subText)};
  font-size: 0.95rem;
  font-weight: ${({ $on }) => ($on ? 800 : 600)};
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;

  ${({ $full, $on }) =>
    $full &&
    css`
      margin: 0;
      padding: 0.4rem 0.8rem;
      border: 0;
      border-radius: 999px;
      background: ${$on ? "#fff" : "transparent"};
      color: ${$on ? "#1e2129" : "rgba(255, 255, 255, 0.8)"};
      font-size: 0.86rem;
    `}

  @media ${({ theme }) => theme.media.mobile} {
    font-size: 0.86rem;
  }
`;

export const StStage = styled.div<{ $animal?: boolean; $full?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${MAP_W} / ${MAP_H};
  border-radius: 1rem;
  overflow: hidden;
  outline: none;
  background: ${({ $animal }) => ($animal ? "#b9dd9c" : "#8cc46a")};
  box-shadow: 0 0 0 1px ${({ theme }) => theme.semantic.border};
  touch-action: manipulation;

  &:focus-visible {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.semantic.primary};
  }

  /* 전체 화면: 픽셀·동숲 모두 화면 전체가 무대 (픽셀도 카메라가 황총무를 따라가고 바깥은 풍경으로 채운다) */
  ${({ $full }) =>
    $full &&
    css`
      border-radius: 0;
      box-shadow: none;
      &:focus-visible {
        box-shadow: none;
      }
      width: 100vw;
      height: 100dvh;
      aspect-ratio: auto;
    `}

  .host {
    position: absolute;
    inset: 0;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    cursor: pointer;
  }
`;

/* 도구로 가는 중: 사무실 위에 반투명 막 + 가운데 카드. 막대는 한 번 90%까지 차오르고 멈춘다 (무한 반복 없음) */
const fill = keyframes`
  from { width: 6%; }
  to { width: 90%; }
`;
const pop = keyframes`
  0% { transform: translateY(6px) scale(0.9); opacity: 0; }
  60% { transform: translateY(-4px) scale(1.06); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
`;

export const StGoing = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 33, 41, 0.35);
  backdrop-filter: blur(2px);
  cursor: progress;

  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    min-width: 15rem;
    padding: 1.25rem 1.5rem 1.1rem;
    border-radius: 1rem;
    background: ${({ theme }) => theme.colors.white};
    box-shadow: 0 10px 32px rgba(30, 33, 41, 0.3);
  }
  .icon {
    font-size: 2.4rem;
    line-height: 1;
    animation: ${pop} 0.45s ease-out both;
  }
  strong {
    font-size: 1rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
  .bar {
    width: 100%;
    height: 0.4rem;
    border-radius: 999px;
    background: ${({ theme }) => theme.semantic.bg};
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: ${({ theme }) => theme.semantic.primary};
    animation: ${fill} 1.8s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .icon,
    .bar i {
      animation: none;
    }
    .bar i {
      width: 60%;
    }
  }
`;

/* 동숲 화면 오른쪽 아래: － ＋ 전체 보기 */
export const StZoomBar = styled.div<{ $full: boolean }>`
  position: absolute;
  right: 0.75rem;
  bottom: ${({ $full }) => ($full ? "1rem" : "0.75rem")};
  z-index: 3;
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(30, 33, 41, 0.62);
  backdrop-filter: blur(8px);

  button {
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0 0.7rem;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }
  button[aria-pressed="true"] {
    background: #fff;
    color: #1e2129;
  }

  /* 전체 화면: 아래 카드와 겹치지 않게 오른쪽 가운데에 세로로 */
  ${({ $full }) =>
    $full &&
    css`
      top: 50%;
      bottom: auto;
      flex-direction: column;
      transform: translateY(-50%);
      border-radius: 1.25rem;
      button:last-child {
        padding: 0.4rem;
        height: auto;
        white-space: normal;
        width: 2.25rem;
        line-height: 1.2;
        font-size: 0.72rem;
      }
    `}
`;

/* 구역 이름표 — 픽셀은 늘, 동숲은 전체 보기에서만 */
export const StZoneTag = styled.span`
  position: absolute;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(30, 33, 41, 0.62);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;

  @media ${({ theme }) => theme.media.mobile} {
    font-size: 0.58rem;
    padding: 0.05rem 0.3rem;
  }
`;

/* 가구 위 누르는 곳 — 그림은 캔버스가 그리고 이 버튼은 투명하다 */
export const StHot = styled.button`
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #ffd36b;
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

/* 가구 이름표 — 가까이 가거나 마우스를 올렸을 때, 또는 '이름표 모두 보기' */
export const StNameTag = styled.span<{ $show: boolean; $active: boolean }>`
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#ffd36b" : "rgba(255, 255, 255, 0.94)")};
  color: #1e2129;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 0.15s ease;
  box-shadow: 0 1px 3px rgba(30, 33, 41, 0.25);
  z-index: 2;

  @media ${({ theme }) => theme.media.mobile} {
    font-size: 0.6rem;
    padding: 0.05rem 0.3rem;
  }
`;

/* 그림 아래: 가까이 있는 것 카드 — 비어 있어도 높이를 지켜 화면이 뛰지 않게 */
export const StPanel = styled.div<{ $full?: boolean }>`
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.875rem;
  min-height: 4.75rem;
  margin-top: 0.875rem;
  padding: 0.875rem 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};

  ${({ $full }) =>
    $full &&
    css`
      position: absolute;
      bottom: 1rem;
      left: 50%;
      z-index: 3;
      transform: translateX(-50%);
      width: min(560px, calc(100vw - 1.5rem));
      margin: 0;
      border: 0;
      box-shadow: 0 8px 28px rgba(30, 33, 41, 0.28);
    `}
`;

export const StPanelIcon = styled.span`
  font-size: 1.9rem;
  line-height: 1;
  text-align: center;
`;

export const StPanelText = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: 1rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }

  span {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.86rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

export const StOpen = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  text-decoration: none;

  kbd {
    padding: 0 0.3rem;
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.22);
    font-family: inherit;
    font-size: 0.75rem;
  }

  @media ${({ theme }) => theme.media.mobile} {
    kbd {
      display: none;
    }
  }
`;

/* 조작 안내 줄 + 이름표 토글 */
export const StControls = styled.div<{ $full?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-top: 0.625rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.semantic.subText};

  kbd {
    padding: 0.05rem 0.35rem;
    border-radius: 0.3rem;
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.text};
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* 전체 화면: 조작 안내 한 줄만 카드 바로 위에 */
  ${({ $full }) =>
    $full &&
    css`
      position: absolute;
      bottom: calc(1rem + 4.75rem + 0.5rem);
      left: 50%;
      z-index: 3;
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 1.5rem);
      margin: 0;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      ${glassBar}
      kbd {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }
    `}

  /* 폰 전체 화면에선 안내 줄을 빼고 카드만 (누르면 걸어가요는 카드 문구가 대신한다) */
  @media ${({ theme }) => theme.media.mobile} {
    ${({ $full }) => ($full ? "display: none;" : "")}
  }
`;

export const StToggle = styled.button<{ $on: boolean; $full?: boolean }>`
  padding: 0.35rem 0.75rem;
  border: 1px solid ${({ theme, $on }) => ($on ? theme.semantic.primary : theme.semantic.border)};
  border-radius: 999px;
  background: ${({ theme, $on }) => ($on ? theme.semantic.primaryLight : "transparent")};
  color: ${({ theme, $on }) => ($on ? theme.semantic.primary : theme.semantic.subText)};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  ${({ $full, $on }) =>
    $full &&
    css`
      border: 0;
      background: ${$on ? "#ffd36b" : "rgba(255, 255, 255, 0.14)"};
      color: ${$on ? "#1e2129" : "#fff"};
    `}
`;

/* ===== 사무실 안내도 (모든 가구를 글로) ===== */

export const StDirectory = styled.section`
  margin-top: 2rem;

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

export const StDirGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const StDirCard = styled.div`
  padding: 0.875rem 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};

  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;

export const StDirItem = styled.li`
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr);
  gap: 0.25rem 0.5rem;
  padding: 0.35rem 0;
  font-size: 0.86rem;
  line-height: 1.5;

  a {
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.text};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  small {
    grid-column: 2;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;
