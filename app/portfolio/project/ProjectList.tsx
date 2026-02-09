"use client";

import { ProjectImage } from "@/components/common/ProjectImageViewer";
import ProjectCard from "./ProjectCard";
import { StDetailList, StProjectList } from "./ProjectSection.styled";

export default function ProjectList() {
  const scheduleImages: ProjectImage[] = [
    {
      src: "/images/toy_schedule.png",
      alt: "업무 캘린더 예시 화면",
    },
    {
      src: "/images/toy_schedule2.png",
      alt: "업무 캘린더 칸반보드 예시 화면",
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
    <StProjectList>
      {/* 업무 캘린더 프로젝트 */}
      <ProjectCard
        title="업무 캘린더"
        period="2026.01 - 진행 중 (1인 개발)"
        linkUrl="/schedule"
        description={
          <>
            중복되는 업무 일정과 <b>&quot;리소스 현황&quot;</b>을 한눈에
            관리하기 위해 <b>직접 기획·개발</b>한 내부용 캘린더입니다.
            <br />
            배포 일정과 이슈를 <b>타임라인</b>으로 시각화하고{" "}
            <b>&quot;원클릭 보고용 텍스트&quot;</b>로 변환해 실무 효율을
            높였습니다.
            <br />
            현재 <b>실무에서 직접 사용 중</b>인 관계자 전용 서비스입니다.
          </>
        }
        details={{
          problem: (
            <>
              여러 프로젝트가 병렬로 진행되는 환경에서 반복되는 비효율이
              있었습니다.
              <StDetailList>
                <li>
                  다수 프로젝트의 <b>일정 충돌</b> 및 리소스 가시성 부족
                </li>
                <li>
                  캘린더 내용을 일일이 텍스트로 옮겨 적어야 하는{" "}
                  <b>수기 보고 체계</b>
                </li>
                <li>일정별 이슈가 분산되어 트래킹이 어려움</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>시각화와 자동화</b>로 관리 및 커뮤니케이션 비용을 줄였습니다.
              <StDetailList>
                <li>
                  프로젝트별 타임라인으로 <b>병목/충돌 구간 사전 발견</b>
                </li>
                <li>
                  캘린더 데이터를{" "}
                  <b>&apos;보고용 요약 텍스트&apos;로 즉시 변환</b>하여 보고
                  시간 단축
                </li>
                <li>일정별 메모/이슈 기록으로 흐름 추적</li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>date-fns</b>를 활용해 주/월 단위 캘린더 로직 직접 설계 및
                  구현
                </li>
                <li>
                  <b>Drag & Drop</b> 인터랙션으로 일정 수정 및 재배치 사용성
                  개선
                </li>
                <li>
                  <b>Clipboard API</b>로 보고용 텍스트 자동 포맷팅
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.0.2",
            date: "2026.02.09",
            content:
              "업무 캘린더에 칸반보드 기능 추가로 일정 기반 업무 상태를 한눈에 관리",
          },
          {
            ver: "1.0.1",
            date: "2026.02.02",
            content:
              "완료 업무 가시성 개선: 체크 시 타임라인에서 즉시 숨김(눈감기) 처리 및 별도 완료 리스트를 통한 아카이브 조회(눈뜨기) 기능 구현",
          },
        ]}
        projectImages={scheduleImages}
      />

      {/* 약속 잡기 */}
      <ProjectCard
        title="약속 잡기"
        period="2025.12.01 - 진행 중 (1인 개발)"
        linkUrl="/meeting"
        description={
          <>
            단톡방의 비효율적인 일정 조율을{" "}
            <b>&quot;소거법(Negative Selection)&quot;</b>으로 해결한 스케줄링
            서비스입니다.
            <br />
            &apos;모두 가능한 날&apos;을 찾기보다{" "}
            <b>&quot;안 되는 날을 먼저 지우는&quot; UX</b>로 확정 시간을
            단축했습니다.
          </>
        }
        details={{
          problem: (
            <>
              N명의 일정이 파편화된 단체 채팅방에서는 다음 문제가 반복됩니다.
              <StDetailList>
                <li>교집합을 찾기 위한 불필요한 메시지 왕복</li>
                <li>일정 확인 과정의 인지적 피로</li>
                <li>결정 지연으로 인한 스트레스</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              관성적으로 가능한 날을 모으는 방식 대신,{" "}
              <b>&apos;안 되는 날&apos;을 우선적으로 제거</b>하는 로직을
              설계했습니다.
              <StDetailList>
                <li>
                  <b>최소한의 입력(터치)</b>만으로 참여 가능한 직관적 UX
                </li>
                <li>선택지 축소에 따라 의사결정 속도가 빨라지는 흐름 유도</li>
                <li>
                  결과적으로 <b>일정 확정 시간(Time-to-Decision)</b>을 단축
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>date-fns 기반 연산 최적화로 일정 처리 반응성 확보</li>
                <li>
                  Next-SEO 적용으로 링크 공유 시 미리보기(제목·설명)까지 고려한
                  UX 설계
                </li>
                <li>
                  일정 공유가 잦은 서비스 특성에 맞춰 URL 중심의 접근성 강화
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.0.1",
            date: "2026.02.06",
            content: "약속 완료 후 N빵 계산 정산하기 방 연동",
          },
        ]}
      />

      {/* N빵 계산기 프로젝트 */}
      <ProjectCard
        title="N빵 계산기"
        period="2025.12.24 - 진행 중 (1인 개발)"
        linkUrl="/calc"
        description={
          <>
            여행 후 복잡하게 얽힌 영수증 정산을 <b>최소 이체 경로 알고리즘</b>
            으로 가장 스마트하게 해결해주는 <b>여행 총무 비서 서비스</b>
            입니다. <br />
            누가 누구에게 얼마를 보내야 하는지 <b>직관적인 카드 UI</b>로
            시각화했으며, 별도 가입 없이 <b>URL 링크 하나로</b> 정산 결과를
            멤버들과 손쉽게 공유할 수 있습니다.
          </>
        }
        details={{
          problem: (
            <>
              여행 후 정산 과정에서 발생하는 복잡한 N:N 송금 구조를 단순화할
              필요가 있었습니다.
              <StDetailList>
                <li>누가 누구에게 보내야 할지 헷갈리는 복잡한 이체 경로</li>
                <li>엑셀이나 수기 계산 시 발생하는 잦은 오류와 불편함</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>최소 이체 경로 알고리즘</b>을 적용하여 송금 횟수를 최소화하고
              경험을 개선했습니다.
              <StDetailList>
                <li>
                  복잡한 거래 내역을 분석해 <b>최적의 송금 경로</b> 도출
                </li>
                <li>
                  계산 결과를 <b>직관적인 카드 UI</b> 리포트로 시각화하여 공유
                  편의성 증대
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  핵심 기능인 &apos;정산 계산&apos;과 &apos;데이터 저장&apos;을{" "}
                  <b>Custom Hook</b>으로 모듈화
                </li>
                <li>
                  로직과 UI를 철저히 분리(SoC)하여 유지보수성과 테스트 용이성
                  확보
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.0.1",
            date: "2026.02.06",
            content:
              "정산 가시성 및 공유 편의성 개선: 합계 세부 내역 아코디언 UI 제공으로 정산 정확도 확인 기능 구현 및 카카오톡 공유하기 기능 추가",
          },
        ]}
      />

      {/* 습관 관리 프로젝트 */}
      <ProjectCard
        title="습관 관리"
        period="2025.12.22 - 진행 중 (1인 개발)"
        linkUrl="/habit"
        description={
          <>
            작심삼일을 <b>&quot;잔디 심기&quot;</b>의 재미로 극복하는 습관
            트래커입니다. <br /> 목표를 달성할수록 <b>나만의 컬러</b>로 진하게
            물드는 달력을 보며, 하루의 노력을 직관적으로 확인하고 성취감을 느낄
            수 있습니다.
          </>
        }
        details={{
          problem: (
            <>
              텍스트 기반 체크리스트만으로는 지속적인 동기 부여가 어렵습니다.
              <StDetailList>
                <li>
                  체크 여부만으로는 부족한 <b>시각적 피드백</b>
                </li>
                <li>월간 흐름과 성실도를 한눈에 보기 어려운 UI 구조</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              개발자들에게 익숙한 <b>GitHub 기여도 그래프(Heatmap)</b>에서
              아이디어를 얻어 해결책을 설계했습니다.
              <StDetailList>
                <li>
                  활동 빈도를 <b>색상 농도</b>로 표현하여 성취감을 직관적 시각화
                </li>
                <li>
                  &apos;잔디 심기&apos;라는 게이미피케이션 요소를 도입해
                  지속적인 참여 유도
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>Context API</b>로 전역 모달 시스템을 구축하여 UI 일관성
                  유지
                </li>
                <li>
                  달력 로직과 상태 관리를 <b>Custom Hook</b>으로 추상화하여 코드
                  재사용성 증대
                </li>
              </StDetailList>
            </>
          ),
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
            아침과 저녁의 체중 차이를 <b>시각적인 차트</b>로 분석해 제공하며,
            단순한 기록을 넘어 <b>내 몸의 대사 효율</b>을 직관적으로 파악할 수
            있습니다.
          </>
        }
        details={{
          problem: (
            <>
              체중 숫자만 기록하는 방식은 인과관계 파악이 어렵고 동기 부여가
              약했습니다.
              <StDetailList>
                <li>식단/수면이 체중 변화에 미치는 영향 파악의 어려움</li>
                <li>숫자 변화에 일희일비하게 되는 심리적 피로감</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>&apos;밤사이 감량폭(소화율)&apos;</b>이라는 핵심 지표를
              발굴하여 새로운 피드백 루프를 설계했습니다.
              <StDetailList>
                <li>
                  저녁 식사 후 다음 날 아침까지의 변화를 시각화하여{" "}
                  <b>공복의 중요성</b> 인지
                </li>
                <li>
                  단순 기록이 아닌, <b>내 몸의 데이터</b>를 분석하는 대시보드
                  형태 제공
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>Recharts 라이브러리</b>를 커스터마이징하여 체중 변화 추이를
                  직관적 그래프로 표현
                </li>
                <li>
                  시각화 반응성을 최적화해 모바일 환경에서도 쾌적한 UX 제공
                </li>
              </StDetailList>
            </>
          ),
        }}
        projectImages={dietImages}
      />

      {/* 게임방 프로젝트 */}
      <ProjectCard
        title="게임방"
        period="2025.12 - 진행 중 (1인 개발)"
        linkUrl="/game"
        description={
          <>
            회식이나 모임 자리에서 계산자나 벌칙자를 정할 때 유용한{" "}
            <b>실시간 멀티플레이 웹 게임</b> 서비스입니다. <br />
            복잡한 앱 설치 없이 <b>URL 링크 공유</b>만으로 누구나 쉽게 참여할 수
            있으며, <br />
            사다리 타기, 돌림판, 광클 대전 등 다양한 게임의 진행 상황이{" "}
            <b>참여자 전원에게 실시간 동기화</b>됩니다.
          </>
        }
        details={{
          problem: (
            <>
              오프라인 모임에서 빠르고 공정하게 내기(벌칙/정산)를 진행할 도구가
              부족했습니다.
              <StDetailList>
                <li>특정 앱을 모두가 설치해야 하는 번거로움 (낮은 접근성)</li>
                <li>한 명의 폰으로 돌려가며 진행할 때의 루즈함과 조작 의심</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>별도 설치 없는 웹 기반</b> 환경과 <b>실시간 동기화</b> 기술로
              문제를 해결했습니다.
              <StDetailList>
                <li>
                  <b>URL 링크 공유</b>만으로 즉시 참여 가능한 높은 접근성
                </li>
                <li>
                  모든 참여자의 화면이 0.1초 단위로 동기화되는{" "}
                  <b>리얼타임 인터랙션</b> 구현
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>Supabase Realtime</b>을 활용해 별도 소켓 서버 없이 실시간
                  동기화 구현
                </li>
                <li>
                  <b>Canvas API</b>를 활용해 사다리/돌림판 애니메이션을 직접
                  드로잉 및 최적화
                </li>
                <li>
                  DB 구독(Subscription) 모델을 통해 서버 부하를 줄이면서 반응성
                  확보
                </li>
              </StDetailList>
            </>
          ),
        }}
      />
    </StProjectList>
  );
}
