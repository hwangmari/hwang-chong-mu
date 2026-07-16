# 포트폴리오 서비스 구조 설계

> 2026-07-15 기준. 포트폴리오(portfolio) 서비스의 화면 구조와 정적 데이터 모델을 정리한다.
> 메뉴 관점 분석은 [menu-details/portfolio.md](../menu-details/portfolio.md) 참고. (데이터 저장이 없어 저장 아키텍처 항목은 짧다)

## 1. 서비스 개요

개발자 소개·경력·토이 프로젝트 아카이브를 한 화면에 담은 정적 브랜딩 페이지. 다른 서비스와 달리 **백엔드 저장소가 전혀 없다** — 모든 콘텐츠가 코드에 하드코딩되어 있고, 페이지는 조립(assembly) 역할만 한다.

- 소개(자기소개+프로필) → 커리어 그래프 → 핵심 역량 → 이력서(경력 타임라인) → 토이 프로젝트 아카이브 → 푸터 순으로 구성된 단일 스크롤 페이지
- 경력 상세(`/portfolio/experience/[id]`)와 UI Kit(`/ui-kit`, 이 문서 범위 밖)로 갈라지는 두 개의 하위 경로가 있다

## 2. 화면·컴포넌트 구조

```text
app/portfolio/page.tsx                  페이지 조립 — 소개/커리어그래프/핵심역량 카드/이력서/프로젝트/푸터
├── PortfolioInfo.tsx                   헤더: 소개문구 + 프로필카드 + 외부링크(GitHub/Blog/Email)
│   ├── Introduction.tsx                메인 카피 텍스트
│   └── ProfileCard.tsx                 프로필 이미지(next/image, priority) + 메타 정보
├── CareerGraph.tsx                     SVG 커리어 타임라인 (마일스톤 곡선 + 회사별 인터랙티브 바)
├── (page.tsx 내 HighlightCard)         핵심 역량 4카드 — framer-motion 마우스 추적 글로우
├── ResumeSection.tsx                   스킬/학력 + 경력 타임라인 (data/experiences.tsx 순회)
│   └── app/portfolio/experience/[id]/page.tsx   경력 상세 — 회사별 프로젝트 목록
│       └── experience/ProjectItem.tsx           프로젝트 카드(설명/업무/스택/이미지/연혁토글)
│           └── experience/ProjectItemList.tsx   연혁 타임라인(연도 그룹, next/image)
└── project/ProjectSection.tsx          "Toy Projects" 섹션 헤더 + UI Kit 배너 + 앵커 네비게이션
    └── project/ProjectList.tsx         서비스별 ProjectCard 10개를 하드코딩 나열
        └── project/ProjectCard.tsx     서비스 카드(문제/해결/기술 + 선택적 로직도해/히스토리/이미지)
            └── project/ProjectVisuals.tsx  LogicFlowChart, DevLog (일부 카드에만 표시)
```

프로젝트 이미지는 공용 `components/common/ProjectImageViewer`를 `ProjectItem.tsx`·`ProjectCard.tsx`가 함께 사용한다.

애니메이션/이미지 사용처(2026-07-15 기준 grep 실측):

| 기법 | 사용 파일 |
|---|---|
| framer-motion | `page.tsx`(핵심역량 카드 호버 글로우), `CareerGraph.tsx`(SVG path/점 애니메이션, 회사 바 레이아웃 전환) |
| next/image | `ProfileCard.tsx`, `experience/ProjectItem.tsx`, `experience/ProjectItemList.tsx` |

## 3. 데이터 모델

`types/experiences.ts` — 전부 코드에 하드코딩되며 별도 백엔드가 없다:

```ts
interface Experience {
  id: string; company: string; role: string; period: string; color: string;
  summary: string[]; workSummary: string[];
  projects: Project[];
}

interface Project {
  title: string; period: string; description: string;
  tasks: string[]; techStack: string[]; link?: string;
  projectItemList?: ProjectHistoryGroup;   // 연혁 타임라인(연도별 그룹)
  images?: ProjectImage[];
}

interface ProjectHistoryGroup { title: string; items: ProjectHistoryItem[]; description?: string; }
interface ProjectHistoryItem { id: string | number; date: string; title: string; url?: string; }
interface ProjectImage { src: string; width?: number; height?: number; alt?: string; className?: string; }
```

실 데이터는 `data/experiences.tsx`(+ `data/constants.ts`의 히스토리 상수들)에 있으며, `ResumeSection`과 경력 상세 페이지가 이 배열을 그대로 순회한다.

## 4. 저장 아키텍처

없음. Supabase·localStorage 어느 것도 쓰지 않는 **완전 정적 페이지**다.

- 이미지 자산은 `/public/images/*.png`로 직접 서빙되고, `data/experiences.tsx`·`ProjectList.tsx` 안에서 경로 문자열로 참조된다
- `CareerGraph.tsx`의 `COMPANIES`/`MILESTONES` 배열도 컴포넌트 파일 안에 하드코딩되어 있다 — `data/` 디렉토리로 분리되지 않은 유일한 콘텐츠 소스

## 5. 도메인 로직 메모

- **CareerGraph 좌표 변환**: `getX(year)`/`getY(level)`가 연도·레벨(0~100)을 SVG 좌표로 매핑하고, `buildPath()`가 마일스톤 점들을 3차 베지어(cubic bezier)로 이어 부드러운 곡선을 만든다. 회사 바에 마우스를 올리면 `hoveredCompany` 상태로 그래프 구간이 하이라이트되고, 클릭하면 `selectedCompany`로 해당 바가 `flex: 8`로 확장되며 회사 상세(역할/기간/하이라이트)를 인라인으로 펼친다
- **앵커 네비게이션 동기화**: `ProjectSection.tsx`의 `TOY_PROJECT_MENU` 배열(레이블+id)이 페이지 내 앵커 링크를 만들고, `ProjectList.tsx`가 각 `ProjectCard`에 동일한 `anchorId`를 수동으로 부여해 매칭한다 — 이 둘은 코드로 강제되지 않은 수동 동기화다
- **ProjectCard 3분할 설명**: 모든 토이 프로젝트 카드가 "⚠️ 기획 배경 / 💡 해결 전략 / 🛠 기술 구현" 3분류로 통일된 스토리텔링 구조를 갖는다 (`details.problem`/`solution`/`tech`)
- **경력 상세 라우팅**: `/portfolio/experience/[id]`는 `experiences.find(exp => exp.id === id)`로 정적 배열에서 직접 찾는다 — 못 찾으면 "찾을 수 없는 페이지" 문구만 표시(별도 404 처리 없음)
- `app/portfolio/opengraph-image.tsx`로 소셜 공유용 OG 이미지를 라우트 핸들러로 생성한다

## 6. 알려진 제약 / 후속 과제

- 콘텐츠가 코드에 강결합됨(`data/experiences.tsx`, `project/ProjectList.tsx` 내 JSX 하드코딩) — 경력/프로젝트 갱신마다 코드 수정+재배포가 필요, CMS나 JSON 분리 여지
- `TOY_PROJECT_MENU`(네비 메뉴)와 `ProjectCard.anchorId`가 수동 동기화라 새 토이 프로젝트 추가 시 두 곳을 모두 갱신하지 않으면 앵커 링크가 조용히 깨진다
- `experience/ProjectItem.tsx`의 `project`/`color` prop이 `any` 타입으로 선언되어 있어 `types/experiences.ts`의 `Project` 타입과 연결되지 않는다
- 검색/태그 필터 기능 없음 — [menu-details/portfolio.md](../menu-details/portfolio.md) 개선 제안 참고
- `/ui-kit`(공용 컴포넌트/토큰 문서)은 `app/portfolio/` 바깥의 별도 라우트라 이 문서 범위 밖이다
