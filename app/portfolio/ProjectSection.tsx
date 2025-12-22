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
          {/* 1. 약속 잡기 프로젝트 */}
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

          {/* ✅ 2. 습관 관리 프로젝트 (추가됨!) */}
          <ProjectCard
            title="황총무의 습관 관리 (Hwang's Habit Tracker)"
            category="Service"
            period="2025.12.22 - 진행 중 (1인 개발)"
            linkUrl="/habit"
            description={
              <>
                작심삼일로 끝나는 습관을 <b>&quot;잔디 심기&quot;</b>의 시각적
                즐거움으로 지속하게 만드는 <b>게이미피케이션 습관 트래커</b>
                입니다. 달력의 날짜가 목표 달성률에 따라 <b>나만의 테마 컬러</b>
                로 진하게 물들어가는 과정을 통해, 성취감을 직관적으로
                시각화했습니다.
              </>
            }
            techStack={[
              "Next.js 14",
              "TypeScript",
              "Styled Components",
              "Supabase",
              "date-fns",
            ]}
            details={{
              problem:
                "단순 체크리스트는 동기부여가 약하고, 한 달 전체의 성실함(흐름)을 한눈에 파악하기 어려움.",
              solution:
                "GitHub Contribution Graph에서 영감을 받은 '농도 캘린더' UI 구현 및 비밀번호 공유 방식을 통한 간편한 그룹 생성.",
              tech: "Context API를 활용한 전역 모달(Global Modal) 모듈화, 커스텀 훅(useModal) 설계를 통한 비즈니스 로직 분리.",
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
