// data/experiences.ts

import {
  CAMPAIGN_LIST,
  DIRECT_HISTORY_DATA,
  HSP_HISTORY_DATA,
} from "./constants";
// 1. 리스트에 들어갈 개별 아이템 타입 (기존 CampaignItem 구조와 동일)
export interface HistoryItem {
  id: string | number;
  date: string;
  title: string;
  url?: string;
}

// 2. 프로젝트 아이템 리스트 정보를 담을 객체 타입 정의
export interface ProjectItemListData {
  title: string; // "Campaign Archive" 처럼 버튼에 쓸 제목
  items: HistoryItem[]; // 실제 리스트 데이터 배열
  description?: string; // "2017 - 2020..." 같은 설명 (선택사항)
}

export interface ExperienceData {
  id: string;
  company: string;
  role: string;
  period: string;
  color: string;
  summary: string[];
  description: string;
  projects: {
    title: string;
    period: string;
    description: string;
    tasks: string[];
    techStack: string[];
    link?: string;

    projectItemList?: ProjectItemListData;

    images?: string[];
  }[];
}

export const experiences: ExperienceData[] = [
  {
    id: "hanwha",
    company: "한화생명",
    role: "다이렉트 웹 개발 / 디지털프로덕트팀 - 세일즈파트 (대리)",
    period: "2023.08 - 재직중",
    color: "bg-orange-500",
    summary: [
      "다이렉트 웹 서비스 및 백오피스 프론트엔드 개발 및 운영",
      "HSP 상담 플랫폼 신규 시스템 마이그레이션 (Legacy → Next.js)",
      "보장분석 서비스",
    ],
    description:
      "프론트 엔드 전향 완벽히 함 ㅋ\n PM 으로 서비스 운영 및 리소스 관리 협업을 통해 업무롤 정리",
    projects: [
      {
        title: "보장분석",
        period: "2026.01 ~",
        description: "",
        tasks: ["", ""],
        techStack: [
          "Next.js",
          "React",
          "TypeScript",
          "Styled Components",
          "SCSS",
          "Figma",
        ],
      },
      {
        title: "HSP 상담 플랫폼 마이그레이션",
        period: "2025.01 ~ 05",
        description:
          "기존 레거시 상담 시스템을 Next.js 기반의 CSR 환경으로 전면 마이그레이션",
        tasks: [
          "SSR → CSR(Next.js) 전환 및 React-Query 도입으로 비동기 상태 관리 최적화",
          "FP 리스트 호출 시점 최적화(지역 선택 시 호출)로 불필요한 트래픽 감소",
          "외부 유입(이벤트 배너, GA) 트래킹 로직 재설계 및 파라미터 처리",
          "기획서 부재 상황에서 역으로 API 흐름과 UI/UX를 설계하여 개발 주도",
          "구두로 전해지던 히스토리를 Figma 문서화 (API 흐름도, 에러 케이스, 실패 대응 매뉴얼)",
          "운영 중단 없는 2단계 순차적 오픈 전략 수립 및 성공",
        ],
        techStack: [
          "Next.js",
          "React",
          "TypeScript",
          "Styled Components",
          "SCSS",
          "Figma",
        ],
        images: ["/images/hanwha_hsp_2025.png"],
        projectItemList: {
          title: "HSP상담 운영 고도화",
          description: " History",
          items: HSP_HISTORY_DATA,
        },
      },

      {
        title: "다이렉트 웹 & 백오피스",
        period: "2023.08 ~ 2024.12",
        description:
          "보험 상품 가입을 위한 다이렉트 웹 서비스 및 내부 운영을 위한 백오피스 시스템 개발",
        tasks: [
          "React 기반의 컴포넌트 개발 및 유지보수",
          "백오피스 내 상품 관리 및 운영 효율화를 위한 기능 개발",
          "디자인 시스템 가이드 준수 및 공통 컴포넌트화",
        ],
        techStack: [
          "Next.js",
          "React",
          "TypeScript",
          "Styled Components",
          "SCSS",
          "Figma",
        ],
        projectItemList: {
          title: "다이렉트 웹 운영 및 신규 서비스 ",
          description: " History",
          items: DIRECT_HISTORY_DATA,
        },
      },
    ],
  },

  {
    id: "kakao-ent",
    company: "카카오 엔터프라이즈",
    role: "워크개발 / 마크업개발파트",
    period: "2020.07 - 2023.08 3년 2개월",
    color: "bg-yellow-400",
    summary: [
      "React, Svelte, Angular 등 다양한 프레임워크 기반의 대규모 서비스 구축 및 운영",
      "카카오워크 투표/할일 등 주요 기능을 4종 OS(Win/Mac/iOS/Android) 웹뷰로 구현",
      "CSS Variables를 활용한 다크모드 시스템 구축 및 반응형 레이아웃 최적화",
    ],
    description: "",
    projects: [
      {
        title: "카카오워크 투표 (Vote)",
        period: "2023.03 - 2023.06",
        description:
          "4종 OS(Mac, Win, iOS, Android) 네이티브 앱 내 웹뷰로 투표 기능 구현",
        tasks: [
          "React 컴포넌트 개발 및 CSS Module(SCSS, AdorableCSS) 스타일링",
          "공통 요소는 스타일만 분기 처리하고, 전체 레이아웃은 모바일/데스크탑을 분리하여 코드 관리 효율화",
          "CSS Variables(:root)를 활용한 다크모드 테마 시스템 구축",
          "TypeScript Props 상태 관리 및 스타일 제어 로직 구현",
        ],
        techStack: ["React", "TypeScript", "SCSS", "AdorableCSS"],
        images: ["/images/kakao_vote.png"],
      },
      {
        title: "카카오워크 할 일 (Todo)",
        period: "2022.08 - 2023.04",
        description:
          "기존 네이티브 앱 서비스를 웹(PC, Mobile)으로 전환하며 사용성 및 기능 개선",
        tasks: [
          "Svelte 기반 컴포넌트 개발 및 기존 네이티브 기능의 웹 마이그레이션",
          "User Agent 분기를 통해 모바일 특화 UX와 공통 기능을 효율적으로 관리",
          "앱 리사이징 정책에 따른 PC 앱 사이즈별 반응형 레이아웃 구현",
          "TypeScript 및 SCSS/AdorableCSS를 활용한 정교한 스타일링",
        ],
        techStack: ["Svelte", "TypeScript", "SCSS", "AdorableCSS"],
        images: ["/images/kakao_todo.png", "/images/kakao_todo_m.png"],
      },
      {
        title: "카카오워크 음성채팅",
        period: "2022.06 - 2022.09",
        description: "PC 클라이언트(Mac, Win) 음성채팅 기능을 웹뷰로 구현",
        tasks: [
          "FE 개발이 선행된 Svelte 코드 위에 디자인 입히는 작업 수행 (협업 최적화)",
          "기능 개발자(FE)가 로직에 집중할 수 있도록 마크업 및 스타일링 전담 지원",
          "복잡한 음성 채팅 UI의 상태별 스타일 정의",
        ],
        techStack: ["Svelte", "SCSS", "AdorableCSS"],
        images: ["/images/kakao_voice.png"],
      },
      {
        title: "근태 2.0 (Admin/User)",
        period: "2021.07 - 2022.06",
        description:
          "PC 브라우저 기반의 카카오워크 근태 관리 서비스 (Drop 프로젝트)",
        tasks: [
          "5개 직군(기획, UX, 디자인, 마크업, FE) 협업을 통한 아이데이션 및 우선순위 조율",
          "빠른 테스트를 위한 데모 페이지 개발 및 사이드 이슈 사전 식별",
          "Svelte, Vite 기반의 빠른 개발 환경 구축 및 사용자 화면 개발 주도",
        ],
        techStack: ["Svelte", "TypeScript", "Vite"],
        images: [
          "/images/kakao_attendance_1.png",
          "/images/kakao_attendance_2.png",
        ],
      },
      {
        title: "카카오 i 엔터프라이즈 빌더",
        period: "2021.02 - 2023.03",
        description: "PC 브라우저 기반의 봇 빌더 서비스 리팩토링 및 고도화",
        tasks: [
          "Angular → React 프레임워크 마이그레이션 수행 (홀딩 기간 활용)",
          "AdorableCSS 첫 도입 및 리팩토링을 통한 스타일 코드 관리 최적화",
          "복잡한 빌더 UI의 인터랙션 및 상태 관리 로직 구현",
        ],
        techStack: ["React", "TypeScript", "Vite", "SCSS"],
        link: "https://kakaoenterprise.gitbook.io/kakao-i-builder/",
      },
      {
        title: "서비스 운영 및 최적화 (Others)",
        period: "2020.07 - 2021.01",
        description:
          "카카오 엔터프라이즈의 다양한 서비스 유지보수 및 품질 개선",
        tasks: [
          "카카오엔터프라이즈 영입 사이트: 전체 마크업 교체 및 반응형 대응으로 퀄리티 향상",
          "이메일 템플릿: PC/Mobile 가독성을 고려한 반응형 제작 및 다크모드 대응",
          "캐스퍼 어시스턴트: 정적 페이지 내 애니메이션 적용 및 이미지 레이지 로드로 속도 개선",
          "카카오 i 어드민: Angular + Material UI 기반 디자인 수정",
        ],
        techStack: ["HTML/CSS", "Angular", "Responsive"],
      },
    ],
  },
  {
    id: "musinsa",
    company: "29CM(무신사)",
    role: "Platform / Cell FE",
    period: "2017.02 - 2020.07 3년 6개월",
    color: "bg-black",
    summary: [
      "AngularJS 기반의 29CM 사이트 전면 개편 및 유지보수 전담",
      "삼성화재 등 대규모 트래픽 캠페인 페이지 인터랙션 개발 (앤어워드 2회 수상)",
      "기획 부재 상황을 주도적인 UI/UX 제안으로 해결하며 협업 주도",
    ],
    description: "",
    projects: [
      {
        title: "29CM 사이트 개편 및 운영",
        period: "2017.05. ~ 2018.02. 오픈 /  ~ 유지보수",
        description:
          "Angular 기반의 PC/Mobile 원페이지 반응형 웹 구축 및 통합 유지보수",
        tasks: [
          "AngularJS 기반 SPA(Single Page Application) 구조로 PC/Mobile 반응형 웹 구현",
          "프론트 UI 리소스 절감을 위한 'One-Source Multi-Use' 반응형 전략 수립 및 구현",
          "개편 오픈 이후 유지 보수 및 추가 리뉴얼 관련하여 29CM 전체 소스 관리를 맡아 전담 관리",
          "기획/디자인 의도를 기술적으로 구현 가능한 최적의 형태로 제안하며 협업 프로세스 개선",
        ],
        techStack: ["AngularJS", "SCSS", "Git"],
      },
      {
        title: "브랜드 캠페인 & 미디어 PT",
        period: "2017.07. ~ : 단기 프로젝트성 이벤트 ",
        description:
          "삼성화재, 렉서스 등 주요 브랜드의 고도화된 인터랙티브 캠페인 페이지 개발 및 기술 지원",
        tasks: [
          "브랜딩 미디어 팀의 고감도 콘텐츠를 웹 경험으로 완벽히 구현",
          "사용자 몰입도를 극대화하여 미디어 광고 매출 증대 및 타 브랜드 제휴 확대 견인",
          "삼성화재, 렉서스 등 브랜드별 아이덴티티를 녹여낸 스크롤 기반 스토리텔링 및 마이크로 인터랙션 구현 ",
          "삼성화재 1차, 2차 캠페인 - 어워드 2회 수상",
          "기존 템플릿의 제약을 넘는 '세로형 PT' 포맷을 기술적으로 정립하고, 고해상도 미디어의 렌더링 성능 최적화 및 스크롤 이벤트 튜닝 수행",
          "한정된 플랫폼 특성 내에서 최상의 UX/Design 퀄리티를 내기 위한 기술적 해법 제공",
          "디자인 의도를 100% 구현하기 위해 애니메이션 프로토타입을 선제작하여 제안",
          "기획-디자인-개발 간의 시너지를 위한 기술적 가이드 주도",
        ],
        techStack: [
          "HTML5",
          "CSS3 (Keyframe/Transition)",
          "JavaScript (ES5/ES6)",
          "jQuery",
        ],
        projectItemList: {
          title: "PT Campaign History",
          description: "2017 - 2020 29CM ",
          items: CAMPAIGN_LIST,
        },
      },
      {
        title: "29TV (숏폼 비디오 커머스)",
        period: "2019.09. ~ 2020.01. 오픈",
        description: "29초 영상 큐레이션 서비스 신규 구축",
        tasks: [
          "PC와 모바일에 완벽 대응하는 반응형 비디오 플레이어 UI 구현",
          "동영상 데이터 로딩 속도 최적화 및 크로스 브라우징 플레이어 대응",
          "영상 콘텐츠 기반의 새로운 커머스 경험(V-Commerce) 구조 설계 및 개발",
        ],
        techStack: ["AngularJS", "Video.js", "SCSS"],
        images: ["/images/29cm_tv.png"],
      },
      {
        title: "컬쳐 캘린더 (Culture Calendar)",
        period: "2019.01. ~ 2019.3. 오픈 (매달 추가 운영 진행)",
        description: "월간 문화 콘텐츠를 소개하는 캘린더 서비스 (매월 운영)",
        tasks: [
          "기획자 부재 상황에서 주도적으로 UI 레이아웃 및 인터랙션 아이디어 제안",
          "FE 개발자와의 긴밀한 협업을 통해 데이터 바인딩 로직과 마크업 구조 최적화",
          "단순 정보 나열이 아닌, 사용자가 흥미를 느낄 수 있는 동적 캘린더 UI 구현",
        ],
        techStack: ["HTML", "SCSS", "JavaScript"],
        images: ["/images/29cm_c.png"],
      },
    ],
  },
  {
    id: "douzone",
    company: "더존 비즈온",
    role: "UI 개발팀 (전임)",
    period: "2016.05 - 2016.12 7개월",
    color: "bg-blue-600",
    summary: [
      "비즈니스 플랫폼 WEHAGO 신규 프로젝트의 초기 React 마크업 구조 설계",
      "1인 마크업 개발자로서 외부 인력 가이드라인 수립 및 리딩",
      "외부 인력 산출물의 품질 이슈 해결을 위한 핵심 모듈 전면 재개발 (Quality Assurance)",
    ],
    description: "",
    projects: [
      {
        title: "WEHAGO 신규 프로젝트 구축",
        period: "2016.05 - 2016.12",
        description:
          "기업용 비즈니스 플랫폼 WEHAGO의 초기 UI 아키텍처 설계 및 핵심 기능 개발",
        tasks: [
          "React 기반의 신규 프로젝트 UI/마크업 구조 설계 및 컴포넌트 개발",
          "촉박한 일정 속 1인 개발자로서 외부 프리랜서/협력사를 위한 'UI 개발 표준 가이드라인' 제작 및 배포",
          "외부 인력 산출물의 퀄리티 이슈를 식별하고, 안정성을 위해 핵심 리스트 및 모듈 전면 재개발 (Refactoring)",
          "방대한 B2B 서비스 모듈 구현 (회계관리, 전자세금계산서, 인사급여, 스마트A, 커뮤니케이션 등)",
        ],
        techStack: ["React.js", "HTML5/CSS3", "SCSS", "Git"],
        images: ["/images/douzone_1.png", "/images/douzone_2.png"],
      },
    ],
  },
  {
    id: "hivelab",
    company: "하이브랩",
    role: "UIT 웹표준개발팀 (전임)",
    period: "2012.09 - 2016.05 3년 9개월",
    color: "bg-gray-400",
    summary: [
      "국내 대형 포털(Naver) 및 커머스(CJ) 사이트의 웹 표준 마크업 및 운영",
      "IE6부터 최신 브라우저까지 완벽한 크로스 브라우징(Cross-Browsing) 구현 역량 보유",
      "웹 접근성(Web Accessibility) 준수 및 대규모 서비스 운영 프로세스 체득",
    ],
    description: "",
    projects: [
      {
        title: "CJ오쇼핑 파견 및 운영",
        period: "2014.05 - 2016.05",
        description:
          "CJmall PC/Mobile, 올리브영, 오클락 등 CJ 계열 커머스 플랫폼 운영 및 구축",
        tasks: [
          "CJmall, 올리브영 등 대규모 커머스 사이트의 신규 페이지 구축 및 상시 운영",
          "다양한 디바이스 환경을 고려한 모바일 웹 마크업 및 최적화",
          "매일 갱신되는 각종 이벤트 및 기획전 페이지의 빠른 제작 및 배포 (Speed & Quality)",
          "웹 접근성 지침을 준수하여 장애인 및 고령자도 이용 가능한 마크업 구현",
        ],
        techStack: ["HTML5", "CSS3", "jQuery", "Web Accessibility"],
        images: ["/images/hivelab_1.png"],
      },
      {
        title: "네이버(NAVER) 서비스 운영",
        period: "2012.09 - 2014.05",
        description:
          "네이버 주요 서비스(쇼핑, 부동산, 광고 등)의 UI 마크업 및 운영",
        tasks: [
          "지식쇼핑, 부동산, 체크아웃 등 네이버 핵심 서비스의 UI 유지보수",
          "IE6, 7, 8 등 구형 브라우저를 포함한 픽셀 퍼펙트(Pixel-Perfect) 크로스 브라우징",
          "이미지 스프라이트(Image Sprite) 기법 등을 활용한 렌더링 성능 최적화",
          "엄격한 네이버 코딩 컨벤션을 준수하며 시멘틱 마크업(Semantic Markup) 역량 강화",
        ],
        techStack: ["HTML4/5", "CSS2/3", "Cross Browsing", "Photoshop"],
      },
      {
        title: "한게임 & 브랜드 사이트 구축",
        period: "2012.09 - 2014.05",
        description:
          "한게임 포털 운영 및 IF몰, Raffinest 등 브랜드 사이트 리뉴얼",
        tasks: [
          "고스톱, 포커 등 한게임 웹보드 게임 사이트 운영 및 프로모션 페이지 제작",
          "IF몰(IF Mall) 사이트 전면 개편 마크업 수행",
          "동적인 이벤트 페이지 구현을 위한 jQuery 인터랙션 개발",
        ],
        techStack: ["HTML", "CSS", "jQuery", "UI Interaction"],
      },
    ],
  },
];
