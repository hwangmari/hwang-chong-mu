# 프론트엔드 런타임 구조

상태: Active  
작성일: 2026-03-18  
목표: Next.js App Router, styled-components, client/server 경계, 공통 provider 구조를 설명

---

## 1. 범위

이 문서는 UI 구현 기술과 런타임 경계를 다룬다.

포함 범위:

- App Router 구성
- Client Component / Server Component 경계
- styled-components SSR 처리
- 전역 Provider
- 문서 페이지(`/docs`)에서 사용한 경계 분리 원칙

---

## 2. 기본 런타임

- Framework: Next.js 16
- Rendering model: App Router
- UI library: React 19
- Styling: styled-components
- Shared UI package: `@hwangchongmu/ui`

현재 프로젝트는 대부분의 기능 페이지가 `use client` 기반으로 작성되어 있다.  
즉, React Server Components의 이점을 적극 활용하는 구조라기보다, App Router 위에 전통적인 client-driven UI를 얹은 형태에 가깝다.

---

## 3. 전역 레이아웃 역할

`app/layout.tsx`는 실제로 다음 세 가지 축을 묶는 진입점이다.

### 3-1. 스타일 레지스트리

- `StyledComponentsRegistry`

역할:

- 서버 렌더링 시 styled-components 스타일 수집
- hydration 시 스타일 누락 방지

### 3-2. 전역 모달 인프라

- `ModalProvider`

역할:

- `openAlert`, `openConfirm` 같은 인터랙션을 전역 Promise API로 통일

### 3-3. 전역 헤더

- `GlobalHeader`

역할:

- 현재 위치 기반 제목 표시
- 메뉴 네비게이션 제공
- 뒤로 가기 정책 제공

---

## 4. styled-components SSR 처리 방식

현재 프로젝트는 `lib/registry.tsx`에서 `ServerStyleSheet`를 사용해 스타일을 삽입한다.

핵심 동작:

1. 서버에서 style sheet 생성
2. `useServerInsertedHTML`로 style element 주입
3. 클라이언트에서는 바로 `UiProvider`만 렌더

의미:

- App Router 환경에서 styled-components를 안정적으로 쓰기 위한 최소 구성

주의:

- `styled-components`를 사용하는 컴포넌트는 client component이거나,
  styled registry 경계 안에서 안전하게 렌더되어야 한다.
- 서버 페이지에서 Node API와 styled-components client 컴포넌트를 섞을 때 경계를 명확히 해야 한다.

---

## 5. Client / Server 경계 원칙

현재 코드베이스는 client component 비중이 높지만, `/docs`처럼 파일 시스템 접근이 필요한 기능은 server component가 필요하다.

### 권장 경계

#### Server Component가 맡을 일

- 파일 읽기
- 정적 데이터 집계
- 라우트 파라미터 해석
- metadata 생성

#### Client Component가 맡을 일

- styled-components 기반 UI
- 브라우저 이벤트
- 토글/메뉴 인터랙션
- Markdown 렌더링처럼 UI 전용 처리

### 실제 예시

문서 페이지 구현에서 아래 원칙을 적용했다.

- `lib/docs.ts`
  - Node `fs`
  - 문서 파일 읽기
  - slug 해석
- `app/docs/page.tsx`, `app/docs/[...slug]/page.tsx`
  - 서버에서 문서 데이터 준비
- `app/docs/components/DocsShell.tsx`
  - 클라이언트 styled-components UI
- `app/docs/components/MarkdownRenderer.tsx`
  - 클라이언트 렌더링 처리

이 패턴은 향후 블로그, changelog, release notes 같은 문서형 기능에도 재사용 가능하다.

---

## 6. 공통 UI 패턴

### 6-1. 공통 컴포넌트 재사용

반복적으로 사용되는 공통 컴포넌트:

- `CreateButton`
- `FooterGuide`
- `PageIntro`
- `Modal`
- `ColorPickerPanel`

의미:

- 메뉴가 여러 개라도 진입 UX를 통일할 수 있다
- 온보딩 비용을 줄일 수 있다

### 6-2. 공통 레이아웃

`components/styled/layout.styled.tsx` 기반 래퍼를 여러 메뉴가 재사용한다.

효과:

- 일관된 폭과 여백
- 모바일 대응의 반복 감소

---

## 7. 현재 프론트엔드 구조의 장점

- 구현 속도가 빠르다
- 메뉴별 독립성이 높다
- 전역 UI 장치가 있어 제품 통일감이 있다
- styled-components 기반으로 화면 커스터마이징 자유도가 높다

---

## 8. 현재 프론트엔드 구조의 한계

- client component 비중이 높아 서버 렌더링 이점을 덜 활용한다
- 메뉴별 스타일 문법이 완전히 통일되진 않았다
- 일부 페이지는 로직과 뷰 결합도가 높다
- server/client 경계 실수가 생기면 styled-components 관련 런타임 에러가 발생할 수 있다

---

## 9. 개선 가이드

### 단기

- server-only 책임과 client-only 책임을 문서화
- `/docs`처럼 혼합 구조가 필요한 경우 패턴 재사용
- 페이지 컨테이너와 UI 컴포넌트 분리 강화

### 중기

- 메뉴별 컨테이너 / 프레젠테이션 분리
- 공통 page shell 정리
- shared markdown / docs renderer 재사용화

### 장기

- 메뉴별 RSC 활용 후보 검토
- data fetching을 server component로 끌어올릴 수 있는 영역 탐색

---

## 10. 결론

황총무 프론트엔드는 "App Router 위에 구축된 실용적 client-driven 제품군"이라고 보는 것이 정확하다.  
핵심 과제는 새로운 프레임워크 패턴 도입보다, 현재 구조에서 **경계와 책임을 명확히 하고 재사용 규칙을 강화하는 것**이다.
