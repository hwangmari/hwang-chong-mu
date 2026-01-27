"use client";

import Typography from "@/components/common/Typography";
import ProjectCard from "./ProjectCard";
import {
  StProjectSection,
  StSectionInner,
  StHeaderGroup,
  StSectionTitleWrapper,
  StCommonStackWrapper,
  StCoreBadge,
  StProjectList,
  StPhilosophyBox,
} from "./ProjectSection.styled";
import { ProjectImage } from "@/components/common/ProjectImageViewer";

// 상단에 정의된 스택 배열
const CORE_STACK = [
  "Gemini (Co-pilot)",
  "Next.js 14",
  "TypeScript",
  "Supabase",
  "Vercel",
];

export default function ProjectSection() {
  const scheduleImages: ProjectImage[] = [
    {
      src: "/images/toy_schedule.png",
      alt: "업무 캘린더 예시 화면", // alt 태그는 접근성을 위해 채워두는 것이 좋습니다
    },
  ];
  const habitImages: ProjectImage[] = [
    {
      src: "/images/toy_habit.png",
      alt: "습관 관리 예시 화면",
    },
  ];
  const dietImages: ProjectImage[] = [
    {
      src: "/images/toy_diet.png",
      alt: "체중 관리 예시 화면",
    },
  ];

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

          {/* 🔹 공통 기술 스택 */}
          <StCommonStackWrapper>
            <span className="label">Core Tech Stack :</span>
            <div className="badge-list">
              {CORE_STACK.map((tech) => (
                <StCoreBadge key={tech} $isAi={tech.includes("Gemini")}>
                  {tech}
                </StCoreBadge>
              ))}
            </div>
          </StCommonStackWrapper>

          {/* 🔹 [NEW] 개발 철학 및 시너지 강조 영역 */}
          <StPhilosophyBox>
            <p className="catchphrase">
              &quot;Directed by Human, Crafted with AI.&quot;
            </p>
            <p className="description">
              이 프로젝트들은 <b>Gemini</b>를 단순한 코드 생성기가 아닌,{" "}
              <b>Pair Programmer</b>로 활용하여 개발 생산성을 극대화한
              결과물입니다.
              <br />
              <br />
              서비스의 <b>기획과 디자인, 컴포넌트 아키텍처 설계</b>는{" "}
              <b>개발자의 명확한 의도</b>하에 구조화되었으며,
              <br />
              AI와의 협업을 통해 복잡한 로직 구현과 최적화 과정을 효율적으로
              수행했습니다.
            </p>
          </StPhilosophyBox>
        </StHeaderGroup>

        <StProjectList>
          {/* 업무 캘린더 프로젝트*/}
          <ProjectCard
            title="업무 캘린더"
            period="2026.01 - 진행 중 (1인 개발)"
            linkUrl="/schedule"
            description={
              <>
                중복되는 업무 일정과 <b>&quot;리소스 현황&quot;</b>을 한눈에
                파악하는 <b>올인원 프로젝트 캘린더</b>입니다.
                <br />
                복잡한 배포 일정과 이슈를 <b>직관적인 타임라인</b>으로 관리하고,
                <b>&quot;클릭 한 번으로&quot;</b> 보고용 텍스트를 생성해{" "}
                <b>업무 효율</b>을 극대화했습니다.
                <br />
                실무 사용중으로 관계자 모드입니다.
              </>
            }
            details={{
              problem:
                "다수의 프로젝트가 병렬로 진행될 때 발생하는 일정 충돌과 리소스 파악의 어려움, 그리고 캘린더 내용을 일일이 텍스트로 옮겨 적어야 하는 비효율적인 보고 체계.",
              solution:
                "프로젝트별 세부 일정을 시각화하여 병목 구간을 사전에 발견하고, 캘린더 데이터를 '보고용 요약 텍스트'로 즉시 변환하는 기능을 구현해 커뮤니케이션 비용을 획기적으로 절감.",
              tech: "date-fns를 활용해 주/월 단위 캘린더 로직을 직접 구현하고, Drag & Drop 인터랙션으로 일정 수정의 사용성을 높임. Clipboard API를 활용해 데이터 포맷팅 최적화.",
            }}
            projectImages={scheduleImages}
          />

          {/* 약속 잡기 */}
          <ProjectCard
            title="약속 잡기 "
            period="2025.12.01 - 진행 중 (1인 개발)"
            linkUrl="/meeting"
            description={
              <>
                단톡방의 비효율적인 일정 조율 문제를 <b>&quot;소거법&quot;</b>
                으로 해결한 스케줄러입니다. <br />
                모두가 되는 날을 취합하는 대신,{" "}
                <b>&quot;안 되는 날&quot;을 먼저 지우는 역발상 UX</b>를 통해
                약속 확정 시간을 획기적으로 단축시켰습니다.
              </>
            }
            details={{
              problem:
                "N명의 일정이 파편화된 단톡방에서 '교집합'을 찾기 위해 발생하는 불필요한 의사소통 비용과 인지적 피로감을 해소하고자 기획했습니다.",
              solution:
                "모두가 되는 날을 취합하는 기존 방식 대신, '안 되는 날'을 우선 소거하는 역발상(Negative Selection) 로직을 설계하여 의사결정 시간을 획기적으로 단축했습니다.",
              tech: "date-fns 기반의 배열 연산 최적화로 즉각적인 반응성을 확보하고, Next-SEO를 도입해 URL 공유 시점의 UX(미리보기)까지 세심하게 고려했습니다.",
            }}
            logicSteps={[]}
          />

          {/* 습관 관리 프로젝트 */}
          <ProjectCard
            title="습관 관리 "
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
            projectImages={habitImages}
          />

          {/* 체중 관리 프로젝트 */}
          <ProjectCard
            title="체중 관리"
            period="2026.01 - 진행 중 (1인 개발)"
            linkUrl="/diet"
            description={
              <>
                체중 감량의 핵심인 <b>&quot;밤사이 소화율&quot;</b>에 집중한
                다이어트 트래커입니다. <br />
                아침과 저녁의 체중 차이를 <b>시각적인 차트</b>로 분석해
                제공하며, 단순한 기록을 넘어 <b>내 몸의 대사 효율</b>을
                직관적으로 파악할 수 있습니다.
              </>
            }
            details={{
              problem:
                "단순한 체중 기록만으로는 식단과 수면이 체중 변화에 미치는 인과관계를 파악하기 어렵고, 꾸준한 동기 부여가 힘듦.",
              solution:
                "저녁 식사 후 다음 날 아침까지의 '감량폭'을 핵심 지표로 시각화하여, 수면과 공복의 중요성을 인지시키는 피드백 루프 설계.",
              tech: "Recharts 라이브러리를 커스터마이징하여 체중 변화 추이를 직관적인 그래프로 표현하고, 데이터 시각화의 반응성을 최적화.",
            }}
            projectImages={dietImages}
          />

          {/* N빵 계산기 프로젝트 */}
          <ProjectCard
            title="N빵 계산기 "
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
          {/* 게임방 프로젝트 */}
          <ProjectCard
            title="게임방"
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
