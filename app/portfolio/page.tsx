"use client";

import styled from "styled-components";
import Typography from "@/components/common/Typography";
import PortfolioInfo from "./PortfolioInfo";
import ResumeSection from "./ResumeSection";
import ProjectSection from "./project/ProjectSection";

export default function PortfolioPage() {
  return (
    <StContainer>
      {/* 1. 헤더 (프로필) */}
      <PortfolioInfo />

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

const StFooter = styled.footer`
  padding: 2.5rem 0;
`;
