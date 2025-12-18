"use client";

import styled from "styled-components";
import Typography from "@/components/common/Typography";
import PortfolioInfo from "./PortfolioInfo";
import ProjectCard from "./ProjectCard";
import ResumeSection from "./ResumeSection";

export default function PortfolioPage() {
  return (
    <StPageContainer>
      {/* 1. 헤더 (프로필) */}
      <PortfolioInfo />

      <StDivider />

      {/* 2. 이력서 섹션 */}
      <ResumeSection />

      {/* 3. 프로젝트 섹션 */}
      <StProjectSection>
        <StSectionInner>
          {/* Typography는 로직 컴포넌트이므로 St 안 붙임 */}
          <StSectionTitleWrapper>
            <Typography variant="h2" as="h2">
              🚀 Toy Projects
            </Typography>
          </StSectionTitleWrapper>

          <StProjectList>
            <ProjectCard
              title="황총무의 약속 잡기 (Hwang's Planner)"
              category="Service"
              period="2025.12.01 - 진행 중 (1인 개발)"
              linkUrl="/meeting"
              description={
                <>
                  단톡방에서 약속 날짜를 잡을 때 발생하는{" "}
                  <b>&quot;무한 되묻기&quot;</b> 문제를 해결하기 위해 개발한{" "}
                  <b>소거법 기반 스케줄러</b>입니다. &apos;되는 날&apos;을 찾는
                  대신 &apos;안 되는 날&apos;을 제거하는 역발상 UX로 약속 확정
                  시간을 단축시켰습니다.
                </>
              }
              techStack={[
                "Next.js 14",
                "TypeScript",
                "Tailwind CSS",
                "Supabase",
                "Vercel",
                "Google AdSense",
              ]}
              details={{
                problem:
                  "다수 인원의 일정 조율 시, 긍정 응답(되는 날)만으로는 교집합을 찾기 어렵고 시간이 오래 걸림.",
                solution:
                  "불가능한 날짜(Unavailable Dates)를 우선 소거하여 남는 날짜를 도출하는 로직 구현.",
                tech: "3주치 동적 캘린더 알고리즘 구현 (date-fns), SEO 최적화를 통한 애드센스 승인.",
              }}
            />
          </StProjectList>
        </StSectionInner>
      </StProjectSection>

      {/* 4. 푸터 */}
      <StFooter>
        <Typography variant="caption" color="gray400" align="center">
          © 2025 Hwang Hye kyeong. All rights reserved.
        </Typography>
      </StFooter>
    </StPageContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스 적용)

const StPageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* 드래그 시 하이라이트 색상 */
  &::selection {
    background-color: ${({ theme }) => theme.colors.yellow200};
  }
`;

const StDivider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StProjectSection = styled.section`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 5rem 0; /* py-20 */
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StSectionInner = styled.div`
  max-width: 56rem; /* max-w-4xl */
  margin: 0 auto;
  padding: 0 1.5rem; /* px-6 */
`;

const StSectionTitleWrapper = styled.div`
  margin-bottom: 2.5rem; /* mb-10 */
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem; /* space-y-12 */
`;

const StFooter = styled.footer`
  padding: 2.5rem 0; /* py-10 */
`;
