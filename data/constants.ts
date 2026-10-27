import { ProjectItemList } from "@/types/experiences";
export const ANALYSIS_HISTORY_DATA: ProjectItemList[] = [
  // 2026-10-26 「보장분석·HSP 회고 2026」(1–10월) 기준으로 굵직한 과제만 정리
  {
    id: "2026-10-19",
    date: "2026.10.19",
    title: "최종 배포 · 인수인계",
    description: [
      "10/19 운영 배포 후 보장분석·HSP·D2F 업무 인수인계 (라이프엔지니어링실 이동)",
    ],
  },
  {
    id: "2026-09-01",
    date: "2026.08 ~ 10",
    title: "보장분석 리포트 고도화 (기획 v1.4.1)",
    description: [
      "서버 리포트의 2단/3단 구조를 자동 판별해 모두 읽도록 리포트 이원화",
      "'부족한 보장 채우기' 기준을 급부별 상품정보로 통일해 상담·상품 연결 분기 정리",
      "'간병' → '치매·간병' 카테고리 개편 및 급부 안내 툴팁 추가",
      "인앱에서 화면이 튕기던 인증 세션 충돌 원인을 찾아 핫픽스로 해결",
      "타입 검사 오류 460줄 → 0, 화면 직접 진입 속도 개선, 보안 키패드 재시도 제한으로 서버 호출 폭주 방지",
    ],
  },
  {
    id: "2026-06-01",
    date: "2026.06 ~ 09",
    title: "보장분석 ↔ HSP 상담 연계",
    description: [
      "보장분석 결과를 본 고객이 바로 HSP 상담을 신청하도록 연계 서비스 구축",
      "보장분석 고객정보를 상담 신청서에 자동 입력·잠금, 빠진 항목을 안내하는 입력 검증",
      "보장분석에서 들어온 고객 전용 상담 신청 흐름 추가",
      "백오피스에서 보장분석 화면을 켜고 끄는 노출 제어 연동, 웹접근성·앱 뒤로가기 대응",
    ],
  },
  {
    id: "2026-04-01",
    date: "2026.04 ~ 05",
    title: "FP 전용 보장분석 결과 페이지",
    description: [
      "FP(재무설계사)가 고객의 보장분석 결과를 확인하는 전용 페이지 신규 구축",
      "인증 흐름 개편(휴대폰 입력 제거·약관 동의 추가) 및 실데이터 연동·QA",
    ],
  },
  {
    id: "2026-03-01",
    date: "2026.01 ~ 03",
    title: "보장분석 연결 상품 전환 · 암뇌심 통합 상품 연결",
    description: [
      "연결 상품 코드 전환 시 급부 매칭과 보험료 일치를 직접 검증한 뒤 이관",
      "부족한 보장 조합(암·뇌·심장)에 맞춰 통합 상품으로 연결하고 '계산하기'까지 이어지게 구현",
    ],
  },
  {
    id: "2026-02-01",
    date: "2026.01.20 ~ 02.19",
    title: "보장분석서비스 중단 안내(신정원시스템 점검)",
    description: [
      "보장분석 가이드페이지 URL 전환",
      "앱 버전별·웹별 노출 시나리오를 미리 정리해 5.7일 장기 중단을 공지와 ON/OFF로 대응",
      "차세대 시스템 오픈 후 보장분석 원복",
    ],
  },
];

export const HSP_HISTORY_DATA: ProjectItemList[] = [
  {
    id: "2026-10-19",
    date: "2026.10.19",
    title: "최종 배포 · HSP·D2F 인수인계",
    description: ["10/19 운영 배포 후 HSP·D2F 업무 인수인계 (라이프엔지니어링실 이동)"],
  },
  {
    id: "2026-09-01",
    date: "2026.09 ~ 10",
    title: "HSP 상담 신청 마감 처리 · 안정화",
    description: [
      "신청 마감 팝업과 마감 에러 처리, 마감 후에도 입력값 유지",
      "휴대폰 시계가 아닌 서버 시각 기준으로 마감 판정",
      "응답 전 제출 잠금으로 중복 신청 방지, 첫 진입 광고 정보(UTM) 전달 복구",
    ],
  },
  {
    id: "2026-06-01",
    date: "2026.06 ~ 10",
    title: "HSP 인앱 전환 · D2F 보안 강화",
    description: [
      "HSP를 앱 안 웹뷰 화면으로 전환하고 인앱 진입 시 헤더·여백 문제 해결",
      "인앱 휴대폰번호 암호화 연동, D2F는 앱 웹뷰에서만 열리도록 접근 제한",
      "담당 FP 조회·상담 요청을 로그인 토큰 기반으로 전환해 고객 정보 보호 강화",
    ],
  },
  {
    id: "2026-02-01",
    date: "2026.02.13 ~ 03.19",
    title: "HSP 상담 목적 추가",
    description: [
      "상담목적·관심보험·희망 월 보험료 항목을 코드로 정의해 상담 신청 개편",
      "알림톡 연락처·지역 선택 등 신청 항목 정비 후 3/19 배포",
    ],
  },
  {
    id: "2026-01-01",
    date: "2026.01.20 ~ 02.12",
    title: "HSP 마케팅 약관",
    description: ["마케팅 동의 선택약관 추가 (2/12 배포)"],
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
