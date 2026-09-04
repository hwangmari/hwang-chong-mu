"use client";

// 첫 화면의 큰 제목. 글자는 바로 자리에 있고, 형광펜만 한 번 좌→우로 그어진다.
// 문구는 기존 포트폴리오의 카피 그대로다.
import styled from "styled-components";
import { HERO_TIMING, OUT_EASE, markDraw } from "./heroChoreography";

export default function AnimatedTitle() {
  return (
    <StTitle id="hero-title">
      좋은 크루들과 함께할 때,
      <br />
      <StMark>더 좋은 서비스</StMark>를 만듭니다.
    </StTitle>
  );
}

const StTitle = styled.h1`
  margin: 0;
  font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  font-weight: 400;
  /* 폰에서는 두 줄이 넘치지 않는 크기가 상한이다 */
  font-size: clamp(1.95rem, 5.4vw, 4.2rem);
  line-height: 1.08;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

/* 홈 화면과 같은 형광펜 밑칠 — 좌에서 우로 한 번 그어진다 */
const StMark = styled.span`
  background-image: linear-gradient(
    transparent 58%,
    ${({ theme }) => theme.colors.amber200} 58%
  );
  background-repeat: no-repeat;
  background-position: left center;
  background-size: 0% 100%;
  padding: 0 0.06em;
  animation: ${markDraw} 0.4s ${OUT_EASE} ${HERO_TIMING.mark}s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-size: 100% 100%;
  }
`;
