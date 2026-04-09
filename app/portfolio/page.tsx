"use client";

import styled from "styled-components";
import { Typography } from "@hwangchongmu/ui";
import PortfolioInfo from "./PortfolioInfo";
import ResumeSection from "./ResumeSection";
import ProjectSection from "./project/ProjectSection";
export default function PortfolioPage() {
  return (
    <StContainer>
      {/* 1. 헤더 (프로필) */}
      <PortfolioInfo />

      <StDivider />

      {/* 1.5 핵심 역량 요약 */}
      <StHighlightSection>
        <StHighlightGrid>
          <StHighlightCard>
            <StHighlightIcon>🧱</StHighlightIcon>
            <StHighlightTitle>견고한 마크업</StHighlightTitle>
            <StHighlightDesc>
              IE6 시절부터 쌓아온 크로스브라우징 경험으로 어떤 환경에서도 안정적인
              UI를 구현합니다.
            </StHighlightDesc>
          </StHighlightCard>
          <StHighlightCard>
            <StHighlightIcon>⚛️</StHighlightIcon>
            <StHighlightTitle>프론트엔드 전문성</StHighlightTitle>
            <StHighlightDesc>
              React, Next.js, TypeScript 기반의 모던 프론트엔드 개발에 능숙하며,
              Svelte, Angular 등 다양한 프레임워크 경험을 보유하고 있습니다.
            </StHighlightDesc>
          </StHighlightCard>
          <StHighlightCard>
            <StHighlightIcon>🎨</StHighlightIcon>
            <StHighlightTitle>디자인 감각</StHighlightTitle>
            <StHighlightDesc>
              서양화 전공의 시각적 감각을 바탕으로 디자이너와 긴밀히 협업하며,
              픽셀 단위의 디테일까지 놓치지 않습니다.
            </StHighlightDesc>
          </StHighlightCard>
          <StHighlightCard>
            <StHighlightIcon>🤝</StHighlightIcon>
            <StHighlightTitle>팀 시너지</StHighlightTitle>
            <StHighlightDesc>
              기획의 의도와 UX 가치를 깊이 이해하며, 기획자 및 디자이너와 소통을
              통해 더 나은 결과물을 만들어냅니다.
            </StHighlightDesc>
          </StHighlightCard>
        </StHighlightGrid>
      </StHighlightSection>

      <StDivider />

      {/* 2. 이력서 섹션 */}
      <ResumeSection />

      {/* 3. 프로젝트 섹션 */}
      <ProjectSection />

      {/* 4. 푸터 */}
      <StFooter>
        <Typography variant="caption" color="gray400" align="center">
          © 2025 Hwang Hye kyeong. All rights reserved.
        </Typography>
      </StFooter>
    </StContainer>
  );
}

const StContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;

  &::selection {
    background-color: ${({ theme }) => theme.colors.yellow400};
  }
`;

const StDivider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StHighlightSection = styled.section`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;

const StHighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

const StHighlightCard = styled.div`
  padding: 1.5rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StHighlightIcon = styled.div`
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
`;

const StHighlightTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const StHighlightDesc = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.6;
`;

const StFooter = styled.footer`
  padding: 2.5rem 0;
`;
