// data/experiences.ts
// data/experiences.ts 상단에 추가

import {
  CAMPAIGN_LIST,
  DIRECT_HISTORY_DATA,
  HSP_HISTORY_DATA,
} from "./constants";
/** 리스트에 들어갈 개별 아이템 타입 (기존 CampaignItem 구조와 동일) */
export interface HistoryItem {
  id: string | number;
  date: string;
  title: string;
  url?: string;
}

/** 이미지 아이템을 위한 인터페이스 정의 */
export interface ProjectImage {
  src: string; // 이미지 경로
  width?: number; // 너비 (선택)
  height?: number; // 높이 (선택)
  alt?: string; // 대체 텍스트 (접근성용)
  className?: string; // 특정 이미지에만 줄 CSS 클래스 (선택)
}
/** 프로젝트 아이템 리스트 정보를 담을 객체 타입 정의 */
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

    images?: ProjectImage[];
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
        title: "HSP 상담 플랫폼 마이그레이션 & 고도화",
        period: "2025.01 ~ 상시운영",
        description:
          "기존 레거시 상담 시스템을 Next.js 기반으로 전면 개편하고, 이후 D2F 및 전자명함 등 신규 비즈니스 기능을 지속적으로 확장",
        tasks: [
          "SSR → CSR(Next.js) 전환 및 React-Query 도입으로 비동기 상태 관리 최적화",
          "기획서 부재 상황에서 역으로 API 흐름과 UI/UX를 설계하여 개발 주도 및 Figma 문서화",
          "FP 리스트 호출 최적화(Lazy Loading) 및 외부 유입 트래킹 로직 재설계",
          "운영 중단 없는 2단계 순차적 오픈 전략 수립 및 성공적 런칭 (3월)",
          "오픈 이후 전자명함, D2F 연계 등 신규 비즈니스 요구사항을 애자일하게 반영하여 플랫폼 고도화",
        ],
        techStack: [
          "Next.js",
          "React",
          "TypeScript",
          "Styled Components",
          "SCSS",
          "Figma",
        ],
        images: [
          {
            src: "/images/hanwha_hsp.png",
            alt: "한화생명 HSP 상담 서비스 개편 ",
          },
        ],
        projectItemList: {
          title: "HSP상담 구축 및 운영 히스토리",
          description: "Development History",
          items: HSP_HISTORY_DATA,
        },
      },
      {
        title: "다이렉트 웹 & 백오피스 운영",
        period: "2023.08 ~ 2024.12",
        description:
          "보험 상품 가입을 위한 대고객 다이렉트 웹 서비스 및 내부 운영 효율화를 위한 백오피스 시스템 개발",
        tasks: [
          "React 기반의 대고객 서비스 컴포넌트 개발 및 유지보수",
          "신규 서비스(AI 상담, 보장분석)의 UI 마크업 및 인터랙션 로직 구현",
          "파편화되어 있던 다이렉트 웹과 온슈어 상품 페이지 간의 '공통 레이아웃 가이드'를 주도적으로 제안 및 정립하여 중복 개발 리소스 최소화",
          "공용 Footer 및 약관 페이지를 적응형에서 '반응형'으로 리팩토링하여 유지보수 효율 증대",
          "백오피스 기능 고도화 프론트엔드 개발",
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
          title: "다이렉트 웹 운영 및 신규 서비스 상세",
          description: "Project History",
          items: DIRECT_HISTORY_DATA,
        },
      },
    ],
  },

  {
    id: "kakao-ent",
    company: "카카오 엔터프라이즈",
    role: "워크개발 / 마크업개발파트",
    period: "2020.07 - 2023.08 (3년 2개월)",
    color: "bg-yellow-400",
    summary: [
      "React, Svelte, Angular 등 다양한 프론트엔드 프레임워크 기반의 대규모 서비스 구축 및 운영",
      "카카오워크 내 주요 기능(투표/할일)을 4종 OS(Win/Mac/iOS/Android) 대응 웹뷰로 구현",
      "CSS Variables 및 Atomic CSS(AdorableCSS)를 도입하여 다크모드 시스템 및 스타일 아키텍처 구축",
    ],
    description:
      "다양한 기술 스택(React, Svelte, Angular)을 넘나들며 엔터프라이즈급 서비스의 UI/UX를 책임졌습니다.\n특히 4가지 OS 환경에 대응하는 크로스 플랫폼 웹뷰 개발을 통해, 네이티브 앱과 이질감 없는 고품질의 웹 경험을 구현하는 데 주력했습니다.",
    projects: [
      {
        title: "카카오워크 투표 (Vote)",
        period: "2023.03 - 2023.06",
        description:
          "4종 OS(Win, Mac, iOS, Android) 네이티브 앱 내 탑재되는 웹뷰 기반 투표 서비스 구축",
        tasks: [
          "React 기반 컴포넌트 개발 및 Atomic CSS(AdorableCSS)를 활용한 스타일링 시스템 구축",
          "OS별(Mobile/Desktop) UX 차이를 고려한 반응형 레이아웃 분기 처리 및 공통 로직 모듈화",
          "CSS Variables(:root)를 활용한 'System/Dark/Light' 테마 스위칭 시스템 설계 및 적용",
          "TypeScript Props 인터페이스 설계를 통한 데이터 상태 관리 및 스타일 제어 로직 구현",
        ],
        techStack: ["React", "TypeScript", "SCSS", "AdorableCSS"],
        images: [
          {
            src: "/images/kakao_vote.png",
            width: 300,
            alt: "카카오워크 투표 ",
          },
        ],
      },
      {
        title: "카카오워크 할 일 (Todo)",
        link: "https://www.kakaowork.com/about/task#tab1",
        period: "2022.08 - 2023.04",
        description:
          "기존 네이티브 앱 기능을 웹(Svelte)으로 전환(Migration)하여 유지보수 효율성 및 사용성 개선",
        tasks: [
          "고성능 프레임워크 Svelte를 도입하여 네이티브 앱 수준의 빠른 렌더링 속도와 반응성 확보",
          "User Agent 감지를 통한 OS별 분기 처리로 모바일/데스크탑 환경에 최적화된 UX 제공",
          "Window Resize 이벤트에 대응하는 반응형 레이아웃 정책 수립 및 구현",
          "복잡한 할 일 관리 상태(완료, 미완료, 수정 등)에 따른 정교한 UI 인터랙션 구현",
        ],
        techStack: ["Svelte", "TypeScript", "SCSS", "AdorableCSS"],
        images: [
          {
            src: "/images/kakao_todo.png",
            alt: "카카오워크 할일 PC ",
          },
          {
            src: "/images/kakao_todo_m.png",
            width: 300,
            alt: "카카오워크 할일 모바일 ",
          },
        ],
      },
      {
        title: "카카오워크 음성채팅 웹뷰 구현",
        period: "2022.06 - 2022.09",
        description:
          "PC 클라이언트(Win, Mac) 내 음성채팅 기능을 위한 고도화된 UI 개발",
        tasks: [
          "비즈니스 로직(JS)과 뷰 레이어(UI)의 효율적인 협업을 위해 마크업 및 스타일링 아키텍처 전담 설계",
          "다자간 통화 시 발생하는 다양한 사용자 상태(발화 중, 음소거, 연결 대기 등)별 UI/UX 시나리오 구현",
          "Svelte 기반 코드 위에서 디자인 정합성을 100% 맞추기 위한 미세 스타일 튜닝",
        ],
        techStack: ["Svelte", "SCSS", "AdorableCSS"],
        images: [
          {
            src: "/images/kakao_voice.png",
            width: 500,
            alt: "카카오워크 음성 채팅 ",
          },
        ],
      },
      {
        title: "근태 2.0 (Attendance System)",
        period: "2021.07 - 2022.06",
        description:
          "PC 브라우저 기반의 차세대 카카오워크 근태 관리 서비스 프로토타이핑 및 개발",
        tasks: [
          "5개 직군(기획, UX, 디자인, 마크업, FE)이 참여하는 Agile 조직에서 개발 및 아이데이션 주도",
          "Vite + Svelte 도입으로 빌드 속도 최적화 및 빠른 개발 사이클(DX) 환경 구축",
          "복잡한 근태 정책을 직관적으로 보여주는 대시보드 UI 및 관리자(Admin) 페이지 개발",
          "초기 데모 페이지의 신속한 개발을 통해 기획 단계에서의 리스크 사전 식별 및 방향성 수립",
        ],
        techStack: ["Svelte", "TypeScript", "Vite"],
        images: [
          {
            src: "/images/kakao_attendance_1.png",
            alt: "카카오워크 근태 ",
          },
          {
            src: "/images/kakao_attendance_2.png",
            alt: "카카오워크 근태 ",
          },
        ],
      },
      {
        title: "카카오 i 엔터프라이즈 빌더 2.0",
        period: "2021.02 - 2023.03",
        description:
          "PC 기반 챗봇 빌더 서비스의 프레임워크 마이그레이션 및 리팩토링",
        tasks: [
          "Legacy(Angular)에서 Modern(React) 스택으로의 점진적 마이그레이션 수행",
          "Atomic CSS 방법론(AdorableCSS) 첫 도입으로 방대한 스타일 코드의 중복 제거 및 경량화",
          "복잡한 봇 시나리오 설계를 위한 'Drag & Drop' 인터랙션 및 상태 관리 UI 구현",
        ],
        techStack: ["React", "TypeScript", "Vite", "SCSS"],
        link: "https://kakaoenterprise.gitbook.io/kakao-i-builder/",
      },
      {
        title: "전사 서비스 운영 및 품질 고도화",
        period: "2020.07 - 2021.01",
        description:
          "카카오 엔터프라이즈 주요 서비스의 UI 유지보수 및 성능/웹 접근성 개선",
        tasks: [
          "카카오엔터프라이즈 공식 사이트: 시멘틱 마크업 전면 교체 및 반응형 UI 최적화",
          "이메일 템플릿 시스템: 다크모드 대응 및 크로스 클라이언트(Outlook, Gmail 등) 호환성 확보",
          "캐스퍼 어시스턴트: 이미지 Lazy Loading 및 CSS 애니메이션 최적화로 렌더링 성능 개선",
          "카카오 i 어드민: Angular Material 기반의 UI 커스터마이징 및 디자인 고도화",
        ],
        techStack: ["HTML/CSS", "Angular", "Responsive"],
      },
    ],
  },
  {
    id: "musinsa",
    company: "29CM(무신사)",
    role: "Platform / Cell FE",
    period: "2017.02 - 2020.07 (3년 6개월)",
    color: "bg-black",
    summary: [
      "AngularJS 기반 29CM 웹 서비스 전면 리뉴얼 및 PC/Mobile 통합 운영 리딩",
      "삼성화재, 렉서스 등 대규모 트래픽 미디어 캠페인의 인터랙션 개발 주도 (앤어워드 2회 수상)",
      "기획 공백을 메우는 주도적인 UI/UX 제안과 공통 모듈화로 개발 생산성 및 협업 효율 증대",
    ],
    description:
      "마크업과 프론트엔드의 경계에서 최상의 UI 퀄리티를 구현했습니다.\n서비스 전면 개편부터 운영까지 전 과정을 주도하였으며, 특히 고도화된 인터랙션이 필요한 브랜드 캠페인을 성공적으로 이끌며 기술이 브랜딩에 기여하는 경험을 쌓았습니다.",
    projects: [
      {
        title: "29CM 사이트 전면 개편 및 통합 운영",
        link: "https://www.29cm.co.kr/",
        period: "2017.05 ~ 2018.02 (이후 상시 운영)",
        description:
          "AngularJS 기반의 PC/Mobile 원페이지 반응형 웹(SPA) 구축 및 통합 유지보수 총괄",
        tasks: [
          "메인, 상품상세, 장바구니, 주문서 등 커머스 핵심 영역 및 매거진/이벤트 페이지 전면 개편",
          "OSMU(One-Source Multi-Use) 반응형 전략 수립으로 PC/Mobile 중복 개발 리소스 50% 이상 절감",
          "SPA(Single Page Application) 구조 도입으로 페이지 전환 속도 및 사용자 경험 개선",
          "개편 이후 29CM 전체 레거시 소스 및 신규 기능 개발에 대한 전담 관리 수행",
          "기획/디자인 의도를 기술적으로 최적화하여 구현하는 'Tech-Design' 가이드라인 주도",
        ],
        techStack: ["AngularJS", "SCSS", "Git"],
      },
      {
        title: "공통 UI 컴포넌트 패키지 'ruler' 개발",
        period: "2017.05 ~ 상시 운영",
        description:
          "UI 일관성 유지 및 개발 생산성 향상을 위한 사내 공통 컴포넌트 라이브러리 구축",
        tasks: [
          "전사적으로 파편화된 UI 요소를 통합 관리하는 컴포넌트 패키지 'ruler' 설계 및 배포 프로세스 정립",
          "버전 관리(Versioning) 시스템 도입으로 다수 프로젝트 간의 스타일 충돌 방지 및 유지보수 안정성 확보",
          "반복되는 UI 코드를 모듈화/자산화하여 마크업 및 프론트엔드 작업 시간 단축에 기여",
          "Git 기반의 중앙화된 소스 관리로 디자이너와 개발자 간의 산출물 정합성 100% 유지",
        ],
        techStack: ["AngularJS", "SCSS", "Git"],
        images: [
          {
            src: "/images/29cm_ruler_1.png",
            alt: "29CM 공통 컴포넌트 패키지 ruler 구조",
          },
          {
            src: "/images/29cm_ruler_2.png",
            alt: "29CM 공통 컴포넌트 패키지 ruler 구조",
          },
          {
            src: "/images/29cm_ruler_3.png",
            alt: "29CM 공통 컴포넌트 패키지 ruler 구조",
          },
        ],
      },
      {
        title: "인터랙티브 브랜드 캠페인 & 미디어 PT",
        period: "2017.07 ~ (프로젝트성)",
        description:
          "삼성화재, 렉서스 등 주요 브랜드 제휴 캠페인을 위한 고성능 인터랙션 페이지 개발",
        tasks: [
          "정적인 웹 경험을 넘어선 스크롤 기반 스토리텔링 및 마이크로 인터랙션(Micro-interaction) 구현",
          "고해상도 이미지/영상 리소스의 렌더링 성능 최적화로 버벅임 없는 스크롤 경험 제공",
          "기존 플랫폼의 제약을 뛰어넘는 '세로형 PT' 포맷을 기술적으로 정립하여 광고 매출 증대에 기여",
          "디자인 의도의 100% 구현을 위해 애니메이션 프로토타입을 선제작하여 역제안하는 등 협업 주도",
          "성과: 삼성화재 1차/2차 캠페인 앤어워드( &Award) 2회 수상 기여",
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
        title: "29TV (숏폼 비디오 커머스 플랫폼)",
        period: "2019.09 ~ 2020.01",
        description: "29초 영상 큐레이션을 통한 신규 V-Commerce 서비스 구축",
        tasks: [
          "다양한 디바이스 환경에 대응하는 반응형 비디오 플레이어 UI/UX 개발",
          "동영상 데이터 프리로딩(Pre-loading) 및 지연 로딩 적용으로 초기 로딩 속도 최적화",
          "크로스 브라우징 이슈 해결을 통해 모바일 웹 및 인앱 브라우저 호환성 확보",
        ],
        techStack: ["AngularJS", "Video.js", "SCSS"],
        images: [
          {
            src: "/images/29cm_tv.png",
            alt: "29CM 숏폼 비디오 커머스 ",
          },
        ],
      },
      {
        title: "월간 컬쳐 캘린더 (Culture Calendar)",
        period: "2019.01 ~ 2019.03",
        description: "월간 문화 콘텐츠 큐레이션 서비스 개발 및 운영",
        tasks: [
          "기획서가 부재한 상황에서, 주도적으로 UI 레이아웃 및 인터랙션 시나리오를 설계하여 제안",
          "단순 정보 나열 방식을 탈피한 동적 캘린더 UI 구현으로 사용자 체류 시간 증대 유도",
          "데이터 바인딩 로직과 마크업 구조를 분리/최적화하여 유지보수 용이성 확보",
        ],
        techStack: ["HTML", "SCSS", "JavaScript"],
        images: [
          {
            src: "/images/29cm_c.png",
            alt: "29CM 캘린더 ",
          },
        ],
      },
    ],
  },
  {
    id: "douzone",
    company: "더존 비즈온",
    role: "UI 개발팀 (전임)",
    period: "2016.05 - 2016.12 (7개월)",
    color: "bg-blue-600",
    summary: [
      "기업용 비즈니스 플랫폼 WEHAGO의 초기 React UI 아키텍처 및 마크업 표준 설계",
      "1인 리드 개발자로서 외부 협력사/프리랜서 인력의 개발 가이드라인 수립 및 품질 관리",
      "비즈니스 핵심 모듈의 UI 안정성 확보를 위한 코드 리팩토링 및 최적화 (Quality Assurance)",
    ],
    description:
      "WEHAGO 플랫폼의 런칭 초기 멤버로서, 당시 생소했던 React 환경의 UI 개발 표준을 정립했습니다.\n1인 개발자라는 환경 속에서도 외부 인력을 효율적으로 리딩하여 방대한 B2B 서비스의 UI 퀄리티를 상향 평준화시켰습니다.",
    projects: [
      {
        title: "WEHAGO 플랫폼 초기 구축 및 표준화",
        period: "2016.05 - 2016.12",
        description:
          "초대형 B2B 플랫폼(WEHAGO)의 초기 UI 기반을 다지고 핵심 기능을 구현",
        tasks: [
          "React 기반의 신규 프로젝트 UI 컴포넌트 구조 설계 및 마크업 표준화 (Component Architecture)",
          "다수의 외부 프리랜서 및 협력사와의 협업을 위한 'UI 개발 컨벤션 가이드라인' 제작 및 배포",
          "외부 산출물의 퀄리티 이슈를 해결하기 위해 리스트, 그리드 등 핵심 UI 모듈 전면 재개발(Refactoring)",
          "복잡도가 높은 엔터프라이즈급 화면(회계관리, 전자세금계산서, 인사급여, 스마트A 등) UI 정밀 구현",
        ],
        techStack: ["React.js", "HTML5/CSS3", "SCSS", "Git"],
        images: [
          {
            src: "/images/douzone_1.png",
            alt: "더존 비즈온 WEHAGO UI",
          },
          {
            src: "/images/douzone_2.png",
            alt: "더존 비즈온 WEHAGO UI",
          },
        ],
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
    description:
      "첫회사인 만큼  일하는 방법을 차근차근 배울수 있었던 하이브랩. 대형 회사와 협업 또는 파견으로 운영 방식과 업무롤에 대한 이해도를 높이며 경험을 쌓았습니다. ",
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
        images: [
          {
            src: "/images/hivelab_1.png",
            alt: "하이브랩 CJ 파견",
          },
        ],
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
