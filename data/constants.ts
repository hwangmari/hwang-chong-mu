// app/portfolio/campaigns/constants.ts

export interface CampaignItem {
  id: string;
  date: string;
  title: string;
  description?: string[]; // 상세 내용을 위한 선택적 필드 추가
  url: string;
}

export const HSP_HISTORY_DATA = [
  {
    id: "2025-08-01",
    date: "2025.08.01 ",
    title: "채널 확장 및 신규 서비스(전자명함) 도입",
    description: [
      "D2F(Direct to Face-to-Face) 연계 서비스 도입으로 온/오프라인 영업 파이프라인 확장",
      "메인 화면 내 '상담 찾기' 진입점 최적화를 통한 상담 신청 접근성 개선",
      "FP(재무설계사) 전자명함 신규 서비스 구축 및 배포",
    ],
    url: "",
  },
  {
    id: "2025-07-01",
    date: "2025.07.01 ~",
    title: "상담 전환율(CVR) 최적화",
    description: [
      "다이렉트 상품 탐색 고객의 이탈 방지를 위한 'HSP 상담하기' 연계 팝업 로직 구현",
      "이벤트 참여 프로세스 내 본인인증 절차 추가 및 보안 프로세스 고도화",
    ],
    url: "",
  },
  {
    id: "2025-05-01",
    date: "2025.05.01 ~",
    title: "주력 상품 연계 및 서비스 확장",
    description: [
      "청약/뇌·심혈관 상품 페이지와 HSP 상담 플랫폼 간 데이터 연동 및 프로세스 통합",
    ],
    url: "",
  },
  {
    id: "2025-04-01",
    date: "2025.04.01 ~ ",
    title: "레거시 기능 추가 이관 및 안정화",
    description: [
      "상담 만족도 조사 시스템을 기존 레거시에서 신규 플랫폼(Next.js)으로 마이그레이션",
      "마이그레이션 후 사용자 피드백을 반영한 UI/UX 개선",
    ],
    url: "",
  },
  {
    id: "2025-03-01",
    date: "2025.01.01 ~ 03.28",
    title: "HSP 상담 플랫폼 오픈",
    description: [
      "차세대 상담 플랫폼 성공적 런칭 (Legacy → Next.js 전환 완료)",
      "오픈 직후 초기 트래픽 모니터링 및 안정화 작업 수행",
    ],
    url: "",
  },
];

export const DIRECT_HISTORY_DATA: CampaignItem[] = [
  {
    id: "2024-10-07",
    date: "2024.10.07 ~ 10.16",
    title: "보험상담안내",
    description: ["상담 신청 및 안내 프로세스 UI/UX 개선 및 접근성 강화"],
    url: "",
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
    url: "",
  },
  {
    id: "2024-09-09",
    date: "2024.09.09 ~ 09.20",
    title: "다이렉트AI 상담하기 신규 서비스 UI 개발",
    description: ["AI 상담하기 챗봇형 인터페이스 마크업 및 인터랙션 구현"],
    url: "",
  },
  {
    id: "2024-04-01",
    date: "2024.04.01 ~ 07.02",
    title: "보장분석 신규 서비스 UI 개발",
    description: [
      "보장분석 결과 리포트 및 상세 화면 마크업 개발",
      "복잡한 데이터 시각화(차트, 그래프)를 위한 UI 구조 설계",
    ],
    url: "",
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
    url: "",
  },
];

export const CAMPAIGN_LIST: CampaignItem[] = [
  // 2020
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

  // 2019
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

  // 2018
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

  // 2017
  {
    id: "2017-13",
    date: "2017.12.26",
    title: "시티리포터 핀란드 헬싱키",
    url: "",
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
