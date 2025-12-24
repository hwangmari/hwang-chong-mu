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

          {/* 💸 3. N빵 계산기 프로젝트 (New!) */}
          <ProjectCard
            title="황총무의 N빵 계산기 (Hwang's Expense Splitter)"
            category="Service"
            period="2025.12.24 - 진행 중 (1인 개발)"
            linkUrl="/calc"
            description={
              <>
                여행 후 복잡하게 얽힌 영수증 정산을{" "}
                <b>최소 이체 경로 알고리즘</b>
                으로 가장 스마트하게 해결해주는 <b>여행 총무 비서 서비스</b>
                입니다. 누가 누구에게 얼마를 보내야 하는지{" "}
                <b>직관적인 카드 UI</b>로 시각화했으며, 별도 가입 없이{" "}
                <b>URL 링크 하나로</b> 정산 결과를 멤버들과 손쉽게 공유할 수
                있습니다.
              </>
            }
            techStack={[
              "Next.js 14",
              "TypeScript",
              "Styled Components",
              "Supabase",
              "Greedy Algorithm",
            ]}
            details={{
              problem:
                "여행 직후 수많은 지출 내역과 복잡한 이체 관계(A가 낸 돈, B가 낸 돈...)를 수기로 정리하다 보면 계산 실수가 잦고 스트레스가 발생함.",
              solution:
                "탐욕 알고리즘(Greedy Algorithm)을 적용해 송금 횟수를 최소화하고, '영수증 및 티켓' 메타포를 활용한 시각적 리포트 페이지 제공.",
              tech: "복잡한 계산 로직(useCalculator)과 데이터 영속성(useCalcPersistence)을 커스텀 훅으로 분리하여 비즈니스 로직의 응집도 강화.",
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
