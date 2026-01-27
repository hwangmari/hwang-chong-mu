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
} from "./ProjectSection.styled";
import { ProjectImage } from "@/components/common/ProjectImageViewer";

// ✅ 공통 핵심 스택 정의
const CORE_STACK = ["Next.js 14", "TypeScript", "Supabase", "Vercel"];

export default function ProjectSection() {
  // 1. 데이터를 페이지 레벨에서 정의 (혹은 API로 받아오기)
  const calendarImages: ProjectImage[] = [
    {
      src: "/images/calendar-preview.png",
      alt: "주간 뷰 화면",
    },
    // {
    //   src: "/images/calendar/detail-2.png",
    //   alt: "모바일 화면",
    //   className: "mobile-frame", // 모바일용 스타일 적용 가능
    //   width: 320,
    // },
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
          {/* 업무 캘린더 프로젝트*/}
          <ProjectCard
            title="황총무의 업무 캘린더"
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
              </>
            }
            details={{
              problem:
                "다수의 프로젝트가 병렬로 진행될 때 발생하는 일정 충돌과 리소스 파악의 어려움, 그리고 캘린더 내용을 일일이 텍스트로 옮겨 적어야 하는 비효율적인 보고 체계.",
              solution:
                "프로젝트별 세부 일정을 시각화하여 병목 구간을 사전에 발견하고, 캘린더 데이터를 '보고용 요약 텍스트'로 즉시 변환하는 기능을 구현해 커뮤니케이션 비용을 획기적으로 절감.",
              tech: "date-fns를 활용해 주/월 단위 캘린더 로직을 직접 구현하고, Drag & Drop 인터랙션으로 일정 수정의 사용성을 높임. Clipboard API를 활용해 데이터 포맷팅 최적화.",
            }}
            projectImages={calendarImages}
          />

          {/* 약속 잡기 */}
          <ProjectCard
            title="황총무의 약속 잡기 "
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
            historyLogs={[
              {
                ver: "v1.2",
                date: "26.01",
                content: "Next-SEO 적용 및 카카오톡 공유 프리뷰(OG Tag) 최적화",
              },
              {
                ver: "v1.1",
                date: "25.12",
                content:
                  "date-fns 연산 로직 Memoization으로 렌더링 성능 30% 개선",
              },
              {
                ver: "v1.0",
                date: "25.12",
                content:
                  "서비스 런칭 및 소거법(Negative Selection) 알고리즘 구현",
              },
            ]}
          />

          {/* 습관 관리 프로젝트 */}
          <ProjectCard
            title="황총무의 습관 관리 "
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

          {/* N빵 계산기 프로젝트 */}
          <ProjectCard
            title="황총무의 N빵 계산기 "
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
            title="황총무 게임방"
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
