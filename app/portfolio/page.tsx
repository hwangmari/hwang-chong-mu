"use client";

import styled from "styled-components";
import PortfolioHero from "./PortfolioHero";
import Introduction from "./Introduction";
import CareerBoard from "./CareerBoard";
import CareerRibbon from "./CareerRibbon";
import SignatureProjects from "./SignatureProjects";
import SkillsSection from "./SkillsSection";
import ProjectSection from "./project/ProjectSection";
import PortfolioOutro from "./PortfolioOutro";
import { CareerFocusProvider } from "./CareerFocusContext";
import { Reveal } from "./motion";

export default function PortfolioPage() {
  return (
    <CareerFocusProvider>
      {/* 첫 렌더에서 화면 전체가 부드럽게 밝아진다 — 뒤이어 오는 첫 화면 연출의 시작점 */}
      <StContainer>
        {/* 1. 첫 화면 — 누구인지, 숫자, 커리어 리본 */}
        <PortfolioHero />

        {/* 2. 소개 글 */}
        <StAboutBand>
          <StAboutInner>
            <Reveal>
              <Introduction showTitle={false} />
            </Reveal>
          </StAboutInner>
        </StAboutBand>

        {/* 3. 경력 — 위에 커리어 띠가 붙어 있고, 스크롤하면 헤더 아래에 고정된 채 회사 카드를 따라간다 (2026-09-14) */}
        <StCareerZone>
          <StRibbonSticky data-career-sticky>
            <StRibbonInner>
              <CareerRibbon />
            </StRibbonInner>
          </StRibbonSticky>
          <CareerBoard />
        </StCareerZone>

        {/* 4. 대표 프로젝트 3개 */}
        <SignatureProjects />

        {/* 5. 일하는 방식과 기술 */}
        <SkillsSection />

        {/* 6. 토이 프로젝트 */}
        <ProjectSection />

        {/* 7. 학력 · 연락처 */}
        <PortfolioOutro />
      </StContainer>
    </CareerFocusProvider>
  );
}

const StContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;

  &::selection {
    background-color: ${({ theme }) => theme.colors.amber200};
  }

`;

const StAboutBand = styled.section`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.6rem 0 1.8rem;
`;

const StAboutInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0 1.15rem;
  }
`;

/* 커리어 띠 + 경력 카드 묶음. 띠는 이 묶음이 화면에 있는 동안만 위에 붙는다 */
const StCareerZone = styled.div`
  position: relative;
`;

const StRibbonSticky = styled.div`
  position: sticky;
  top: 3.5rem; /* 전역 헤더 높이 */
  z-index: 8;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;

const StRibbonInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0.6rem 1.5rem 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0.5rem 1.15rem 0.6rem;
  }
`;
