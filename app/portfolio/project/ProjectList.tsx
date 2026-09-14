"use client";

import { ProjectImage } from "@/components/common/ProjectImageViewer";
import ProjectCard from "./ProjectCard";
import { StDetailList, StProjectList } from "./ProjectSection.styled";
import ToySpotlight from "./ToySpotlight";

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
  const tennisImages: ProjectImage[] = [
    {
      src: "/images/toy_tennis.png",
      alt: "테니스 대회 예시 화면",
    },
  ];
  const overtimeImages: ProjectImage[] = [
    {
      src: "/images/toy_overtime.png",
      alt: "야근 계산기 예시 화면",
    },
  ];
  const giftLogImages: ProjectImage[] = [
    {
      src: "/images/toy_giftlog.png",
      alt: "경조사비 장부 예시 화면",
    },
  ];

  return (
    <ToySpotlight>
    <StProjectList>
      {/* 내 서비스 요약(통합 대시보드) 프로젝트 */}
      <ProjectCard
        anchorId="toy-my"
        title="내 서비스 요약"
        period="2026.08 - 진행 중 (1인 개발)"
        linkUrl="/my"
        description={
          <>
            흩어져 있던 서비스를 <b>하나의 계정</b>으로 연동하면, 오늘·이번 주
            현황을 <b>한 화면에서 모아 보는 통합 대시보드</b>입니다.
            <br />
            가계부·운동·습관·체중 요약 위젯과 진행 중인 약속방·정산방을 한곳에
            모으고, 위젯에서 바로 <b>빠른 등록</b>까지 할 수 있게 했습니다.
          </>
        }
        details={{
          problem: (
            <>
              서비스가 늘어날수록 &quot;내 현황&quot;을 확인하러 매번 각
              페이지를 돌아다녀야 했습니다.
              <StDetailList>
                <li>서비스마다 별도의 입장 코드/URL로 접근해 진입점이 분산</li>
                <li>오늘 습관·지출·체중 같은 핵심 수치를 한눈에 볼 수 없음</li>
                <li>참여 중인 약속방·정산방 링크를 잃어버리기 쉬움</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>통합 로그인 + 서비스 연동 + 요약 위젯</b>을 하나의 흐름으로
              묶었습니다.
              <StDetailList>
                <li>계정에 서비스 리소스를 연결하면 요약 위젯이 자동 구성</li>
                <li>
                  위젯은 개별 격리되어 한 서비스 장애가 전체 화면에 영향 없음
                </li>
                <li>우클릭 빠른 등록으로 페이지 이동 없이 기록 추가</li>
                <li>PC는 넓은 그리드, 모바일은 단일 컬럼으로 반응형 구성</li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  Next.js Route Handler 기반 세션 인증과 서비스 링크/방 관리
                  API(`/api/auth/*`)
                </li>
                <li>
                  서비스별 요약 쿼리를 <code>services/homeSummary</code>로
                  모아 컴포넌트의 Supabase 직접 접근을 차단(ESLint 제약)
                </li>
                <li>
                  공통 <code>useWidgetLoader</code> 훅으로 loading / ready /
                  empty / error 상태를 위젯마다 독립 관리
                </li>
              </StDetailList>
            </>
          ),
        }}
      />

      {/* 업무 캘린더 프로젝트 */}
      <ProjectCard
        anchorId="toy-schedule"
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
        anchorId="toy-meeting"
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
            ver: "1.0.4",
            date: "2026.04.08",
            content:
              "방 생성 시 참여 멤버 사전등록, 참여현황 수정·삭제 버튼 상시 노출로 UX 개선",
          },
          {
            ver: "1.0.3",
            date: "2026.04.08",
            content:
              "투표 마감 후 선호 날짜 투표 기능 추가, 마감 상태 DB 공유, 장소잡기(/place) 연동 및 멤버 자동 연결",
          },
          {
            ver: "1.0.2",
            date: "2026.04.08",
            content:
              "투표 기간 조정 기능 추가, 헤더 UI 정리(타이틀+공유/기간+마감 2단 구성), 달력에 법정공휴일·근로자의날 표시",
          },
          {
            ver: "1.0.1",
            date: "2026.02.06",
            content: "약속 완료 후 N빵 계산 정산하기 방 연동",
          },
        ]}
      />

      {/* 장소잡기 */}
      <ProjectCard
        anchorId="toy-place"
        title="장소잡기"
        period="2025.12.15 - 진행 중 (1인 개발)"
        linkUrl="/place"
        description={
          <>
            약속 날짜가 정해진 뒤{" "}
            <b>네이버 지역 검색 API</b>를 활용해 후보 장소를 등록하고,
            참여자들이 <b>복수 투표</b>로 선호 장소를 결정하는 서비스입니다.
            <br />
            약속잡기에서 확정된 멤버가 <b>자동으로 연동</b>되어 별도 이름 입력 없이
            바로 투표에 참여할 수 있습니다.
          </>
        }
        details={{
          problem: (
            <>
              약속 날짜를 정한 뒤 장소 선정에서 다시 의견 수렴이 필요했습니다.
              <StDetailList>
                <li>단체 채팅방에서 장소 후보를 텍스트로 나열하면 비교가 어려움</li>
                <li>각 장소의 위치·카테고리 정보를 일일이 검색해야 하는 번거로움</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>네이버 지역 검색 연동</b>으로 후보 등록을 간소화하고,
              투표 기반 의사결정을 지원했습니다.
              <StDetailList>
                <li>
                  검색 결과에서 장소를 선택해 <b>카테고리·주소·지도 링크</b>와 함께 자동 등록
                </li>
                <li>
                  약속잡기 멤버 <b>자동 연동</b>으로 이름 재입력 없이 투표
                </li>
                <li>
                  실시간 투표 현황과 <b>득표율 시각화</b>로 합의 도출 가속
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>네이버 Local Search API</b> 프록시를 통한 서버사이드 검색
                </li>
                <li>
                  약속잡기 participants 테이블과 <b>meeting_room_id</b>로 멤버 연동
                </li>
                <li>
                  <b>slug + short_code</b> 기반 공유 친화적 URL 구조
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.1.0",
            date: "2026.04.08",
            content:
              "라우트 /dinner → /place 변경, 약속잡기 멤버 자동 연동, slug URL 공유 지원, 공유 버튼 추가",
          },
        ]}
      />

      {/* N빵 계산기 프로젝트 */}
      <ProjectCard
        anchorId="toy-calc"
        title="여행 경비 계산기"
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

      <ProjectCard
        anchorId="toy-account-book"
        title="가계부"
        period="2026.03 - 진행 중 (1인 개발)"
        linkUrl="/account-book"
        description={
          <>
            개인 기록과 공용 정산을 한 흐름으로 연결한 <b>생활형 가계부
            서비스</b>입니다. <br />
            혼자 쓰는 개인 가계부에서 먼저 내역을 정리하고, 필요한 항목만{" "}
            <b>공용방에 공유</b>할 수 있도록 설계해 실제 생활비 관리 방식에 더
            가깝게 만들었습니다.
            <br />
            직접 입력뿐 아니라 <b>문장 등록, 이미지 등록, 리스트/캘린더/보드
            뷰</b>까지 제공해 기록과 확인 과정을 모두 줄였습니다.
          </>
        }
        details={{
          problem: (
            <>
              기존 가계부는 개인 기록과 함께 쓰는 정산 흐름이 분리되어 있어
              생활비 관리가 번거로웠습니다.
              <StDetailList>
                <li>
                  혼자 적는 내역과 같이 보는 내역이 섞여 <b>관리 기준이
                  불명확</b>
                </li>
                <li>
                  메신저로 다시 공유하거나 따로 정리해야 하는{" "}
                  <b>이중 입력 부담</b>
                </li>
                <li>
                  월별 흐름, 날짜별 확인, 항목 비교를 한 화면에서 보기 어려운
                  구조
                </li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>개인방과 공용방을 분리</b>하되 연결 가능한 구조로 바꿔 실제
              사용 흐름에 맞췄습니다.
              <StDetailList>
                <li>
                  개인방에서 원본 기록을 남기고, 필요한 항목만 선택적으로{" "}
                  <b>공유 링크</b>로 공용방에 반영
                </li>
                <li>
                  허브에서 <b>개인방 로그인 / 공용방 참여 / 참가자 관리</b>를
                  한 번에 처리
                </li>
                <li>
                  같은 데이터를 <b>리스트, 캘린더, 보드</b>로 재구성해 입력과
                  확인 상황에 따라 다른 시점 제공
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  <b>Next.js + Supabase RPC</b> 기반으로 사용자, 작업공간,
                  공유 링크, 참여 흐름을 일관된 스토어 구조로 설계
                </li>
                <li>
                  OCR/자연어 입력과 수기 입력을 함께 다루기 위해{" "}
                  <b>입력 정규화 로직</b>과 중복 방지 처리 구현
                </li>
                <li>
                  모바일에서 자주 쓰는 서비스 특성을 고려해{" "}
                  <b>헤더, 모달, 캘린더/보드 레이아웃</b>을 별도로 최적화
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.3.0",
            date: "2026.08.27",
            content:
              "월별 리뷰 도입: 보드에서 지난달 대비 늘어난·줄어든 지출과 자주 반복된 지출을 자동 분석하고, 카테고리/세부항목 단위 토글과 행 펼침으로 지난달·이번달 세부 내역까지 비교. 수입 대비 실제·계획 배분 바와 저축 분리 차트로 '저축이 지출로 보이는' 왜곡도 정리",
          },
          {
            ver: "1.2.0",
            date: "2026.07.23",
            content:
              "주식 포트폴리오 추가: 투자 계좌에서 실시간 시세를 연동하고, 매매일지 기반으로 보유수량·평단(이동평균)·평가/실현손익을 자동 계산. 물타기 계산기와 월·연·전체 기간별 실현손익 제공",
          },
          {
            ver: "1.1.0",
            date: "2026.07.20",
            content:
              "월 예산·저축 목표 관리 도입: 보드에서 월 소비 예산과 저축 목표를 설정하고, 수입 대비 지출·저축 비율과 급여 기준 여유 금액을 시각화해 예산 안에서 생활하도록 지원",
          },
          {
            ver: "1.0.4",
            date: "2026.07.14",
            content:
              "문장등록(자연어 입력) 고도화 및 소비 분석 강화: 현금영수증·카드 실적제외 키워드 자동 인식, 결제수단별 사용액 그래프에 선택 카테고리 비중 오버레이",
          },
          {
            ver: "1.0.3",
            date: "2026.07.13",
            content:
              "모바일 사용성·PWA 개선: 홈 화면 추가 시 가계부로 바로 진입(구역별 manifest·마지막 방 자동 이동), 모바일 문장등록 진입 버튼, 내역 복사, 태블릿 레이아웃 정리",
          },
          {
            ver: "1.0.2",
            date: "2026.04.01",
            content:
              "모바일 헤더/입력 모달/캘린더·보드 탭 레이아웃 개선 및 개인방 재로그인 흐름 정리",
          },
          {
            ver: "1.0.1",
            date: "2026.03.30",
            content:
              "공용방 참가자 관리, 개인방-공용방 연결 구조, 허브 진입 흐름 정비",
          },
        ]}
      />

      {/* 습관 관리 프로젝트 */}
      <ProjectCard
        anchorId="toy-habit"
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

      {/* 일일 기록 프로젝트 */}
      <ProjectCard
        anchorId="toy-daily"
        title="일일 기록"
        period="2026.02 - 진행 중 (1인 개발)"
        linkUrl="/daily"
        description={
          <>
            하루 일기와 체크리스트를 함께 관리할 수 있는{" "}
            <b>개인 루틴 기록 서비스</b>입니다.
            <br />
            월별로 체크 항목을 다르게 운영하고, 달성률을 <b>날짜 흐름 그래프</b>
            로 확인해 루틴 변화를 직관적으로 파악할 수 있습니다.
          </>
        }
        details={{
          problem: (
            <>
              기존 체크리스트는 하루 단위 확인에만 머물러 월간 흐름과 개인화가
              부족했습니다.
              <StDetailList>
                <li>월별 목표가 바뀌어도 같은 항목 구조를 강제로 사용</li>
                <li>달성률을 숫자나 막대로만 볼 때 추세 파악이 어려움</li>
                <li>개인 기록장 접근 제어 부재로 프라이버시 취약</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>월 단위 설정 + 추이 시각화 + 접근 보호</b>를 하나의 흐름으로
              통합했습니다.
              <StDetailList>
                <li>월 이동과 월별 체크리스트 분리 저장으로 유연한 루틴 운영</li>
                <li>날짜별 점/선 그래프로 달성률 추이를 직관적으로 표현</li>
                <li>기록장별 비밀번호 설정/변경/해제로 개인화된 접근 관리</li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  날짜/월 생성 로직과 엔트리 정규화를 유틸로 분리해 상태 일관성
                  확보
                </li>
                <li>
                  SVG 기반 세로형 추이 그래프를 커스텀 구현해 표 내부 시각화
                  구성
                </li>
                <li>
                  설정 모달 단일 진입점으로 비밀번호/월별 체크리스트 관리 UX 통합
                </li>
              </StDetailList>
            </>
          ),
        }}
      />

      {/* 체중 관리 프로젝트 */}
      <ProjectCard
        anchorId="toy-diet"
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

      {/* 운동 기록 (황총무운동방) 프로젝트 */}
      <ProjectCard
        anchorId="toy-workout"
        title="운동 기록 (황총무운동방)"
        period="2026.04 - 진행 중 (1인 개발)"
        linkUrl="/workout"
        description={
          <>
            러닝·웨이트·기타 활동을 한곳에서 기록하는{" "}
            <b>운동 일지 서비스</b>입니다. <br />
            종목마다 다른 기록 방식을 각각에 맞게 설계하고,{" "}
            <b>월별 달력과 운동 잔디(히트맵)</b>로 누적 흐름을 한눈에 볼 수
            있게 했습니다.
          </>
        }
        details={{
          problem: (
            <>
              운동 종류마다 기록해야 할 값이 달라 범용 기록 앱으로는 관리가
              번거로웠습니다.
              <StDetailList>
                <li>
                  러닝(거리·페이스)과 웨이트(무게·세트·볼륨)의{" "}
                  <b>기록 구조가 완전히 다름</b>
                </li>
                <li>
                  빈 바벨 무게·양쪽 중량 합산 등 <b>볼륨 계산을 매번 수기로</b>{" "}
                  처리
                </li>
                <li>매번 숫자를 옮겨 적는 입력 피로와 누적 추이 파악의 어려움</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              종목별 입력은 분리하되 <b>통계·시각화는 하나로 합치는</b> 구조로
              설계했습니다.
              <StDetailList>
                <li>
                  러닝은 실외(거리 기준)/실내 트레드밀(속도·경사·시간)과{" "}
                  <b>인터벌 구간</b>까지 구분 기록하고 페이스 자동 계산
                </li>
                <li>
                  웨이트는 워밍업·드랍셋, <b>빈 바벨·양쪽 ×2 자동 합산</b>으로 총
                  볼륨·PR을 산출하고 자주 쓰는 <b>루틴 저장/불러오기</b> 제공
                </li>
                <li>
                  월별 달력·운동 잔디·종류별 페이스 추이로 <b>누적 기록</b>을
                  직관적으로 시각화
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  볼륨·페이스·PR 등 파생 통계를 <b>순수 함수로 분리</b>해 차트와
                  월별 요약에서 재사용
                </li>
                <li>
                  비밀번호 기반 방(Session) 구조로 개인 기록 접근을 보호하고
                  Supabase로 영속화
                </li>
              </StDetailList>
            </>
          ),
        }}
        historyLogs={[
          {
            ver: "1.1.0",
            date: "2026.06.08",
            content:
              "월별 달력 요약에 러닝 거리·웨이트 볼륨·활동 종목별 횟수 누적 표시 추가",
          },
          {
            ver: "1.0.1",
            date: "2026.06.04",
            content:
              "달력 날짜 우클릭으로 러닝/웨이트/활동 기록을 바로 추가하는 운동 플랜 기능 추가",
          },
        ]}
      />

      {/* 인바디 기록 프로젝트 */}
      <ProjectCard
        anchorId="toy-inbody"
        title="인바디 기록"
        period="2026.04 - 진행 중 (1인 개발)"
        linkUrl="/inbody"
        description={
          <>
            인바디 측정 결과를 기록하고 <b>원하는 지표만 골라 추이</b>를
            확인하는 체성분 관리 서비스입니다. <br />
            체중·골격근량·체지방량부터 BMI·체지방률·내장지방까지{" "}
            <b>8개 지표</b>를 함께 다루며, 지표별 <b>스파크라인 차트</b>로 변화를
            직관적으로 보여줍니다.
          </>
        }
        details={{
          problem: (
            <>
              인바디 용지는 측정할 때마다 쌓이지만 변화 흐름을 비교하기
              어려웠습니다.
              <StDetailList>
                <li>
                  종이·사진으로만 보관해 <b>지난 측정과의 비교가 번거로움</b>
                </li>
                <li>
                  지표가 많아 한 번에 다 보면 <b>오히려 추세 파악이 어려움</b>
                </li>
                <li>
                  골격근은 늘고 체지방은 줄어야 하는 <b>지표별 좋은 방향</b>이
                  한눈에 안 들어옴
                </li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              필요한 지표만 골라 보고, 변화의 <b>좋은 방향</b>까지 색으로 알려
              주도록 설계했습니다.
              <StDetailList>
                <li>
                  8개 지표 중 <b>보고 싶은 항목만 토글</b>해 추이 그래프를 구성
                </li>
                <li>
                  지표별 <b>증감 방향(골격근↑·체지방↓ 등)</b>을 정의해 변화량을
                  색상으로 즉시 피드백
                </li>
                <li>
                  측정값·메모를 날짜순으로 누적해 <b>장기 추세</b>를 한 화면에서
                  확인
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  지표별 메타데이터(단위·소수 자릿수·좋은 방향·색상)를{" "}
                  <b>설정 테이블로 분리</b>해 입력·표시·차트가 동일 기준 공유
                </li>
                <li>
                  추이 그래프를 <b>SVG 스파크라인으로 직접 구현</b>해 가벼운
                  렌더링 확보
                </li>
                <li>
                  운동 기록과 동일한 <b>비밀번호 방 구조</b>로 개인 데이터 보호
                </li>
              </StDetailList>
            </>
          ),
        }}
      />

      {/* 게임방 프로젝트 */}
      <ProjectCard
        anchorId="toy-game"
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

      {/* 테니스 대회 프로젝트 */}
      <ProjectCard
        anchorId="toy-tennis"
        title="테니스 대회 (대진표 자동 생성)"
        period="2026.09 - 진행 중 (1인 개발)"
        linkUrl="/tennis"
        description={
          <>
            참가 명단만 넣으면 <b>대진표와 시간표를 자동으로 짜 주는</b> 대회
            운영 서비스입니다. <br />
            개인 승점으로 겨루는 교류전, 8팀 더블 엘리미네이션 팀 토너먼트,
            2인 복식 팀이 붙는 일반 대회(풀리그 · 조별 리그+결선 · 토너먼트) 중
            대회 성격에 맞는 양식을 고를 수 있습니다.
            <br />
            링크를 받은 사람이 점수를 넣으면 <b>순위표가 바로 갱신</b>됩니다.
          </>
        }
        details={{
          problem: (
            <>
              대진표를 손으로 짜면 지켜야 할 조건이 많아 시간이 오래
              걸렸습니다.
              <StDetailList>
                <li>
                  성별 구성(남복·여복·혼복), 같은 짝 중복, 연속 출전 같은 조건을{" "}
                  <b>사람이 일일이 확인</b>
                </li>
                <li>출전 횟수가 사람마다 들쭉날쭉해 불만이 생기기 쉬움</li>
                <li>
                  점수가 종이와 대화방에 흩어져 순위를 다시 계산해야 알 수 있음
                </li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>규칙을 켜고 끄면 그 조건을 지키는 대진이 자동으로</b>
              만들어지게 했습니다.
              <StDetailList>
                <li>
                  전원 고른 출전 · 짝 중복 없음 · 연속 출전 없음 · 구력 균형 ·
                  팀 대항을 켜고 끄며 선택
                </li>
                <li>
                  꼭 같이 뛸 짝, 피할 짝, 사람별 출전 상한 같은 세부 요건도 따로
                  지정
                </li>
                <li>대진이 나온 뒤 규칙 위반을 다시 점검해 경고로 표시</li>
                <li>
                  <b>링크만 공유</b>하면 로그인 없이 점수를 넣을 수 있고 순위표가
                  함께 갱신
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  대진 생성은 부수효과 없는 <b>순수 함수</b>로 분리하고, 여러 안을
                  만들어 <b>벌점이 가장 낮은 안</b>을 고르는 방식으로 구현
                </li>
                <li>
                  풀리그는 한 자리를 고정하고 나머지를 돌리는 서클 방식, 토너먼트는
                  표준 시드 배치로 1·2번 시드가 결승에서만 만나도록 배치
                </li>
                <li>
                  조별 대회의 결선은 A조 1위와 B조 2위처럼 <b>교차 시드</b>로 짝을
                  지어 같은 조 팀이 곧바로 다시 만나지 않게 처리
                </li>
                <li>
                  경기 번호를 점수 기록과 묶어 생성 이후 고정 — 대진을 다시 그려도
                  이미 넣은 점수가 어긋나지 않음
                </li>
              </StDetailList>
            </>
          ),
        }}
        projectImages={tennisImages}
      />

      {/* 야근 계산기 프로젝트 */}
      <ProjectCard
        anchorId="toy-overtime"
        title="야근 계산기 (보상휴가 계산)"
        period="2026.03 - 진행 중 (1인 개발)"
        linkUrl="/overtime"
        description={
          <>
            야근한 시간을 넣으면 회사 기준에 맞춰{" "}
            <b>보상휴가가 얼마나 쌓이는지</b> 계산해 주는 도구입니다. <br />
            적립 기준이 다른 <b>두 가지 규칙</b> 중에 골라 쓸 수 있고, 날짜별
            기록은 달력에 남아 이번 달 누적을 한눈에 볼 수 있습니다.
            <br />
            로그인하면 기록이 계정에 자동으로 연결되어 기기를 바꿔도 이어집니다.
          </>
        }
        details={{
          problem: (
            <>
              규정을 외워 매번 손으로 계산해야 하는 번거로움이 있었습니다.
              <StDetailList>
                <li>
                  적립 시작 기준과 배율이 회사마다 달라 <b>계산식이 하나가 아님</b>
                </li>
                <li>
                  하루치만 계산해서는 &quot;며칠 더 해야 하루를 쉬나&quot;를 알 수
                  없음
                </li>
                <li>기록을 브라우저에만 두면 기기를 바꿀 때 사라짐</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              <b>규칙을 골라 끼우는 계산기</b>와 달력 기록을 한 화면에 묶었습니다.
              <StDetailList>
                <li>
                  누적 15시간 초과분부터 10시 전 1.5배·10시 이후 2배로 세는 규칙과,
                  18:30부터 10분 단위로 1.5배를 쌓는 규칙 중 선택
                </li>
                <li>
                  목표 일수를 고르면 그 일수까지 <b>야근이 몇 분 더 필요한지</b>{" "}
                  안내
                </li>
                <li>달력에서 날짜를 눌러 그날 기록을 넣고 월 단위로 모아 보기</li>
                <li>
                  로그인 전에는 브라우저에만 저장하고, 로그인하면 계정 저장으로
                  자동 전환
                </li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  규칙을 <b>상수 표</b>(적립 시작 기준·1분당 보상 초·반올림 단위)로
                  정의해, 계산 코드는 하나만 두고 규칙만 갈아 끼우는 구조
                </li>
                <li>
                  브라우저 저장과 계정 저장 두 갈래를 훅 하나가 감싸, 화면 코드는
                  어디에 저장되는지 몰라도 되게 분리
                </li>
                <li>
                  로그인이 감지되면 계정에 연결된 저장소를 찾거나 만들어 기존
                  기록을 옮기는 자동 연결 처리
                </li>
              </StDetailList>
            </>
          ),
        }}
        projectImages={overtimeImages}
      />

      {/* 경조사비 장부 프로젝트 */}
      <ProjectCard
        anchorId="toy-gift-log"
        title="경조사비 장부 (축의금·부의금)"
        period="2026.09 - 진행 중 (1인 개발)"
        linkUrl="/gift-log"
        description={
          <>
            축의금·부의금을{" "}
            <b>사람별로 기록하고 얼마를 해야 할지 바로 찾아보는</b> 장부입니다.{" "}
            <br />
            받은 기록에 답례를 표시하면 나중에 낸 기록과 이어 붙어, 누구에게 아직
            답례가 남았는지 <b>표로 대조</b>할 수 있습니다.
            <br />
            상대방 이름과 메모는 <b>서버에서 암호화해 저장</b>하고 로그인한 본인만
            볼 수 있습니다.
          </>
        }
        details={{
          problem: (
            <>
              경조사비는 몇 년에 한 번이라 기억에 기대게 됩니다.
              <StDetailList>
                <li>
                  예전에 얼마를 받았는지 기억나지 않아 <b>낼 금액을 정하기 어려움</b>
                </li>
                <li>
                  받은 기록과 낸 기록이 따로 있어 누구에게 답례가 남았는지 모름
                </li>
                <li>사람 이름과 금액이라 아무 데나 적어 두기 꺼려짐</li>
              </StDetailList>
            </>
          ),
          solution: (
            <>
              기록을 <b>사람 기준으로 모으고</b> 받은 것과 낸 것을 한 쌍으로 이어
              붙였습니다.
              <StDetailList>
                <li>
                  이름으로 찾으면 그 사람과 주고받은 내역이 경조사 종류별로 한
                  번에 표시
                </li>
                <li>
                  받은 기록에 &quot;냈음&quot;을 켜면 같은 사람·같은 종류의 낸
                  기록을 찾아 답례로 연결
                </li>
                <li>
                  축의금은 축의금끼리, 부의금은 부의금끼리 탭을 나눠 받은 돈·낸
                  돈·차액을 대조
                </li>
                <li>여러 건 한 번에 추가하거나, 가계부에 적힌 지출에서 옮겨오기</li>
              </StDetailList>
            </>
          ),
          tech: (
            <>
              <StDetailList>
                <li>
                  표는 익명 접근을 막고 권한을 올린 함수로만 읽고 쓰며, 사용자
                  구분은 <b>세션 쿠키에서 확정</b>해 클라이언트가 위조할 수 없게 함
                </li>
                <li>
                  이름·관계 세부·메모는 저장할 때 암호화하고 읽을 때 풀어 주어,
                  저장 공간을 직접 열어도 <b>&quot;누가 얼마&quot;가 보이지 않음</b>
                </li>
                <li>
                  답례 짝을 찾는 판단을 순수 함수 한 곳에 모아, 목록과 대조 표가
                  같은 규칙을 쓰도록 통일
                </li>
              </StDetailList>
            </>
          ),
        }}
        projectImages={giftLogImages}
      />
    </StProjectList>
    </ToySpotlight>
  );
}
