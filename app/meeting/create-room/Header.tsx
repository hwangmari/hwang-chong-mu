"use client";

import styled from "styled-components";

export default function Header() {
  return (
    <StHeaderContainer>
      <StIcon>🐰</StIcon>
      <StTitle>황총무의 약속 잡기</StTitle>
      <StDescription>
        여러명이서 약속 잡기 힘드시죠? 황총무가 깔끔하게 정리해드려요!
        <br />
        소거법으로 <StHighlight $color="red">안 되는 날</StHighlight> 빼고{" "}
        <StHighlight $color="blue">되는 날</StHighlight>을 정해보세욥
        &apos;ㅅ&apos;/
      </StDescription>
    </StHeaderContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)
const StHeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem; /* mb-8 */
`;

const StIcon = styled.div`
  font-size: 1.25rem; /* text-xl */
  margin-bottom: 0.25rem;
`;

const StTitle = styled.h1`
  font-size: 1.25rem; /* text-xl */
  font-weight: 700; /* font-bold */
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 0.25rem; /* mb-1 */
`;

const StDescription = styled.p`
  font-size: 0.875rem; /* text-sm */
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.5;
`;

// 색상 강조용 컴포넌트 ($color prop으로 재사용)
const StHighlight = styled.strong<{ $color: "red" | "blue" }>`
  font-weight: 700;
  color: ${({ $color }) => ($color === "red" ? "#f87171" : "#60a5fa")};
  /* Tailwind red-400 / blue-400 색상값 직접 적용 */
`;
