// app/data/experiences.ts

export interface ExperienceData {
  id: string;
  company: string;
  role: string;
  period: string;
  color: string; // 타임라인 점 색상
  summary: string[]; // 메인 페이지 노출용 요약
  projects: {
    title: string;
    period: string;
    description: string;
    tasks: string[]; // 수행 업무 (불렛 포인트)
    techStack: string[];
  }[];
}

export const experiences: ExperienceData[] = [
  {
    id: "hanwha",
    company: "한화생명",
    role: "다이렉트 웹 & 백오피스 개발/ 세일즈파트 (대리)",
    period: "2023.08 - 현재",
    color: "bg-orange-500",
    summary: [
      "디지털프로덕트팀 세일즈 플러스 파트 소속",
      "다이렉트 웹 서비스 및 백오피스 프론트엔드 개발 및 운영",
      "HSP 상담 플랫폼 신규 시스템 마이그레이션 (Legacy → Next.js)",
      "3개 플랫폼(코어/다이렉트/홈페이지) 연동 이슈 해결 및 운영 안정화",
    ],
    projects: [
      {
        title: "D2F",
        period: "2025.01 - 현재",
        description: "",
        tasks: [""],
        techStack: ["Next.js", "React", "TypeScript", "SCSS", "Git/Notion"],
      },
      {
        title: "HSP 상담 플랫폼 고도화 & 마이그레이션",
        period: "2024.01 - 현재",
        description:
          "기존 레거시 상담 시스템을 Next.js 기반의 CSR 환경으로 전면 마이그레이션하고, 3개 플랫폼(코어/다이렉트/홈페이지) 간의 복잡한 연동 구조를 재설계하여 안정적으로 오픈했습니다.",

        // 🔹 여기가 핵심입니다! (4가지 역량으로 분류)
        tasks: [
          // 1. 기술적 기여 (Tech)
          "SSR → CSR(Next.js) 전환 및 React-Query 도입으로 비동기 상태 관리 최적화",
          "FP 리스트 호출 시점 최적화(지역 선택 시 호출)로 불필요한 트래픽 감소",
          "서버 시간 기준 타임 로직 구현 및 휴일 대응 UX 고도화",

          // 2. 시스템 연계 & 문제 해결 (Problem Solving)
          "3개 플랫폼(코어/다이렉트/홈페이지) 간 데이터 정합성 이슈 해결 (UTM, DI_GUBUN 누락 대응)",
          "잠재고객 안심번호 누락 이슈 식별 및 복호화 로직 구현으로 만족도 조사 전송률 100% 복구",
          "외부 유입(이벤트 배너, GA) 트래킹 로직 재설계 및 파라미터 처리",

          // 3. 커뮤니케이션 & 문서화 (Soft Skill)
          "기획서 부재 상황에서 역으로 API 흐름과 UI/UX를 설계하여 개발 주도",
          "구두로 전해지던 히스토리를 Notion에 문서화 (API 흐름도, 에러 케이스, 실패 대응 매뉴얼)",
          "운영 중단 없는 2단계 순차적 오픈 전략 수립 및 성공",
        ],
        techStack: ["Next.js", "React", "TypeScript", "SCSS", "Git/Notion"],
      },

      {
        title: "다이렉트 웹 & 백오피스",
        period: "2023.08 - 현재",
        description:
          "보험 상품 가입을 위한 다이렉트 웹 서비스 및 내부 운영을 위한 백오피스 시스템 개발",
        tasks: [
          "React 기반의 컴포넌트 개발 및 유지보수",
          "백오피스 내 상품 관리 및 운영 효율화를 위한 기능 개발",
          "디자인 시스템 가이드 준수 및 공통 컴포넌트화",
        ],
        techStack: ["React", "TypeScript", "SCSS"],
      },
    ],
  },

  {
    id: "kakao-ent",
    company: "카카오 엔터프라이즈",
    role: "워크개발 / 마크업개발파트",
    period: "2020.07 - 2023.08",
    color: "bg-yellow-400",
    summary: [
      "카카오워크 투표, 할 일, 근태관리 등 주요 기능 FE 개발",
      "4종 OS(Mac, Win, iOS, Android) 웹뷰 대응 및 공통 모듈화",
    ],
    projects: [
      {
        title: "카카오워크 투표 (Vote)",
        period: "2023.03 - 2023.06",
        description:
          "4종 OS(Mac, Win, iOS, Android) 네이티브 앱 내 웹뷰로 투표 기능 구현",
        tasks: [
          "React 컴포넌트 개발, CSS Module (SCSS, AdorableCSS)",
          "모바일/데스크탑 레이아웃 분리 및 공통 기능 모듈화",
          "CSS Variables(:root)를 활용한 다크모드 대응",
        ],
        techStack: ["React", "TypeScript", "SCSS", "AdorableCSS"],
      },
      {
        title: "카카오워크 할 일 (Todo)",
        period: "2022.08 - 2023.04",
        description:
          "기존 네이티브 앱 서비스를 웹(PC, Mobile)으로 전환하며 사용성 및 기능 개선",
        tasks: [
          "Svelte 컴포넌트 개발 및 TypeScript 적용",
          "User Agent 분기를 통한 모바일 특화 UX 제공",
          "앱 리사이징 정책에 따른 반응형 레이아웃 구현",
        ],
        techStack: ["Svelte", "TypeScript", "SCSS"],
      },
      {
        title: "카카오 i 엔터프라이즈 빌더",
        period: "2021.02 - 2023.03",
        description: "PC 브라우저 기반의 봇 빌더 서비스 리팩토링 및 고도화",
        tasks: [
          "Angular → React 프레임워크 마이그레이션 수행",
          "AdorableCSS 도입으로 스타일 코드 관리 최적화",
        ],
        techStack: ["React", "TypeScript", "Vite"],
      },
    ],
  },
  {
    id: "musinsa",
    company: "무신사 (29CM)",
    role: "Platform / Cell FE",
    period: "2017.02 - 2020.07",
    color: "bg-black",
    summary: [
      "29CM 사이트 개편 및 운영 (Angular 기반)",
      "삼성화재 캠페인 등 대규모 트래픽 이벤트 페이지 개발 (앤어워드 수상)",
    ],
    projects: [
      {
        title: "29CM 사이트 전면 개편 & 운영",
        period: "2017.05 - 2020.07",
        description:
          "Angular 기반 PC/Mobile 원페이지 반응형 웹 구축 및 유지보수",
        tasks: [
          "프론트 UI 리소스 절감을 위한 반응형 화면 구현",
          "기획/디자인 의도에 맞춘 UI 개선 제안 및 협업",
          "개편 이후 전체 소스 관리 및 유지보수 전담",
        ],
        techStack: ["Angular", "RxJS", "SCSS"],
      },
      {
        title: "대규모 캠페인 & 이벤트 (삼성화재 등)",
        period: "2017.07 - 상시",
        description: "단기간 고퀄리티 인터랙션이 필요한 캠페인 페이지 개발",
        tasks: [
          "삼성화재 1차, 2차 등 주요 캠페인 인터랙션 개발 (앤어워드 수상)",
          "마크업에서 구현 가능한 최적의 애니메이션 제안 및 가이드화",
        ],
        techStack: ["HTML/CSS", "JavaScript", "Animation"],
      },
      {
        title: "29TV (숏폼 비디오 서비스)",
        period: "2019.09 - 2020.01",
        description: "29초 영상 큐레이션 서비스 구축",
        tasks: [
          "PC/Mobile 반응형 비디오 플레이어 UI 구현",
          "동영상 로딩 최적화 및 UX 개선",
        ],
        techStack: ["Angular", "Video.js"],
      },
    ],
  },
  {
    id: "douzone",
    company: "더존 비즈온",
    role: "UI 개발팀 (전임)",
    period: "2016.05 - 2016.12",
    color: "bg-blue-600",
    summary: [
      "신규 프로젝트 WEHAGO React 기반 마크업 개발",
      "외부 인력 가이드 수립 및 리딩",
    ],
    projects: [
      {
        title: "WEHAGO 신규 프로젝트",
        period: "2016.05 - 2016.12",
        description: "비즈니스 플랫폼 WEHAGO의 초기 UI 및 마크업 개발",
        tasks: [
          "React 기반의 마크업 구조 설계 및 컴포넌트 개발",
          "외부 개발 인력을 위한 코딩 가이드라인 제작 및 품질 관리",
          "거래처관리, 일정관리, 전자세금계산서 등 주요 모듈 UI 개발",
        ],
        techStack: ["React", "HTML/CSS"],
      },
    ],
  },
  {
    id: "hivelab",
    company: "하이브랩",
    role: "UIT 웹표준개발팀 (전임)",
    period: "2012.09 - 2016.05",
    color: "bg-gray-400",
    summary: [
      "CJ오쇼핑, 네이버 등 대형 포털/커머스 웹표준 마크업",
      "크로스 브라우징(IE6~) 및 웹 접근성 준수",
    ],
    projects: [
      {
        title: "CJ오쇼핑 파견 및 운영",
        period: "2014.05 - 2016.05",
        description: "CJmall PC/Mobile 및 올리브영 등 패밀리 사이트 운영",
        tasks: [
          "대규모 커머스 사이트 UI 유지보수 및 신규 페이지 제작",
          "웹 접근성 마크업 준수",
        ],
        techStack: ["HTML", "CSS", "jQuery"],
      },
      {
        title: "네이버 서비스 운영",
        period: "2012.09 - 2014.05",
        description: "지식쇼핑, 부동산, 한게임 등 네이버 주요 서비스 마크업",
        tasks: [
          "IE6부터 최신 브라우저까지 완벽한 크로스 브라우징 대응",
          "이미지 스프라이트 기법 등을 활용한 성능 최적화",
        ],
        techStack: ["HTML", "CSS", "Photoshop"],
      },
    ],
  },
];
