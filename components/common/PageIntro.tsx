"use client";

import React from "react";
import styled from "styled-components";

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
      {icon && (
        <StLogo>
          <StIcon>{icon}</StIcon>
        </StLogo>
      )}
      <StTitle>{title}</StTitle>
      {description && <StDescription>{description}</StDescription>}
    </StHeaderContainer>
  );
}

const StHeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
`;

const StIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 0.5rem;
`;

const StTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a; /* 기본 색상 (테마가 있다면 theme.colors.text 등으로 교체) */
  margin-bottom: 0.75rem;
  line-height: 1.3;
`;

const StDescription = styled.div`
  width: 80%;
  margin: 0 auto;
  font-size: 1rem;
  color: #888;
  line-height: 1.6;
  white-space: pre-wrap; /* 줄바꿈(\n)도 자연스럽게 먹히도록 설정 */
`;

export const StHighlight = styled.strong<{ $color?: "red" | "blue" }>`
  display: inline-block;
  font-weight: 700;
  color: ${({ $color }) =>
    $color === "red" ? "#f87171" : $color === "blue" ? "#60a5fa" : "#333"};
`;

const StLogo = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;
