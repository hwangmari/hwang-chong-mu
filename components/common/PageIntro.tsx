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
      {icon && <StIcon>{icon}</StIcon>}
      <StTitle>{title}</StTitle>
      {description && <StDescription>{description}</StDescription>}
    </StHeaderContainer>
  );
}

// ✨ 스타일 정의
const StHeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
`;

const StIcon = styled.div`
  font-size: 3rem; /* 아이콘 크기를 조금 키워 시원하게 */
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
  font-size: 1rem;
  color: #888;
  line-height: 1.6;
  white-space: pre-wrap; /* 줄바꿈(\n)도 자연스럽게 먹히도록 설정 */
`;

// 🖍️ 강조 텍스트용 컴포넌트 (부모에서 import해서 사용 가능)
export const StHighlight = styled.strong<{ $color?: "red" | "blue" }>`
  font-weight: 700;
  color: ${({ $color }) =>
    $color === "red" ? "#f87171" : $color === "blue" ? "#60a5fa" : "#333"};
`;
