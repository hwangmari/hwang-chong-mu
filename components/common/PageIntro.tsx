"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

interface PageIntroProps {
  icon?: string | React.ReactNode; // 아이콘 (이모지 등)
  title: string; // 메인 타이틀
  description?: React.ReactNode; // 설명 (줄바꿈, 강조 넣기 위해 ReactNode 사용)
}

export default function PageIntro({
  icon,
  title,
  description,
}: PageIntroProps) {
  return (
    <StHeaderContainer>
      <StTitleRow>
        {icon && <StIcon aria-hidden>{icon}</StIcon>}
        <StTitle>{title}</StTitle>
      </StTitleRow>
      {description && <StDescription>{description}</StDescription>}
    </StHeaderContainer>
  );
}

/* === 진입 연출: 아이콘이 자리를 잡고 → 형광펜이 그어지고 → 설명이 뜬다 === */

const settle = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// 형광펜이 왼쪽에서 오른쪽으로 그어지는 연출
const draw = keyframes`
  from { background-size: 0% 100%; }
  to   { background-size: 100% 100%; }
`;

const StHeaderContainer = styled.div`
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.25rem 0;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

/* 이모지를 담는 작은 라운드 사각 타일 */
const StIcon = styled.span`
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
  animation: ${settle} 320ms ease-out both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.text};
  line-height: 1.3;
  word-break: keep-all;
`;

const StDescription = styled.div`
  width: 100%;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.subText};
  line-height: 1.55;
  white-space: pre-wrap; /* 줄바꿈(\n)도 자연스럽게 먹히도록 설정 */
  word-break: keep-all;
  animation: ${fadeIn} 300ms ease-out 320ms both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* 형광펜으로 그은 듯한 밑칠 — 홈 히어로(HeroSituations StMark)와 같은 브랜드 제스처 */
export const StHighlight = styled.strong<{ $color?: "red" | "blue" }>`
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  background-image: linear-gradient(
    transparent 58%,
    ${({ theme }) => theme.colors.amber200} 58%
  );
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 100% 100%;
  padding: 0 0.15em;
  animation: ${draw} 420ms ease-out 200ms both;

  /* 모션 최소화 설정이면 연출 없이 최종 상태로 */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
