"use client";

import styled from "styled-components";
import Typography from "@/components/common/Typography";
import ProjectCard from "./ProjectCard";

// ✅ 공통 핵심 스택 정의
const CORE_STACK = ["Next.js 14", "TypeScript", "Supabase", "Vercel"];

export default function ProjectSection() {
  return (
    <StProjectSection>
      <StSectionInner>
        {/* 섹션 타이틀 & 공통 스택 영역 */}
        <StHeaderGroup>
          <StSectionTitleWrapper>
            <Typography variant="h2" as="h2">
              🚀 Toy Projects
            </Typography>
          </StSectionTitleWrapper>

          {/* 🔹 공통 기술 스택 (상단 배치) */}
          <StCommonStackWrapper>
            <span className="label">Core Tech Stack :</span>
            <div className="badge-list">
              {CORE_STACK.map((tech) => (
                <StCoreBadge key={tech}>{tech}</StCoreBadge>
              ))}
            </div>
          </StCommonStackWrapper>
        </StHeaderGroup>

        <StProjectList>
          {/* 1. 약속 잡기 프로젝트 */}
          <ProjectCard
            title="황총무의 약속 잡기 (Hwang's Planner)"
            category="Service"
            period="2025.12.01 - 진행 중 (1인 개발)"
            linkUrl="/meeting"
            description={
              <>
                단톡방의 비효율적인 일정 조율 문제를 <b>&quot;소거법&quot;</b>
                으로 해결한 스케줄러입니다. 모두가 되는 날을 취합하는 대신,{" "}
                <b>&quot;안 되는 날&quot;을 먼저 지우는 역발상 UX</b>를 통해
                약속 확정 시간을 획기적으로 단축시켰습니다.
              </>
            }
            details={{
              problem:
                "다수 인원의 일정이 파편화되어 교집합(공통일)을 찾기 어렵고, 의사소통 비용이 과다하게 발생.",
              solution:
                "참여자들의 '불가능한 날짜'를 우선 제거하여 최적의 합의점을 빠르게 도출하는 소거 로직(Negative Selection) 적용.",
              tech: "date-fns를 활용한 3주치 동적 캘린더 생성 알고리즘 구현 및 메타태그 최적화(SEO)를 통한 검색 유입 확보.",
            }}
          />

          {/* 2. 습관 관리 프로젝트 */}
          <ProjectCard
            title="황총무의 습관 관리 (Hwang's Habit Tracker)"
            category="Service"
            period="2025.12.22 - 진행 중 (1인 개발)"
            linkUrl="/habit"
            description={
              <>
                작심삼일을 <b>&quot;잔디 심기&quot;</b>의 재미로 극복하는 습관
                트래커입니다. 목표를 달성할수록 <b>나만의 컬러</b>로 진하게
                물드는 달력을 보며, 하루의 노력을 직관적으로 확인하고 성취감을
                느낄 수 있습니다.
              </>
            }
            details={{
              problem:
                "텍스트 기반 체크리스트의 시각적 피드백 부족 및 월간 달성 흐름 파악의 한계.",
              solution:
                "활동 빈도를 색상 농도로 표현하는 히트맵(Heatmap) UI를 도입해 성취감을 시각화.",
              tech: "Context API로 전역 모달 시스템을 구축하고, 커스텀 훅으로 제어 로직을 추상화하여 재사용성 증대.",
            }}
          />

          {/* 3. N빵 계산기 프로젝트 */}
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
            details={{
              problem:
                "다자간 지출 내역 정리 시 발생하는 N:N 정산 로직의 복잡성 해결 필요.",
              solution:
                "최소 이체 경로를 파악해 송금 단계를 최적화하고, 결과를 시각화된 리포트로 제공.",
              tech: "핵심 기능인 '정산 계산'과 '데이터 저장'을 커스텀 훅으로 모듈화하여 관심사를 명확히 분리(SoC).",
            }}
          />
          {/* 4. 게임방 프로젝트 */}
          <ProjectCard
            title="황총무 게임방 (Hwang's Game Room)"
            category="Toy Project"
            period="2025.12 - 진행 중 (1인 개발)"
            linkUrl="/game"
            description={
              <>
                회식이나 모임 자리에서 계산자나 벌칙자를 정할 때 유용한{" "}
                <b>실시간 멀티플레이 웹 게임</b> 서비스입니다. 복잡한 앱 설치
                없이 <b>URL 링크 공유</b>만으로 누구나 쉽게 참여할 수 있으며,
                사다리 타기, 돌림판, 광클 대전 등 다양한 게임의 진행 상황이{" "}
                <b>참여자 전원에게 실시간 동기화</b>됩니다.
              </>
            }
            details={{
              problem:
                "오프라인 모임에서 빠르고 공정하게 내기(벌칙/정산)를 진행할 수 있는 접근성 높은 도구의 부재.",
              solution:
                "Supabase Realtime을 활용하여 별도 소켓 서버 구축 없이 참여자 간 게임 상태를 0.1초 단위로 동기화.",
              tech: "Canvas API로 사다리/돌림판을 직접 드로잉하고, DB 구독(Subscription) 모델을 통해 실시간 인터랙션 최적화.",
            }}
          />
        </StProjectList>
      </StSectionInner>
    </StProjectSection>
  );
}

// ✨ 스타일 정의

const StProjectSection = styled.section`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 5rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StSectionInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const StHeaderGroup = styled.div`
  margin-bottom: 3rem;
  /* 모바일에서는 세로, PC에서는 가로/세로 자유롭게 배치 */
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StSectionTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/* 공통 기술 스택 영역 스타일 */
const StCommonStackWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  .label {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};
    margin-right: 0.25rem;
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

/* 코어 뱃지 스타일 (일반 뱃지보다 조금 더 강조됨) */
const StCoreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray500};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
`;

const StProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;
