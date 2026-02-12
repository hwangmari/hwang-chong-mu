import { ProjectItemList } from "@/types/experiences";
export const ANALYSIS_HISTORY_DATA: ProjectItemList[] = [
  {
    id: "2026-02-01",
    date: "2026.01.20 ~ 02.19",
    title: "보장분석서비스 중단 안내(신정원시스템 점검)",
    description: [
      "보장분석 가이드페이지 전환",
      "보장분석서비스 중단 안내(신정원시스템 점검)",
      "신정원시스템 중단 보장분석 원복",
    ],
  },
  {
    id: "2026-01-01",
    date: "2026.01.02 ~ 02.02",
    title: "보장분석 CMS 수정건",
  },
];

export const HSP_HISTORY_DATA: ProjectItemList[] = [
  {
    id: "2026-02-01",
    date: "2026.02.13 ~ 03.19",
    title: "HSP 상담 목적 추가",
  },
  {
    id: "2026-01-01",
    date: "2026.01.20 ~ 02.12",
    title: "HSP 마케팅 약관",
  },
  {
    id: "2025-10-11",
    date: "2025.10.11 ~ 10:30",
    title: "상품찾기 메인 탭 HSP 상담 연결창구 연동",
    description: [
      "APP(In-webview)과 Mobile Web 간의 인터랙션 차이를 극복하고, 단일 소스로 멀티 채널을 대응할 수 있는 확장성 있는 구조 설계",
      "플랫폼별 최적화된 UX 제공: App 메인에서는 인웹뷰 페이지로, Mobile Web에서는 모달/바텀시트로 분기 처리하여 사용자 경험 통일",
    ],
  },
  {
    id: "2025-10-01",
    date: "2025.10.01 ~ 10.15 ",
    title: "FP 정보 고도화: 전자명함 서비스 도입",
    description: [
      "FP(재무설계사)의 상세 프로필 및 전문 분야를 제공하는 전자명함 서비스 신규 구축",
      "상담 전 FP 정보를 투명하게 공개하여 고객 신뢰도 확보 및 상담 연결 수락률 증대 기여",
    ],
  },
  {
    id: "2025-08-01",
    date: "2025.08.01 ~ 09.30",
    title: "D2F(Direct to FP) 연계 서비스 도입",
    description: [
      "디지털 채널(Web/App)과 오프라인 영업(FP)을 연결하는 O2O 상담 파이프라인 구축",
      "Next.js 기반의 OSMU(One Source Multi Use) 전략으로 PC, Mobile Web, App 등 파편화된 멀티 채널 규격 통합 대응",
      "주요 진입점(나의계약조회, 사고보험금, 고객센터 등) 내 D2F 프로세스를 심리스하게 연결",
      "고객 데이터(수금 FP 보유 여부) 기반의 동적 라우팅 로직 구현 (담당 FP 정보 제공 vs HSP 상담원 연결)",
      "영업시간 외 이탈 방지를 위한 '담당 설계사 상담 예약 플랫폼' 추가 개발",
    ],
  },
  {
    id: "2025-07-02",
    date: "2025.07.01 ~ 07.30",
    title: "HSP 이벤트 참여 프로세스 고도화",
    description: [
      "이벤트 참여 프로세스 내 본인인증 절차 추가로 부정 참여 방지",
    ],
  },
  {
    id: "2025-06-11",
    date: "2025.06.11 ~ 07.16",
    title: "고객 행동 기반(Behavioral) HSP 상담 연계",
    description: [
      "다이렉트 상품 탐색 과정의 고객 행동 데이터를 실시간 분석하여 적시에 상담 팝업을 노출하는 타겟팅 로직 구현",
      "이탈 감지 트리거 정교화: 상품 메인 체류시간 2분 이상, 설계내역 ↔ 상품메인 반복 전환 시 상담 유도 팝업 노출",
      "고객의 관심도에 따른 능동적 상담 제안으로 상담 전환율(CVR) 개선",
    ],
    images: [
      {
        src: "/images/hanwha_hsp_product.png",
        alt: "상품 탐색 기반 상담 유도",
      },
    ],
  },
  {
    id: "2025-05-01",
    date: "2025.05.01 ~ 05.30",
    title: "HSP 상담하기 비즈니스 연계 영역 확대",
    description: [
      "청약/뇌·심혈관 상품 등 주요 보험 상품 페이지와 상담 플랫폼 데이터 연동",
      "사고보험금 신청 프로세스 내 상담 니즈 발생 구간에 상담 연결 버튼 배치",
    ],
  },
  {
    id: "2025-04-04",
    date: "2025.04.04 ~ 04.22",
    title: "만족도 조사 서비스 마이그레이션",
    description: [
      "기존 레거시 시스템의 상담 만족도 조사를 Next.js 환경으로 마이그레이션하여 성능 개선",
      "사용자 피드백을 반영한 UI/UX 개선으로 설문 참여율 증대",
    ],
    images: [
      {
        src: "/images/hsp_m.png",
        alt: "만족도 조사 모바일 화면",
        width: 120,
      },
    ],
  },
];

export const DIRECT_HISTORY_DATA: ProjectItemList[] = [
  {
    id: "2024-10-07",
    date: "2024.10.07 ~ 10.16",
    title: "보험상담안내",
    description: ["상담 신청 및 안내 프로세스 UI/UX 개선 및 접근성 강화"],
  },
  {
    id: "2024-10-13",
    date: "2024.10.13 ~ 11.06",
    title: "공용 Footer 및 약관 페이지 고도화",
    description: [
      "기존 적응형 페이지를 반응형 원페이지 구조로 전면 개편하여 모바일/PC 사용성 통일",
      "iframe을 활용한 약관 조회 시스템 구축 및 경로 관리 로직 개선",
      "온슈어 레거시 Footer 경로 정리 및 코드 최적화",
    ],
  },
  {
    id: "2024-09-09",
    date: "2024.09.09 ~ 09.20",
    title: "다이렉트AI 상담하기 신규 서비스 UI 개발",
    description: ["AI 상담하기 챗봇형 인터페이스 마크업 및 인터랙션 구현"],
  },
  {
    id: "2024-07-01",
    date: "2024.07.01 ~ 07.30",
    title: "통합 BO 배너 관리 목록 페이지 개발",
    description: [
      "통합 BO 백오피스 배너 목록 페이지 프론트 개발",
      "데이터 API 연동까지 수행하여 운영 효율 개선",
    ],
  },
  {
    id: "2024-05-01",
    date: "2024.05.01 ~ 06.30",
    title: "다이렉트, 온슈어 운영 웹접근성 대응",
    description: [
      "온슈어 운영 개발 마크업 전담 및 웹접근성 대응 개발",
      "웹접근성 심사 대응 및 접근성 마크 획득",
    ],
  },
  {
    id: "2024-04-01",
    date: "2024.04.01 ~ 07.02",
    title: "보장분석 신규 서비스 UI 개발",
    description: [
      "보장분석 결과 리포트 및 상세 화면 마크업 개발",
      "복잡한 데이터 시각화(차트, 그래프)를 위한 UI 구조 설계",
    ],
  },
  {
    id: "2024-02-01",
    date: "2024.02.01 ~ 03.30",
    title: "다이렉트웹 이벤트 상세 페이지 개발",
    description: [
      "이벤트 상세 페이지 마크업 전담",
      "백오피스 연동 및 UI 컴포넌트 개발",
    ],
  },
  {
    id: "2023-09-01",
    date: "2023.09.01 ~ 2024.05.30",
    title: "온슈어 정기 스프린트 및 운영 대응",
    description: [
      "UI/UX 품질 개선: CSS 스타일 리팩토링 및 크로스 브라우징 이슈(모바일/PC) 해결",
      "유관 부서(기획/디자인)와의 정기 싱크를 통한 유지보수 프로세스 효율화",
      "다이렉트 보험 상품 개정 및 약관 변경 사항 적시 반영",
      "Jira/Confluence를 활용한 운영 이슈 트래킹 및 UI 결함 해결",
    ],
  },
];

export const CAMPAIGN_LIST: ProjectItemList[] = [
  {
    id: "2020-03",
    date: "2020.02.28",
    title: "필립스",
    url: "https://media.29cm.co.kr/campaign/lattego/",
  },
  {
    id: "2020-02",
    date: "2020.02.24",
    title: "SK브로드밴드",
    url: "https://media.29cm.co.kr/campaign/tworld/",
  },
  {
    id: "2020-01",
    date: "2020.02.03",
    title: "질레트",
    url: "https://media.29cm.co.kr/campaign/gillettelabs/",
  },

  {
    id: "2019-10",
    date: "2019.09.23",
    title: "챕스틱",
    url: "https://media.29cm.co.kr/campaign/chapstick/",
  },
  {
    id: "2019-09",
    date: "2019.08.26",
    title: "리스테린",
    url: "https://media.29cm.co.kr/campaign/colorfullisterine/",
  },
  {
    id: "2019-08",
    date: "2019.08.05",
    title: "삼성화재 2차",
    url: "https://media.29cm.co.kr/campaign/trip2.samsung/",
  },
  {
    id: "2019-07",
    date: "2019.07.08",
    title: "삼성화재 1차",
    url: "https://media.29cm.co.kr/campaign/trip1.samsung/",
  },
  {
    id: "2019-06",
    date: "2019.05.14",
    title: "바른생각",
    url: "https://media.29cm.co.kr/campaign/barunsengkak/",
  },
  {
    id: "2019-05",
    date: "2019.04.05",
    title: "해브어굿타임",
    url: "https://media.29cm.co.kr/campaign/haveagoodtime/",
  },
  {
    id: "2019-04",
    date: "2019.03.15",
    title: "우주비행",
    url: "https://media.29cm.co.kr/campaign/wybh/",
  },
  {
    id: "2019-03",
    date: "2019.03.11",
    title: "오소이",
    url: "https://media.29cm.co.kr/campaign/osoi/",
  },
  {
    id: "2019-02",
    date: "2019.02.21",
    title: "휘슬러",
    url: "https://media.29cm.co.kr/campaign/fisslercitycollection/",
  },
  {
    id: "2019-01",
    date: "2019.02.02",
    title: "이스트팩",
    url: "https://media.29cm.co.kr/campaign/eastpak19ss/",
  },

  {
    id: "2018-16",
    date: "2018.12.06",
    title: "메종마레",
    url: "https://media.29cm.co.kr/campaign/maisonmarais/",
  },
  {
    id: "2018-15",
    date: "2018.11.14",
    title: "구례베이커리",
    url: "https://media.29cm.co.kr/campaign/GuryeBakery/",
  },
  {
    id: "2018-14",
    date: "2018.11.09",
    title: "비아플레인 어썸니즈",
    url: "https://media.29cm.co.kr/campaign/via-awesome/",
  },
  {
    id: "2018-13",
    date: "2018.10.30",
    title: "CK Performance",
    url: "https://media.29cm.co.kr/campaign/ckPerformance/",
  },
  {
    id: "2018-12",
    date: "2018.09.21",
    title: "시티리포터 대만",
    url: "https://media.29cm.co.kr/campaign/via-awesome/",
  },
  {
    id: "2018-11",
    date: "2018.08.03",
    title: "이스트백",
    url: "https://media.29cm.co.kr/campaign/eastpak/",
  },
  {
    id: "2018-10",
    date: "2018.07.13",
    title: "크룬",
    url: "https://media.29cm.co.kr/campaign/croon/",
  },
  {
    id: "2018-09",
    date: "2018.06.07",
    title: "에스프레소 마티니",
    url: "https://media.29cm.co.kr/campaign/espressomartini/index.html",
  },
  {
    id: "2018-08",
    date: "2018.04.27",
    title: "로서울 유지",
    url: "https://media.29cm.co.kr/campaign/29cm-acc/",
  },
  {
    id: "2018-07",
    date: "2018.04.11",
    title: "로나제인",
    url: "https://media.29cm.co.kr/campaign/lornajane/",
  },
  {
    id: "2018-06",
    date: "2018.03.28",
    title: "라라스윗",
    url: "https://media.29cm.co.kr/campaign/lalasweet/",
  },
  {
    id: "2018-05",
    date: "2018.03.14",
    title: "TOMS",
    url: "https://media.29cm.co.kr/campaign/toms/",
  },
  {
    id: "2018-04",
    date: "2018.02.28",
    title: "벨리에",
    url: "https://media.29cm.co.kr/campaign/belier/",
  },
  {
    id: "2018-03",
    date: "2018.01.31",
    title: "도교샌드위치",
    url: "https://media.29cm.co.kr/campaign/29cmtour/01/",
  },
  {
    id: "2018-02",
    date: "2018.01.15",
    title: "프라이탁 episode2",
    url: "https://media.29cm.co.kr/campaign/freitag/episode2.html",
  },
  {
    id: "2018-01",
    date: "2018.01.15",
    title: "프라이탁 episode1",
    url: "https://media.29cm.co.kr/campaign/freitag/episode1.html",
  },

  {
    id: "2017-13",
    date: "2017.12.26",
    title: "시티리포터 핀란드 헬싱키",
  },
  {
    id: "2017-12",
    date: "2017.12.22",
    title: "동물자유연대",
    url: "https://media.29cm.co.kr/campaign/petguide/",
  },
  {
    id: "2017-11",
    date: "2017.12.21",
    title: "LEXUS episode3",
    url: "https://media.29cm.co.kr/campaign/lexus/episode3.html",
  },
  {
    id: "2017-10",
    date: "2017.12.21",
    title: "LEXUS episode2",
    url: "https://media.29cm.co.kr/campaign/lexus/episode2.html",
  },
  {
    id: "2017-09",
    date: "2017.12.21",
    title: "LEXUS episode1",
    url: "https://media.29cm.co.kr/campaign/lexus/episode1.html",
  },
  { id: "2017-08", date: "2017.11.20", title: "시티리포터 방콕", url: "" },
  {
    id: "2017-07",
    date: "2017.10.27",
    title: "Hollys Coffee",
    url: "https://media.29cm.co.kr/campaign/hollys/",
  },
  { id: "2017-06", date: "2017.10.19", title: "시티리포터 포틀랜드", url: "" },
  {
    id: "2017-05",
    date: "2017.10.10",
    title: "Low Classic",
    url: "https://media.29cm.co.kr/campaign/lowclassic/",
  },
  {
    id: "2017-04",
    date: "2017.09.20",
    title: "CK UNDERWEAR",
    url: "https://media.29cm.co.kr/campaign/ck/",
  },
  {
    id: "2017-03",
    date: "2017.08.17",
    title: "PUMA episode2",
    url: "https://pt.29cm.co.kr/puma/episode2/",
  },
  {
    id: "2017-02",
    date: "2017.08.08",
    title: "PUMA episode1",
    url: "https://pt.29cm.co.kr/puma/episode1/",
  },
  { id: "2017-01", date: "2017.07.28", title: "THULE", url: "" },
];
