"use client";

import styled from "styled-components";
import Typography from "@/components/common/Typography";
import ProjectCard from "./ProjectCard";

export default function ProjectSection() {
  return (
    <StProjectSection>
      <StSectionInner>
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
  );
}

// ✨ 스타일 정의 (St 프리픽스)

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
